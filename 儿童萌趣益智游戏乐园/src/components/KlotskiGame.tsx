/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { Play, RotateCcw, HelpCircle, FileDigit, Timer, Trophy } from 'lucide-react';
import { UserProfile, GameRecord, Achievement } from '../types';
import { UserAvatar } from './UserAvatar';
import { AVATARS } from '../utils/gameHelpers';
import { soundSynth } from '../utils/audio';

interface KlotskiProps {
  profile: UserProfile;
  achievements: Achievement[];
  setProfile: React.Dispatch<React.SetStateAction<UserProfile>>;
  setAchievements: React.Dispatch<React.SetStateAction<Achievement[]>>;
  onPointsChange: (amount: number, reason: string) => void;
  onNotification: (text: string, icon: string) => void;
}

export const KlotskiGame: React.FC<KlotskiProps> = ({
  profile,
  achievements,
  setProfile,
  setAchievements,
  onPointsChange,
  onNotification,
}) => {
  const [gridSize, setGridSize] = useState<3 | 4>(3); // 3x3 default, 4x4 advanced
  const [board, setBoard] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);

  const pointerStartRef = useRef<{ x: number; y: number; index: number } | null>(null);

  // Timer runner
  useEffect(() => {
    let interval: any;
    if (isPlaying && !isCompleted) {
      interval = setInterval(() => {
        setTimeElapsed(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPlaying, isCompleted]);

  // Check board finish state
  useEffect(() => {
    if (board.length === 0) return;
    const target = Array.from({ length: gridSize * gridSize - 1 }, (_, i) => i + 1);
    target.push(0); // empty in the end
    
    // Check match
    const isWin = board.every((val, idx) => val === target[idx]);
    if (isWin && isPlaying) {
      handleGameCompleted();
    }
  }, [board]);

  const generateSolvableBoard = (size: number) => {
    // Start with solved state
    const solved = Array.from({ length: size * size - 1 }, (_, i) => i + 1);
    solved.push(0); // represent blank space as 0

    // To guarantee solvability, perform random VALID slides starting from solved grid!
    let curBoard = [...solved];
    let emptyIdx = curBoard.indexOf(0);

    // Swap adjacent pairs iteratively
    const iterations = size === 3 ? 120 : 250;
    for (let i = 0; i < iterations; i++) {
      const validSwaps: number[] = [];
      const row = Math.floor(emptyIdx / size);
      const col = emptyIdx % size;

      if (row > 0) validSwaps.push(emptyIdx - size); // top
      if (row < size - 1) validSwaps.push(emptyIdx + size); // bottom
      if (col > 0) validSwaps.push(emptyIdx - 1); // left
      if (col < size - 1) validSwaps.push(emptyIdx + 1); // right

      // Random pick one adjacent element to swap
      const chosenIdx = validSwaps[Math.floor(Math.random() * validSwaps.length)];
      curBoard[emptyIdx] = curBoard[chosenIdx];
      curBoard[chosenIdx] = 0;
      emptyIdx = chosenIdx;
    }

    setBoard(curBoard);
    setMoves(0);
    setTimeElapsed(0);
    setIsCompleted(false);
    setIsPlaying(true);
  };

  const handleTileClick = (targetIndex: number) => {
    if (isCompleted || !isPlaying) return;

    const size = gridSize;
    const emptyIndex = board.indexOf(0);

    const targetRow = Math.floor(targetIndex / size);
    const targetCol = targetIndex % size;
    const emptyRow = Math.floor(emptyIndex / size);
    const emptyCol = emptyIndex % size;

    // Check adjacent match (Manhattan distance === 1)
    const isAdjacent = Math.abs(targetRow - emptyRow) + Math.abs(targetCol - emptyCol) === 1;

    if (isAdjacent) {
      const newBoard = [...board];
      newBoard[emptyIndex] = board[targetIndex];
      newBoard[targetIndex] = 0;
      setBoard(newBoard);
      setMoves(prev => prev + 1);
      soundSynth.playMove();
    }
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLButtonElement>, idx: number) => {
    if (isCompleted || !isPlaying) return;
    pointerStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      index: idx
    };
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLButtonElement>, idx: number) => {
    if (!pointerStartRef.current || pointerStartRef.current.index !== idx) return;
    
    const deltaX = e.clientX - pointerStartRef.current.x;
    const deltaY = e.clientY - pointerStartRef.current.y;
    pointerStartRef.current = null;
    
    const minSwipeDistance = 20; // Minimum travel distance to count as a swipe
    if (Math.abs(deltaX) < minSwipeDistance && Math.abs(deltaY) < minSwipeDistance) {
      // Small/no movement: let standard onClick handle the quick click/tap
      return;
    }
    
    const isHorizontal = Math.abs(deltaX) > Math.abs(deltaY);
    const size = gridSize;
    const emptyIndex = board.indexOf(0);
    
    const targetRow = Math.floor(idx / size);
    const targetCol = idx % size;
    const emptyRow = Math.floor(emptyIndex / size);
    const emptyCol = emptyIndex % size;
    
    const isAdjacent = Math.abs(targetRow - emptyRow) + Math.abs(targetCol - emptyCol) === 1;
    if (!isAdjacent) return;
    
    let canMove = false;
    if (isHorizontal) {
      if (deltaX < -minSwipeDistance && emptyRow === targetRow && emptyCol === targetCol - 1) {
        canMove = true; // Swiped Left, and empty spot is left
      } else if (deltaX > minSwipeDistance && emptyRow === targetRow && emptyCol === targetCol + 1) {
        canMove = true; // Swiped Right, and empty spot is right
      }
    } else {
      if (deltaY < -minSwipeDistance && emptyCol === targetCol && emptyRow === targetRow - 1) {
        canMove = true; // Swiped Up, and empty spot is up
      } else if (deltaY > minSwipeDistance && emptyCol === targetCol && emptyRow === targetRow + 1) {
        canMove = true; // Swiped Down, and empty spot is down
      }
    }
    
    if (canMove) {
      const newBoard = [...board];
      newBoard[emptyIndex] = board[idx];
      newBoard[idx] = 0;
      setBoard(newBoard);
      setMoves(prev => prev + 1);
      soundSynth.playMove();
    }
  };

  // Helper calculation for stars rating
  const calcStars = () => {
    if (gridSize === 3) {
      if (moves <= 25 && timeElapsed <= 40) return 3;
      if (moves <= 55 && timeElapsed <= 90) return 2;
      return 1;
    } else {
      if (moves <= 80 && timeElapsed <= 120) return 3;
      if (moves <= 160 && timeElapsed <= 240) return 2;
      return 1;
    }
  };

  const handleGameCompleted = () => {
    setIsCompleted(true);
    soundSynth.playWin();
    const rewardPoints = gridSize === 3 ? 80 : 150;
    onPointsChange(rewardPoints, `顺利解开 ${gridSize}x${gridSize} 数字华容道`);

    setProfile(prev => {
      const recordsCopy = { ...prev.records };
      if (gridSize === 3) {
        recordsCopy.klotskiBestMoves3x3 = Math.min(recordsCopy.klotskiBestMoves3x3, moves);
        recordsCopy.klotskiBestTime3x3 = Math.min(recordsCopy.klotskiBestTime3x3, timeElapsed);
      } else {
        recordsCopy.klotskiBestMoves4x4 = Math.min(recordsCopy.klotskiBestMoves4x4, moves);
        recordsCopy.klotskiBestTime4x4 = Math.min(recordsCopy.klotskiBestTime4x4, timeElapsed);
      }

      return {
        ...prev,
        records: recordsCopy
      };
    });

    // Check achievements
    setAchievements(prev => {
      return prev.map(ach => {
        if (ach.id === 'ach_klotski_1') {
          return { ...ach, progress: 1 };
        }
        return ach;
      });
    });

    onNotification(`太棒了！你用 ${moves} 步共耗时 ${timeElapsed} 秒攻克了数字华容道！🥳 获得 ${rewardPoints} 星星！`, 'Award');
  };

  // Human friendly timer helper
  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-white rounded-[32px] p-5 shadow-xl border-b-8 border-emerald-400 transition-all" id="klotski-game-module">
      {/* Game Header */}
      <div className="flex items-center justify-between mb-4 border-b-2 border-emerald-100 pb-3">
        <div className="flex items-center gap-2">
          <span className="text-3xl animate-bounce">🧩</span>
          <div className="text-left leading-tight">
            <h3 className="font-black text-slate-700 text-sm">数字华容道</h3>
            <p className="text-[10px] text-emerald-500 font-bold mt-0.5">锻炼空间统筹和逻辑大脑 🦁</p>
          </div>
        </div>
        
        <div className="flex gap-1">
          <button 
            onClick={() => {
              soundSynth.playClick();
              setShowInstructions(!showInstructions);
            }}
            className="text-slate-400 hover:text-emerald-600 bg-slate-50 border border-slate-200 p-2 rounded-full transition-all cursor-pointer"
            title="规则帮助"
          >
            <HelpCircle size={14} />
          </button>
          <button 
            onClick={() => {
              soundSynth.playClick();
              generateSolvableBoard(gridSize);
            }}
            className="bg-[#E8F8F0] hover:bg-emerald-100 border border-b-2 border-emerald-200 text-emerald-700 py-1.5 px-3.5 rounded-full text-xs font-black flex items-center gap-1 transition-all cursor-pointer"
          >
            <RotateCcw size={12} /> {isPlaying ? '重新洗牌' : '初始化'}
          </button>
        </div>
      </div>

      {showInstructions && (
        <div className="bg-emerald-50/75 border border-b-4 border-emerald-100 rounded-[24px] p-4 text-[11px] text-slate-600 space-y-1.5 mb-3 text-left">
          <p className="font-black text-emerald-800">💡 怎么玩数字华容道？</p>
          <p>1. <strong>滑动数字或直接点按数字</strong>，就可以把它滑进相邻的空白格中。</p>
          <p>2. 最终目标是把数字排列整齐，3x3 从左到右依次为 <strong className="text-emerald-600 font-black font-mono">1、2、3、4、5、6、7、8</strong>，最后一格空出来。</p>
          <p>3. 步数和时间越少，得到的金色星星奖牌越多哦！</p>
        </div>
      )}

      {/* 🔮 Companion mascot cheerleader banner */}
      {(() => {
        const avatarObj = AVATARS.find(a => a.id === profile.avatarId) || AVATARS[0];
        return (
          <div className="bg-[#FFFDF9] border border-[#FFE0C2] rounded-2xl p-3 flex items-center gap-3 shadow-2xs mb-3 text-left">
            <UserAvatar id={profile.avatarId} className="w-10 h-10 shrink-0 border-2 border-amber-300" />
            <div className="leading-normal flex-1">
              <span className="bg-amber-100 text-[#D97706] font-black text-[8.5px] py-0.5 px-2 rounded-full border border-amber-200">
                {avatarObj.name} 助威中 ✨
              </span>
              <p className="text-[10.5px] text-slate-500 font-medium leading-relaxed mt-1">
                {isCompleted 
                  ? "🏆 哇！太厉害啦！你成功解开了这道数字难题，真是个小神童！" 
                  : isPlaying 
                    ? "💡 慢慢滑动，注意观察空余格附近数字的顺序哟！相信你一定行！" 
                    : "👋 准备好挑战你最快的解谜脑袋了吗？选择下方难度，点击右上角【开始】立即开动吧！"}
              </p>
            </div>
          </div>
        );
      })()}

      {/* Grid Switchers (3x3 vs 4x4) */}
      <div className="flex gap-2 justify-center mb-4">
        <button
          onClick={() => {
            soundSynth.playClick();
            setGridSize(3);
            if (isPlaying) generateSolvableBoard(3);
          }}
          className={`flex-1 py-2.5 px-3.5 rounded-2xl font-black text-xs border-b-4 transition-all duration-75 active:translate-y-0.5 active:border-b-0 cursor-pointer ${
            gridSize === 3 
              ? 'bg-emerald-400 border-emerald-500 text-white shadow-xs' 
              : 'bg-white border text-slate-500 hover:bg-slate-50'
          }`}
          id="btn-switch-3x3"
        >
          🦖 幼幼版 (3x3 块)
        </button>
        <button
          onClick={() => {
            soundSynth.playClick();
            setGridSize(4);
            if (isPlaying) generateSolvableBoard(4);
          }}
          className={`flex-1 py-2.5 px-3.5 rounded-2xl font-black text-xs border-b-4 transition-all duration-75 active:translate-y-0.5 active:border-b-0 cursor-pointer ${
            gridSize === 4 
              ? 'bg-emerald-400 border-emerald-500 text-white shadow-xs' 
              : 'bg-white border text-slate-500 hover:bg-slate-50'
          }`}
          id="btn-switch-4x4"
        >
          🚀 探险版 (4x4 块)
        </button>
      </div>

      {/* Main Playing Interface */}
      {!isPlaying ? (
        <div className="text-center py-10" id="klotski-ready-screen">
          <div className="text-6xl mb-4 animate-bounce">🖐️🧮</div>
          <h4 className="text-sm font-black text-slate-700">准备好了吗？</h4>
          <p className="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed mb-6 font-bold">
            这是一次绝佳的空间逻辑和数字感知力锻炼！移动滑块排好序，激活大脑魔法。
          </p>
          <button
            onClick={() => generateSolvableBoard(gridSize)}
            className="bg-gradient-to-r from-emerald-400 to-teal-500 border-b-4 border-emerald-600 text-white font-black text-xs py-3.5 px-8 rounded-full shadow-md active:translate-y-0.5 active:border-b-0 duration-100 cursor-pointer"
          >
            打乱木块，立即开玩！
          </button>
        </div>
      ) : (
        <div className="space-y-4" id="klotski-active-screen">
          {/* Performance display */}
          <div className="flex items-center justify-around bg-slate-50 py-3 px-4 rounded-2xl border border-b-2 border-slate-200 shadow-inner">
            <div className="flex items-center gap-1.5">
              <FileDigit className="text-teal-500" size={16} />
              <div className="text-left leading-none">
                <span className="text-[9px] text-slate-400 font-black block mb-0.5">累计步数</span>
                <span className="text-xs font-black text-slate-700 font-mono">{moves}</span>
              </div>
            </div>
            
            <div className="w-px h-6 bg-slate-200" />
            
            <div className="flex items-center gap-1.5">
              <Timer className="text-teal-500" size={16} />
              <div className="text-left leading-none">
                <span className="text-[9px] text-slate-400 font-black block mb-0.5">专注耗时</span>
                <span className="text-xs font-black text-slate-700 font-mono">{formatTime(timeElapsed)}</span>
              </div>
            </div>

            <div className="w-px h-6 bg-slate-200" />

            <div className="flex items-center gap-1">
              <span className="text-[9px] font-black text-slate-400">目前星级:</span>
              <span className="text-amber-400 text-xs animate-pulse font-mono font-black block">
                {'★'.repeat(calcStars())}
                {'☆'.repeat(3 - calcStars())}
              </span>
            </div>
          </div>

          {/* Wooden puzzle stage board */}
          <div className="flex justify-center py-1">
            <div 
              className="bg-[#54250C] border-b-8 border-t border-[#301103] p-3 rounded-[24px] shadow-[0_12px_32px_rgba(0,0,0,0.2)] grid gap-2 justify-center select-none"
              style={{
                gridTemplateColumns: `repeat(${gridSize}, minmax(0, 1fr))`,
                width: gridSize === 3 ? '236px' : '284px',
                height: gridSize === 3 ? '236px' : '284px',
                maxWidth: '100%',
              }}
              id="klotski-wood-board"
            >
              {board.map((value, idx) => {
                const isEmpty = value === 0;
                const isCorrect = !isEmpty && value === idx + 1;

                // Determine block font sizing dynamically for a clean look
                const textClass = gridSize === 3 ? 'text-xl font-black' : 'text-lg font-black';

                return (
                  <motion.button
                    layout
                    key={value}
                    onClick={() => handleTileClick(idx)}
                    onPointerDown={(e) => handlePointerDown(e, idx)}
                    onPointerUp={(e) => handlePointerUp(e, idx)}
                    disabled={isEmpty || isCompleted}
                    className={`rounded-xl flex items-center justify-center transition-all select-none focus:outline-none touch-none active:scale-95 ${
                      isEmpty 
                        ? 'bg-[#271003] border border-[#1a0a02] shadow-[inset_0_4px_8px_rgba(0,0,0,0.7)]' 
                        : isCorrect
                          ? 'bg-gradient-to-b from-[#FFEBB3] to-[#FFD566] border-b-[4px] border-[#D1A124] text-[#5C3E00] shadow-sm transform hover:brightness-105 active:translate-y-0.5 active:border-b-[1px] cursor-grab active:cursor-grabbing font-black'
                          : 'bg-gradient-to-b from-[#FDFCF9] to-[#F3EEE3] border-b-[4px] border-[#CDC3B1] text-[#473B25] shadow-sm transform hover:brightness-102 active:translate-y-0.5 active:border-b-[1px] cursor-grab active:cursor-grabbing font-black'
                    } ${textClass}`}
                    style={{
                      height: '100%',
                      aspectRatio: '1',
                    }}
                  >
                    {!isEmpty && value}
                  </motion.button>
                );
              })}
            </div>
          </div>

          {/* Settle win layout overlay inside */}
          {isCompleted && (
            <div className="bg-emerald-50/90 rounded-[28px] p-5 border border-b-4 border-emerald-200 shadow-lg text-center max-w-sm mx-auto">
              <div className="inline-block bg-amber-400 border border-b-2 border-amber-500 text-white rounded-full p-2.5 mb-2 animate-bounce shadow-sm">
                <Trophy size={20} />
              </div>
              <h4 className="text-sm font-black text-emerald-950">恭喜你！成功解开！</h4>
              <p className="text-xs text-emerald-700 font-semibold mb-3">
                你只用了 <span className="font-mono text-base font-black">{moves}</span> 步，拼图物归原处！
              </p>
              <div className="flex gap-2 justify-center max-w-xs mx-auto">
                <button
                  onClick={() => generateSolvableBoard(gridSize)}
                  className="flex-1 bg-emerald-500 hover:bg-emerald-600 border-b-4 border-emerald-600 text-white font-black text-xs py-2.5 rounded-xl transition-all shadow-sm cursor-pointer"
                >
                  再跑一局
                </button>
                <button
                  onClick={() => {
                    setIsPlaying(false);
                    setIsCompleted(false);
                  }}
                  className="bg-slate-200 hover:bg-slate-300 text-slate-600 font-bold text-xs py-2.5 px-4 rounded-xl transition-all cursor-pointer"
                >
                  返回选关
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
