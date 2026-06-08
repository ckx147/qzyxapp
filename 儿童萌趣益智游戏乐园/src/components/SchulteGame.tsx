/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Play, RotateCcw, HelpCircle, Eye, Timer, Award, CheckCircle } from 'lucide-react';
import { UserProfile, GameRecord, Achievement } from '../types';
import { UserAvatar } from './UserAvatar';
import { AVATARS } from '../utils/gameHelpers';
import { soundSynth } from '../utils/audio';

interface SchulteProps {
  profile: UserProfile;
  achievements: Achievement[];
  setProfile: React.Dispatch<React.SetStateAction<UserProfile>>;
  setAchievements: React.Dispatch<React.SetStateAction<Achievement[]>>;
  onPointsChange: (amount: number, reason: string) => void;
  onNotification: (text: string, icon: string) => void;
}

export const SchulteGame: React.FC<SchulteProps> = ({
  profile,
  achievements,
  setProfile,
  setAchievements,
  onPointsChange,
  onNotification,
}) => {
  const [gridSize, setGridSize] = useState<3 | 4 | 5>(3); // 3x3 (1-9), 4x4 (1-16), or 5x5 (1-25)
  const [challengeMode, setChallengeMode] = useState<'normal' | 'shuffle'>('normal'); // 'normal' or 'shuffle' (position swap on correct click)
  const [numbers, setNumbers] = useState<number[]>([]);
  const [nextNumber, setNextNumber] = useState(1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [timeElapsed, setTimeElapsed] = useState(0); // in tenths of seconds (1/10s)
  const [showInstructions, setShowInstructions] = useState(false);
  const [wrongFlashIndex, setWrongFlashIndex] = useState<number | null>(null);
  const [correctFlashIndex, setCorrectFlashIndex] = useState<number | null>(null);

  // Timer interval with 100ms precision for nice display
  useEffect(() => {
    let interval: any;
    if (isPlaying && !isCompleted) {
      interval = setInterval(() => {
        setTimeElapsed(prev => prev + 1);
      }, 100);
    }
    return () => clearInterval(interval);
  }, [isPlaying, isCompleted]);

  const startSchulteGame = (size: number) => {
    const maxVal = size * size;
    const array = Array.from({ length: maxVal }, (_, i) => i + 1);
    
    // Shuffle array (Fisher-Yates)
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }

    setNumbers(array);
    setNextNumber(1);
    setIsCompleted(false);
    setTimeElapsed(0);
    setIsPlaying(true);
    setWrongFlashIndex(null);
    setCorrectFlashIndex(null);
  };

  const handleBlockClick = (num: number, index: number) => {
    if (!isPlaying || isCompleted) return;

    if (num === nextNumber) {
      // Trigger correct bounce flash
      setCorrectFlashIndex(index);
      setTimeout(() => setCorrectFlashIndex(null), 150);

      const maxVal = gridSize * gridSize;
      if (num === maxVal) {
        handleGameCompleted();
      } else {
        soundSynth.playClick();
        const nextNum = nextNumber + 1;
        setNextNumber(nextNum);
        
        // If shuffle mode is enabled, let's shuffle the remaining unclicked numbers!
        if (challengeMode === 'shuffle') {
          setNumbers(prevNumbers => {
            // Find positions and values of unclicked elements (values greater than or equal to nextNum)
            const unclickedPositions: number[] = [];
            const unclickedValues: number[] = [];
            
            prevNumbers.forEach((val, idx) => {
              if (val >= nextNum) {
                unclickedPositions.push(idx);
                unclickedValues.push(val);
              }
            });
            
            // Fisher-Yates shuffle
            for (let i = unclickedValues.length - 1; i > 0; i--) {
              const j = Math.floor(Math.random() * (i + 1));
              [unclickedValues[i], unclickedValues[j]] = [unclickedValues[j], unclickedValues[i]];
            }
            
            // Reconstruct the numbers list
            const nextNumbers = [...prevNumbers];
            unclickedPositions.forEach((pos, idx) => {
              nextNumbers[pos] = unclickedValues[idx];
            });
            
            return nextNumbers;
          });
        }
      }
    } else {
      // Trigger wrong flash
      soundSynth.playWarning();
      setWrongFlashIndex(index);
      setTimeout(() => setWrongFlashIndex(null), 400);
    }
  };

  const handleGameCompleted = () => {
    setIsCompleted(true);
    soundSynth.playWin();
    const finalSeconds = timeElapsed / 10;
    
    // Calculate points with challenge mode 1.5x scaling
    let baseReward = gridSize === 3 ? 60 : gridSize === 4 ? 120 : 200;
    if (challengeMode === 'shuffle') {
      baseReward = Math.round(baseReward * 1.5);
    }
    
    onPointsChange(baseReward, `顺利通关 ${gridSize}x${gridSize} ${challengeMode === 'shuffle' ? '瞬移瞬闪' : '常规'}舒尔特训练`);

    setProfile(prev => {
      const recordsCopy = { ...prev.records };
      if (gridSize === 3) {
        recordsCopy.schulteBest3x3 = Math.min(recordsCopy.schulteBest3x3, finalSeconds);
      } else if (gridSize === 4) {
        recordsCopy.schulteBest4x4 = Math.min(recordsCopy.schulteBest4x4, finalSeconds);
      } else {
        recordsCopy.schulteBest5x5 = Math.min(recordsCopy.schulteBest5x5 || 9999, finalSeconds);
      }

      return {
        ...prev,
        points: prev.points + baseReward,
        records: recordsCopy
      };
    });

    // Check achievements
    setAchievements(prev => {
      return prev.map(ach => {
        if (ach.id === 'ach_schulte_1') {
          return { ...ach, progress: ach.progress + 1 };
        }
        if (ach.id === 'ach_schulte_speed' && gridSize === 3 && finalSeconds <= 15) {
          return { ...ach, progress: ach.progress + 1 };
        }
        return ach;
      });
    });

    const rewardMsg = `真棒！你仅用了 ${finalSeconds} 秒点完了所有舒尔特格子！你的神速视力太棒了！💖 获得 ${baseReward} 星星！`;
    onNotification(rewardMsg, 'Award');
  };

  // Focus quality rating
  const getConcentrationRating = () => {
    const finalSeconds = timeElapsed / 10;
    if (gridSize === 3) {
      if (finalSeconds <= 8) return '☄️ 宇宙级神速闪电！';
      if (finalSeconds <= 15) return '⭐ 超级专注大师！';
      if (finalSeconds <= 25) return '👍 眼睛真亮，继续坚持！';
      return '💪 慢工出细活，再接再厉！';
    } else if (gridSize === 4) {
      if (finalSeconds <= 20) return '☄️ 宇宙级神速闪电！';
      if (finalSeconds <= 35) return '⭐ 超级专注大师！';
      if (finalSeconds <= 60) return '👍 眼睛真亮，继续坚持！';
      return '💪 慢工出细活，再接再厉！';
    } else {
      if (finalSeconds <= 35) return '☄️ 宇宙级神速闪电！';
      if (finalSeconds <= 60) return '⭐ 超级专注大师！';
      if (finalSeconds <= 90) return '👍 眼睛真亮，继续坚持！';
      return '💪 慢工出细活，再接再厉！';
    }
  };

  const formatSecs = (tenths: number) => {
    return (tenths / 10).toFixed(1);
  };

  return (
    <div className="bg-white rounded-[32px] p-5 shadow-xl border-b-8 border-amber-400 transition-all" id="schulte-game-module">
      {/* Game Title */}
      <div className="flex items-center justify-between mb-4 border-b-2 border-amber-100 pb-3">
        <div className="flex items-center gap-2">
          <span className="text-3xl animate-bounce">👀</span>
          <div className="text-left leading-tight">
            <h3 className="font-black text-slate-700 text-sm">舒尔特专注力训练</h3>
            <p className="text-[10px] text-amber-500 font-bold mt-0.5">科学目光搜索，锻炼专注力与视觉广度 ⭐</p>
          </div>
        </div>
        
        <div className="flex gap-1.5">
          <button 
            onClick={() => setShowInstructions(!showInstructions)}
            className="text-slate-400 hover:text-amber-600 bg-slate-50 border border-slate-200 p-2 rounded-full transition-all cursor-pointer"
            title="训练说明"
          >
            <HelpCircle size={14} />
          </button>
          <button 
            onClick={() => startSchulteGame(gridSize)}
            className="bg-[#FFF9F2] hover:bg-amber-100 border border-b-2 border-amber-200 text-amber-700 py-1.5 px-3.5 rounded-full text-xs font-black flex items-center gap-1 transition-all cursor-pointer"
          >
            <RotateCcw size={12} /> {isPlaying ? '重来一局' : '开始'}
          </button>
        </div>
      </div>

      {showInstructions && (
        <div className="bg-amber-50/75 border border-b-4 border-amber-100 rounded-[24px] p-4 text-[11px] text-slate-600 space-y-1.5 mb-3 text-left">
          <p className="font-black text-amber-800">💡 舒尔特训练有什么好处？</p>
          <p>这是经典的视觉专注练习：</p>
          <p>1. 训练时，眼睛尽量聚焦中心，用余光去扫视数字位置。</p>
          <p>2. 按照数字 <strong className="text-amber-600">从 1 到最大数</strong> 的顺序迅速点击，看谁用时最短！</p>
          <p>3. 每天做 1 组，可以让小朋友写作业、看书时更容易集中注意力哦！📖</p>
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
                {avatarObj.name} {isPlaying ? '伴你高飞 ✨' : '助战中 ⚡'}
              </span>
              <p className="text-[10.5px] text-slate-500 font-medium leading-relaxed mt-1">
                {isCompleted 
                  ? "🏆 成功啦！你的专注力太神奇了，瞬间就锁定了全部数字！棒棒哒！" 
                  : isPlaying 
                    ? `💡 余光搜寻闪闪发光的下一个数字【 ${nextNumber} 】哟！` 
                    : "👋 准备好测测你的极限视力了吗？快选择下方的难度和挑战模式吧！"}
              </p>
            </div>
          </div>
        );
      })()}

      {/* Difficulty and Challenge Selector Grid */}
      <div className="flex flex-col gap-3 mb-4.5">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => {
              setGridSize(3);
              if (isPlaying) startSchulteGame(3);
            }}
            className={`flex-1 py-2.5 px-2 rounded-2xl font-black text-[11px] border-b-4 transition-all duration-75 active:translate-y-0.5 active:border-b-0 cursor-pointer ${
              gridSize === 3 
                ? 'bg-amber-400 border-amber-500 text-white shadow-xs' 
                : 'bg-white border text-slate-500 hover:bg-slate-50'
            }`}
            id="btn-schulte-3x3"
          >
            🦖 基础 (3x3)
          </button>
          <button
            type="button"
            onClick={() => {
              setGridSize(4);
              if (isPlaying) startSchulteGame(4);
            }}
            className={`flex-1 py-2.5 px-2 rounded-2xl font-black text-[11px] border-b-4 transition-all duration-75 active:translate-y-0.5 active:border-b-0 cursor-pointer ${
              gridSize === 4 
                ? 'bg-amber-400 border-amber-500 text-white shadow-xs' 
                : 'bg-white border text-slate-500 hover:bg-slate-50'
            }`}
            id="btn-schulte-4x4"
          >
            🚀 进阶 (4x4)
          </button>
          <button
            type="button"
            onClick={() => {
              setGridSize(5);
              if (isPlaying) startSchulteGame(5);
            }}
            className={`flex-1 py-2.5 px-2 rounded-2xl font-black text-[11px] border-b-4 transition-all duration-75 active:translate-y-0.5 active:border-b-0 cursor-pointer ${
              gridSize === 5 
                ? 'bg-amber-500 border-amber-600 text-white shadow-xs' 
                : 'bg-white border text-slate-500 hover:bg-slate-50'
            }`}
            id="btn-schulte-5x5"
          >
            🔥 极限 (5x5)
          </button>
        </div>

        {/* Challenge Mode selector */}
        <div className="flex items-center justify-between bg-slate-50 p-2 rounded-2xl border border-slate-200">
          <span className="text-[11px] font-black text-slate-500 pl-1.5 flex items-center gap-1">
            🎯 干扰挑战模式:
          </span>
          <div className="flex gap-1">
            <button
              type="button"
              onClick={() => setChallengeMode('normal')}
              className={`py-1 px-3 rounded-full text-[10px] font-black transition-all cursor-pointer ${
                challengeMode === 'normal'
                  ? 'bg-amber-100 text-amber-700 border border-amber-200/50'
                  : 'bg-white text-slate-400 border border-transparent hover:text-slate-650'
              }`}
            >
              常规静态
            </button>
            <button
              type="button"
              onClick={() => setChallengeMode('shuffle')}
              className={`py-1 px-3 rounded-full text-[10px] font-black transition-all flex items-center gap-0.5 cursor-pointer ${
                challengeMode === 'shuffle'
                  ? 'bg-red-100 text-red-600 animate-pulse border border-red-200/50'
                  : 'bg-white text-slate-400 border border-transparent hover:text-slate-650'
              }`}
            >
              🌀 动感瞬移 (+50%⭐)
            </button>
          </div>
        </div>
      </div>

      {/* Main Board */}
      {!isPlaying ? (
        <div className="text-center py-10" id="schulte-ready-screen">
          <div className="text-6xl mb-4 animate-bounce">⭐🌈</div>
          <h4 className="text-sm font-black text-slate-700">火眼金睛大考验</h4>
          <p className="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed mb-6 font-bold">
            将视线聚集在最中间，点击开始，在最快时间内依次找出所有的数字格！
          </p>
          <button
            onClick={() => startSchulteGame(gridSize)}
            className="bg-gradient-to-r from-[#FFD166] to-[#FF9F1C] border-b-4 border-[#D97706] text-white font-black text-xs py-3.5 px-8 rounded-full shadow-md active:translate-y-0.5 active:border-b-0 duration-100 cursor-pointer animate-pulse"
          >
            开启专注力加速器 🚀
          </button>
        </div>
      ) : (
        <div className="space-y-4" id="schulte-active-screen">
          {/* Top Panel stats */}
          <div className="flex items-center justify-between bg-slate-50 py-3 px-4 rounded-2xl border border-b-2 border-slate-200 shadow-inner">
            <div className="flex items-center gap-1.5 text-left">
              <Eye className="text-[#FF9F1C] animate-pulse" size={16} />
              <div className="leading-none">
                <span className="text-[9px] text-slate-400 font-black block mb-0.5">请点击数字</span>
                <span className="text-xs font-black text-amber-600 font-sans">
                  数字 <strong className="text-base text-amber-500 font-mono font-black ml-0.5">{nextNumber}</strong>
                </span>
              </div>
            </div>

            <div className="h-6 w-px bg-slate-200" />

            <div className="flex items-center gap-1.5 text-left">
              <Timer className="text-[#FF9F1C]" size={16} />
              <div className="leading-none">
                <span className="text-[9px] text-slate-400 font-black block mb-0.5">已经用时</span>
                <span className="text-xs font-black text-slate-750 font-mono">{formatSecs(timeElapsed)}s</span>
              </div>
            </div>

            <div className="h-6 w-px bg-slate-200" />
            
            <span className="text-[8px] font-black text-amber-700 bg-amber-50 border border-amber-100 rounded-full py-1 px-2">
              目标: {gridSize * gridSize}
            </span>
          </div>

          {/* Schulte Grid Block Board */}
          <div className="flex justify-center">
            <div 
              className="bg-amber-50 p-2.5 rounded-[28px] border-b-8 border-[#FFE0C2] shadow-2xl grid gap-2 justify-center"
              style={{
                gridTemplateColumns: `repeat(${gridSize}, minmax(0, 1fr))`,
                width: gridSize === 5 ? '340px' : gridSize === 4 ? '300px' : '260px',
                height: gridSize === 5 ? '340px' : gridSize === 4 ? '300px' : '260px',
              }}
              id="schulte-tile-board"
            >
              {numbers.map((val, idx) => {
                const isCorrectClicked = val < nextNumber;
                const isWrongFlash = wrongFlashIndex === idx;
                const isCorrectFlash = correctFlashIndex === idx;

                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleBlockClick(val, idx)}
                    className={`rounded-2xl font-black transition-all select-none border-b-4 focus:outline-none flex items-center justify-center cursor-pointer ${
                      gridSize === 5 
                        ? 'text-lg rounded-xl border-b-3' 
                        : gridSize === 4
                          ? 'text-xl'
                          : 'text-2xl'
                    } ${
                      isCorrectClicked
                        ? 'bg-emerald-100 text-emerald-400 border-emerald-300 opacity-60 cursor-not-allowed text-lg'
                        : isCorrectFlash
                          ? 'bg-emerald-400 text-white border-emerald-600 scale-105 shadow-inner'
                          : isWrongFlash
                            ? 'bg-rose-500 text-white border-rose-700 scale-105 duration-75'
                            : 'bg-white hover:bg-amber-50 border-slate-200 text-slate-700 shadow-md active:translate-y-0.5 active:border-b-0'
                     }`}
                  >
                    {isCorrectClicked ? (
                      <CheckCircle className="text-emerald-500 fill-emerald-100 animate-pulse" size={gridSize === 5 ? 18 : 24} />
                    ) : (
                      val
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Winning Overlay Popup */}
          {isCompleted && (
            <div className="bg-amber-50/90 border border-b-4 border-amber-200 rounded-[28px] p-5 shadow-lg text-center max-w-sm mx-auto">
              <div className="inline-block bg-amber-400 border border-b-2 border-amber-500 text-white rounded-full p-2.5 mb-2 animate-bounce shadow-sm">
                <Award size={22} />
              </div>
              <h4 className="text-sm font-black text-amber-950">专注大闯关成功！</h4>
              <p className="text-xs text-slate-650 mb-2 font-bold">
                总耗时：<span className="font-mono text-base text-amber-600 font-extrabold">{(timeElapsed / 10).toFixed(1)}</span> 秒
              </p>
              <div className="bg-white rounded-xl py-1.5 px-3 border border-amber-200 text-xs text-amber-800 font-black inline-block mb-3">
                {getConcentrationRating()}
              </div>
              <div className="flex gap-2 justify-center max-w-xs mx-auto">
                <button
                  onClick={() => startSchulteGame(gridSize)}
                  className="flex-1 bg-amber-500 hover:bg-amber-600 border-b-4 border-amber-600 text-white font-black text-xs py-2.5 rounded-xl text-center shadow-xs cursor-pointer"
                >
                  再测一次
                </button>
                <button
                  onClick={() => {
                    setIsPlaying(false);
                    setIsCompleted(false);
                  }}
                  className="bg-slate-200 hover:bg-slate-300 text-slate-650 font-black text-xs py-2.5 px-4 rounded-xl transition-all cursor-pointer"
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
