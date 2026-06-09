/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { RotateCcw, HelpCircle, User, Award, RefreshCw, Zap } from 'lucide-react';
import { UserProfile, GameRecord, Achievement } from '../types';
import { UserAvatar } from './UserAvatar';
import { AVATARS } from '../utils/gameHelpers';
import { soundSynth } from '../utils/audio';

interface GomokuProps {
  profile: UserProfile;
  achievements: Achievement[];
  setProfile: React.Dispatch<React.SetStateAction<UserProfile>>;
  setAchievements: React.Dispatch<React.SetStateAction<Achievement[]>>;
  onPointsChange: (amount: number, reason: string) => void;
  onNotification: (text: string, icon: string) => void;
}

const BOARD_SIZE = 11; // 11x11 fits mobile frame incredibly well
const EMPTY_CELL = 0;
const PLAYER_PIECE = 1; // Black Stone ⚫
const AI_PIECE = 2; // White Stone ⚪

export const GomokuGame: React.FC<GomokuProps> = ({
  profile,
  achievements,
  setProfile,
  setAchievements,
  onPointsChange,
  onNotification,
}) => {
  const [board, setBoard] = useState<number[][]>([]);
  const [isGameOver, setIsGameOver] = useState(false);
  const [winner, setWinner] = useState<number | null>(null); // 1: Player, 2: AI, 3: Draw
  const [currentTurn, setCurrentTurn] = useState<'player' | 'ai'>('player');
  const [aiIsThinking, setAiIsThinking] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  const [aiLevel, setAiLevel] = useState<'easy' | 'smart'>('smart');
  const [gameMode, setGameMode] = useState<'ai' | 'pvp'>('ai');

  // Win line coordinate for highlight
  const [winningCells, setWinningCells] = useState<[number, number][]>([]);

  const [hoveredCell, setHoveredCell] = useState<{r: number; c: number} | null>(null);

  useEffect(() => {
    resetBoard();
  }, [gameMode]);

  const resetBoard = () => {
    const emptyBoard = Array(BOARD_SIZE).fill(null).map(() => Array(BOARD_SIZE).fill(EMPTY_CELL));
    setBoard(emptyBoard);
    setIsGameOver(false);
    setWinner(null);
    setCurrentTurn('player');
    setAiIsThinking(false);
    setWinningCells([]);
    setHoveredCell(null);
  };

  // AI moves when it's AI's turn
  useEffect(() => {
    if (gameMode === 'ai' && currentTurn === 'ai' && !isGameOver) {
      setAiIsThinking(true);
      const timer = setTimeout(() => {
        makeAIMove();
        setAiIsThinking(false);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [currentTurn, isGameOver, gameMode]);

  const handleCellClick = (row: number, col: number) => {
    if (isGameOver || board[row][col] !== EMPTY_CELL || aiIsThinking) {
      return;
    }

    // Play placing sound
    soundSynth.playMove();

    if (gameMode === 'ai') {
      if (currentTurn !== 'player') return;
      const newBoard = board.map(r => [...r]);
      newBoard[row][col] = PLAYER_PIECE;
      setBoard(newBoard);

      if (checkWin(row, col, PLAYER_PIECE, newBoard)) {
        handleGameOver(PLAYER_PIECE);
      } else if (checkDraw(newBoard)) {
        handleGameOver(3); // Draw
      } else {
        setCurrentTurn('ai');
      }
    } else {
      // PvP mode
      const activePiece = currentTurn === 'player' ? PLAYER_PIECE : AI_PIECE;
      const newBoard = board.map(r => [...r]);
      newBoard[row][col] = activePiece;
      setBoard(newBoard);

      if (checkWin(row, col, activePiece, newBoard)) {
        handleGameOver(activePiece);
      } else if (checkDraw(newBoard)) {
        handleGameOver(3); // Draw
      } else {
        setCurrentTurn(currentTurn === 'player' ? 'ai' : 'player');
      }
    }
  };

  const checkDraw = (gBoard: number[][]) => {
    return gBoard.every(row => row.every(cell => cell !== EMPTY_CELL));
  };

  // 5-in-a-row direction searcher
  const checkWin = (row: number, col: number, piece: number, checkBoard: number[][]): boolean => {
    const directions = [
      [0, 1],   // horizontal
      [1, 0],   // vertical
      [1, 1],   // diagonal down-right
      [1, -1]   // diagonal down-left
    ];

    for (const [dr, dc] of directions) {
      let count = 1;
      const cells: [number, number][] = [[row, col]];

      // Positive side searching
      let r = row + dr;
      let c = col + dc;
      while (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE && checkBoard[r][c] === piece) {
        count++;
        cells.push([r, c]);
        r += dr;
        c += dc;
      }

      // Negative side searching
      r = row - dr;
      c = col - dc;
      while (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE && checkBoard[r][c] === piece) {
        count++;
        cells.push([r, c]);
        r -= dr;
        c -= dc;
      }

      if (count >= 5) {
        setWinningCells(cells);
        return true;
      }
    }
    return false;
  };

  // Evaluation-based Gomoku AI (blocks trios, attacks lines, supports kid-oriented fun)
  const makeAIMove = () => {
    const emptyCells: { r: number; c: number; score: number }[] = [];

    // Scan the whole board and assign scores to each empty cell
    for (let r = 0; r < BOARD_SIZE; r++) {
      for (let c = 0; c < BOARD_SIZE; c++) {
        if (board[r][c] === EMPTY_CELL) {
          const score = evaluatePosition(r, c);
          emptyCells.push({ r, c, score });
        }
      }
    }

    if (emptyCells.length === 0) return;

    let chosenMove = emptyCells[0];

    if (aiLevel === 'easy') {
      // Easy AI: 70% random, 30% smart
      if (Math.random() < 0.7) {
        chosenMove = emptyCells[Math.floor(Math.random() * emptyCells.length)];
      } else {
        emptyCells.sort((a, b) => b.score - a.score);
        chosenMove = emptyCells[0];
      }
    } else {
      // Smart AI: picks higher scored tile to obstruct player or build own line
      emptyCells.sort((a, b) => b.score - a.score);
      chosenMove = emptyCells[0];

      // Add small randomness if top scores are identical to make it look alive
      const bestScore = chosenMove.score;
      const tiedMoves = emptyCells.filter(m => m.score === bestScore);
      chosenMove = tiedMoves[Math.floor(Math.random() * tiedMoves.length)];
    }

    const { r, c } = chosenMove;
    const newBoard = board.map(row => [...row]);
    newBoard[r][c] = AI_PIECE;
    setBoard(newBoard);
    soundSynth.playMove();

    if (checkWin(r, c, AI_PIECE, newBoard)) {
      handleGameOver(AI_PIECE);
    } else if (checkDraw(newBoard)) {
      handleGameOver(3);
    } else {
      setCurrentTurn('player');
    }
  };

  // Heuristic checker for AI spots weight
  const evaluatePosition = (row: number, col: number): number => {
    let score = 0;
    const directions = [
      [0, 1],   // horizontal
      [1, 0],   // vertical
      [1, 1],   // diag \
      [1, -1]   // diag /
    ];

    for (const [dr, dc] of directions) {
      // Count self & opponent items in range of 5 surrounding this cell
      const aiScoreComp = checkLineScore(row, col, dr, dc, AI_PIECE);
      const playerScoreComp = checkLineScore(row, col, dr, dc, PLAYER_PIECE);

      score += aiScoreComp; // AI offensive points
      score += playerScoreComp * 1.25; // Block opponent: highly preferred!
    }

    return score;
  };

  const checkLineScore = (row: number, col: number, dr: number, dc: number, piece: number): number => {
    let countSelf = 0;
    let openEnds = 0;

    // Check cells forward (up to 4 steps)
    let r = row + dr;
    let c = col + dc;
    let blockedForward = false;
    for (let step = 1; step <= 4; step++) {
      if (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE) {
        if (board[r][c] === piece) {
          countSelf++;
        } else if (board[r][c] === EMPTY_CELL) {
          openEnds++;
          break;
        } else {
          blockedForward = true;
          break; // blocked by opposite color
        }
        r += dr;
        c += dc;
      } else {
        blockedForward = true;
        break;
      }
    }

    // Check cells backward (up to 4 steps)
    r = row - dr;
    c = col - dc;
    let blockedBackward = false;
    for (let step = 1; step <= 4; step++) {
      if (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE) {
        if (board[r][c] === piece) {
          countSelf++;
        } else if (board[r][c] === EMPTY_CELL) {
          openEnds++;
          break;
        } else {
          blockedBackward = true;
          break;
        }
        r -= dr;
        c -= dc;
      } else {
        blockedBackward = true;
        break;
      }
    }

    // Weight allocations based on classic AI Gomoku strategy
    if (countSelf === 4) return 10000; // 5-in-a-row potential
    if (countSelf === 3) {
      if (!blockedForward && !blockedBackward) return 2500; // open 4
      return 500; // blocked 4
    }
    if (countSelf === 2) {
      if (!blockedForward && !blockedBackward) return 500; // open 3
      return 100;
    }
    if (countSelf === 1) return 20;

    return 2;
  };

  const handleGameOver = (finalWinner: number) => {
    setIsGameOver(true);
    setWinner(finalWinner);

    if (finalWinner === PLAYER_PIECE) {
      soundSynth.playWin();
    } else if (finalWinner === AI_PIECE) {
      soundSynth.playWarning();
    } else {
      soundSynth.playClick();
    }

    let rewardPoints = 0;

    if (gameMode === 'ai') {
      if (finalWinner === PLAYER_PIECE) {
        rewardPoints = 100; // Major win reward!

        // Triggers win record achievements
        setAchievements(prevAchs => {
          return prevAchs.map(ach => {
            if (ach.id === 'ach_gomoku_1') {
              return { ...ach, progress: 1 };
            }
            return ach;
          });
        });

        onNotification("恭喜小勇士旗开得胜！获得了 100 星星！小布为你疯狂鼓掌！⚫🏆🎉", "Award");
      } else if (finalWinner === AI_PIECE) {
        rewardPoints = 15; // comfort reward for kids
        onNotification("小布险胜咯！加油，明天继续开战，你肯定能反超！🌱", "Info");
      } else {
        rewardPoints = 30; // friendly draw split
        onNotification("棋逢对手，是一场精彩的平局！继续切磋吧！🤝", "Info");
      }
    } else {
      // PvP Mode - Double player interactive reward
      rewardPoints = 50;
      if (finalWinner === PLAYER_PIECE) {
        onNotification("太棒了！亲子对战宝贝（黑子 ⚫）获胜了！获得拼搏对战星章 +50！🏆", "Award");
      } else if (finalWinner === AI_PIECE) {
        onNotification("好玩！家长/伙伴（白子 ⚪）获胜了！全家都是高智商！获得互动星章 +50！🎉", "Award");
      } else {
        onNotification("亲子棋逢对手，平分秋色！继续加油打气吧！🤝", "Info");
      }
    }

    if (rewardPoints > 0) {
      onPointsChange(rewardPoints, "益智五子棋对战");
    }

    setProfile(prev => {
      const recordsCopy = { ...prev.records };
      if (gameMode === 'ai') {
        if (finalWinner === PLAYER_PIECE) {
          recordsCopy.gomokuWins += 1;
        } else if (finalWinner === AI_PIECE) {
          recordsCopy.gomokuLosses += 1;
        } else {
          recordsCopy.gomokuDraws += 1;
        }
      } else {
        if (finalWinner === PLAYER_PIECE) {
          recordsCopy.gomokuWins += 1; // count as win for baby
        }
      }

      return {
        ...prev,
        records: recordsCopy
      };
    });
  };

  return (
    <div className="kid-game-panel p-5 md:p-6 transition-all relative overflow-hidden" id="gomoku-game-module">
      {/* Game Title Bar */}
      <div className="kid-game-header flex items-center justify-between mb-4 pb-3 ml-0.5">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-slate-900 flex items-center justify-center shadow-sm select-none transform rotate-3">
            <span className="text-xl font-black text-white">⚫</span>
          </div>
          <div className="text-left leading-tight">
            <h3 className="font-extrabold text-slate-800 text-sm tracking-tight flex items-center gap-1.5">
              益智五子棋
              <span className="bg-teal-500/10 text-[#006666] text-[8px] font-black px-1.5 py-0.5 rounded-md border border-teal-500/15">
                新春纪念版
              </span>
            </h3>
            <p className="text-[10px] text-slate-400 font-semibold mt-0.5">连珠成线，趣味思维探索 &bull; 智力大挑战</p>
          </div>
        </div>
        
        <div className="flex gap-1.5 shrink-0">
          <button 
            onClick={() => setShowInstructions(!showInstructions)}
            className={`text-teal-700 hover:text-teal-800 bg-white border border-[#E3DCCE] hover:border-teal-300 w-8 h-8 rounded-xl flex items-center justify-center shadow-xs transition-all cursor-pointer ${showInstructions ? 'bg-teal-50 border-teal-200 text-teal-700' : ''}`}
            title="查看规则"
          >
            <HelpCircle size={15} />
          </button>
          <button 
            onClick={resetBoard}
            className="bg-white hover:bg-teal-50 border border-[#E3DCCE] hover:border-teal-300 text-teal-800 h-8 px-3 rounded-xl text-xs font-bold flex items-center gap-1 shadow-xs transition-all cursor-pointer"
          >
            <RefreshCw size={12} className="shrink-0 animate-spin-slow" /> 重置
          </button>
        </div>
      </div>

      {showInstructions && (
        <div className="kid-game-note p-4 text-[11px] text-slate-600 space-y-1.5 mb-4 text-left animate-fade-in">
          <p className="font-extrabold text-teal-800 flex items-center gap-1">✨ 怎么玩益智五子棋？</p>
          <ul className="space-y-1 list-disc list-inside">
            <li>小朋友扮演 <strong className="text-slate-800 font-extrabold">黑子 (⚫)</strong>，萌宠小布或同伴扮演 <strong className="text-slate-500 font-extrabold">白子 (⚪)</strong>。</li>
            <li>点击或轻触棋盘上的 <strong className="text-teal-700">交叉格点</strong> 进行落子。</li>
            <li>任何一方将自己的棋子在 <strong className="text-amber-800">横、竖、斜任意方向连成 5 个</strong> 即获胜！</li>
            <li>胜利可以获取 <strong className="text-[#006666] font-black">100 颗星星</strong> 大礼盒！失败也会有 15 星星安慰奖哦。</li>
          </ul>
        </div>
      )}

      {/* Control Panel Block (Game Settings) */}
      <div className="bg-white/80 p-2.5 rounded-2xl border border-[#ECE5D9] mb-4 space-y-2">
        {/* Row 1: Mode switcher */}
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-black text-slate-400 w-10 shrink-0 text-left pl-1">模式</span>
          <div className="flex-1 bg-slate-100/80 border border-slate-200 p-0.5 rounded-xl flex items-center gap-1">
            <button
              onClick={() => {
                setGameMode('ai');
              }}
              className={`flex-1 py-1 px-2.5 rounded-lg font-black text-xs transition-all cursor-pointer ${
                gameMode === 'ai'
                  ? 'bg-white text-teal-700 shadow-[0_2px_6px_rgba(0,0,0,0.06)]'
                  : 'text-slate-500 hover:text-slate-700 hover:bg-white/40'
              }`}
              id="btn-mode-ai"
            >
              🤖 单人挑战 (小布)
            </button>
            <button
              onClick={() => {
                setGameMode('pvp');
              }}
              className={`flex-1 py-1 px-2.5 rounded-lg font-black text-xs transition-all cursor-pointer ${
                gameMode === 'pvp'
                  ? 'bg-white text-emerald-700 shadow-[0_2px_6px_rgba(0,0,0,0.06)]'
                  : 'text-slate-500 hover:text-slate-700 hover:bg-white/40'
              }`}
              id="btn-mode-pvp"
            >
              👨‍👩‍👦 亲子双人 (同屏)
            </button>
          </div>
        </div>

        {/* Row 2: AI difficulty (only shown when gameMode is 'ai') */}
        {gameMode === 'ai' && (
          <div className="flex items-center gap-2 border-t border-dashed border-[#F3EDDF] pt-2 animate-fade-in">
            <span className="text-[11px] font-black text-slate-400 w-10 shrink-0 text-left pl-1">难度</span>
            <div className="flex-1 bg-slate-100/80 border border-slate-200 p-0.5 rounded-xl flex items-center gap-1">
              <button
                onClick={() => setAiLevel('easy')}
                className={`flex-1 py-1 px-2.5 rounded-lg font-black text-xs transition-all cursor-pointer ${
                  aiLevel === 'easy' 
                    ? 'bg-white text-teal-600 shadow-[0_2px_6px_rgba(0,0,0,0.06)] scale-105' 
                    : 'text-slate-500 hover:text-slate-700 hover:bg-white/40'
                }`}
                id="btn-gomoku-easy"
              >
                👶 萌爪小白 (简易)
              </button>
              <button
                onClick={() => setAiLevel('smart')}
                className={`flex-1 py-1 px-2.5 rounded-lg font-black text-xs transition-all cursor-pointer ${
                  aiLevel === 'smart' 
                    ? 'bg-white text-teal-700 shadow-[0_2px_6px_rgba(0,0,0,0.06)] scale-105' 
                    : 'text-slate-500 hover:text-slate-700 hover:bg-white/40'
                }`}
                id="btn-gomoku-smart"
              >
                🧠 智多星布 (智能)
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Opponent Dual Player Cards Profile Bar */}
      {(() => {
        const aiAvatarId = profile.avatarId === 'avatar_dino' ? 'avatar_fox' : 'avatar_dino';
        const aiAvatarObj = AVATARS.find(a => a.id === aiAvatarId) || AVATARS[0];
        
        const isPlayerTurn = currentTurn === 'player';
        
        return (
          <div className="grid grid-cols-11 items-center gap-1 mb-4">
            {/* Player Card Frame */}
            <div className={`col-span-4 bg-white border rounded-2xl p-2 flex items-center gap-1.5 transition-all shadow-[0_4px_12px_rgba(0,0,0,0.02)] ${
              isPlayerTurn && !isGameOver
                ? 'border-indigo-300 ring-2 ring-indigo-300/30 bg-indigo-50/10'
                : 'border-slate-200'
            }`}>
              <div className="relative shrink-0">
                <UserAvatar id={profile.avatarId} className="w-8 h-8 rounded-xl shadow-xs border border-rose-100" />
                <span className="absolute -bottom-1 -right-1 text-xs select-none">⚫</span>
              </div>
              <div className="text-left leading-tight min-w-0 flex-1">
                <span className="text-[9px] text-rose-500 font-extrabold block truncate">
                  {gameMode === 'ai' ? `${profile.nickname}` : '宝贝 (黑)'}
                </span>
                <span className="text-[10px] font-black text-slate-650 block mt-0.5">胜 {profile.records.gomokuWins} 局</span>
              </div>
              {isPlayerTurn && !isGameOver && (
                <div className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping shrink-0" />
              )}
            </div>

            {/* Central Turn Arena Badge */}
            <div className="col-span-3 flex justify-center">
              <div className={`px-2.5 py-1 text-center shrink-0 shadow-xs border flex items-center justify-center transition-all min-w-[76px] rounded-full ${
                isGameOver
                  ? 'bg-slate-900 border-slate-800 text-amber-300 font-extrabold text-[10px] tracking-tight'
                  : isPlayerTurn
                    ? 'bg-slate-800 border-slate-700 text-white font-extrabold text-[9px] tracking-tight animate-soft-pop'
                    : 'bg-white border-slate-200 text-slate-700 font-extrabold text-[9px] tracking-tight animate-pulse'
              }`}>
                {isGameOver ? (
                  <span>🏆 已完结</span>
                ) : isPlayerTurn ? (
                  <span>👈 执黑下子</span>
                ) : (
                  <span>执白下子 👉</span>
                )}
              </div>
            </div>

            {/* Opponent Card Frame */}
            <div className={`col-span-4 bg-white border rounded-2xl p-2 flex items-center gap-1.5 transition-all shadow-[0_4px_12px_rgba(0,0,0,0.02)] justify-end ${
              !isPlayerTurn && !isGameOver
                ? 'border-indigo-300 ring-2 ring-indigo-300/30 bg-indigo-50/10'
                : 'border-slate-200'
            }`}>
              {!isPlayerTurn && !isGameOver && (
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-ping shrink-0" />
              )}
              <div className="text-right leading-tight min-w-0 flex-1">
                <span className="text-[9px] text-blue-500 font-extrabold block truncate">
                  {gameMode === 'ai' ? `${aiAvatarObj.name}` : '同伴 (白)'}
                </span>
                <span className="text-[10px] font-black text-slate-500 block mt-0.5 truncate">
                  {gameMode === 'ai' ? (aiLevel === 'easy' ? '白子小白' : '白子小布') : '同伴对练'}
                </span>
              </div>
              <div className="relative shrink-0">
                <UserAvatar id={gameMode === 'ai' ? aiAvatarId : 'avatar_cat'} className="w-8 h-8 rounded-xl shadow-xs border border-blue-100" />
                <span className="absolute -bottom-1 -left-1 text-xs select-none">⚪</span>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Tactile Wood Board Layout Container */}
      <div className="flex flex-col items-center" id="gomoku-board-wrapper">
        <div className="relative bg-gradient-to-br from-[#DEC09B] via-[#D3A374] to-[#C39364] border-4 border-[#7A5835] border-b-[8px] rounded-[28px] p-4 pb-5 shadow-[0_16px_36px_rgba(92,62,33,0.35),0_4px_10px_rgba(92,62,33,0.15)] flex flex-col items-center select-none">
          {/* Subtle wooden texture watermark overlay */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-amber-100/10 via-transparent to-red-950/5 rounded-[22px] pointer-events-none" />
          
          <div 
            className="grid select-none relative"
            style={{
              gridTemplateColumns: `repeat(${BOARD_SIZE}, minmax(0, 1fr))`,
              width: '280px',
              height: '280px',
            }}
            id="gomoku-fruit-board"
            onMouseLeave={() => setHoveredCell(null)}
          >
            {board.map((rowArr, rIdx) => 
              rowArr.map((cell, cIdx) => {
                const isWinning = winningCells.some(([wr, wc]) => wr === rIdx && wc === cIdx);
                const isPiece = cell !== EMPTY_CELL;
                const showGhost = !isPiece && !isGameOver && !aiIsThinking && hoveredCell?.r === rIdx && hoveredCell?.c === cIdx;

                return (
                  <div 
                    key={`${rIdx}-${cIdx}`}
                    onClick={() => handleCellClick(rIdx, cIdx)}
                    onMouseEnter={() => !isPiece && setHoveredCell({ r: rIdx, c: cIdx })}
                    className="relative w-full h-full aspect-square flex items-center justify-center cursor-pointer transition-colors duration-100 group"
                    id={`cell-${rIdx}-${cIdx}`}
                  >
                    {/* Vertical & Horizontal lines intersecting inside the unit */}
                    <div className="absolute top-1/2 left-0 w-full h-px bg-[#5C3E21]/35 pointer-events-none" />
                    <div className="absolute top-0 left-1/2 w-px h-full bg-[#5C3E21]/35 pointer-events-none" />

                    {/* Standard Go Star dots on intersection spots */}
                    {(((rIdx === 2 || rIdx === 8) && (cIdx === 2 || cIdx === 8)) || (rIdx === 5 && cIdx === 5)) && (
                      <div className="absolute w-[5px] h-[5px] rounded-full bg-[#5C3E21]/75 pointer-events-none ring-[1.5px] ring-[#DEC09B]" />
                    )}

                    {/* Ghost preview overlay */}
                    {showGhost && (
                      <div className={`w-[18px] h-[18px] rounded-full opacity-45 scale-95 border border-dashed z-50 pointer-events-none animate-pulse ${
                        currentTurn === 'player'
                          ? 'bg-gradient-to-br from-slate-700 to-black border-slate-900 shadow-sm'
                          : 'bg-gradient-to-br from-white to-slate-200 border-white shadow-xs'
                      }`} />
                    )}

                    {/* Play Black Stone Piece */}
                    {cell === PLAYER_PIECE && (
                      <div className={`w-[20px] h-[20px] rounded-full bg-gradient-to-br from-slate-600 via-slate-800 to-[#121214] border border-slate-950 shadow-[0_2.5px_5px_rgba(0,0,0,0.55),inset_0.5px_0.8px_1.5px_rgba(255,255,255,0.3)] z-10 select-none flex items-center justify-center transform hover:scale-105 active:scale-95 transition-all duration-150 relative ${
                        isWinning ? 'ring-4 ring-amber-400 ring-offset-2 ring-offset-[#DEC09B] scale-110 animate-pulse shadow-[0_0_15px_#f59e0b]' : ''
                      }`}>
                        {/* Highlights reflecting light on physical obsidian glass stones */}
                        <div className="absolute top-0.5 left-1 w-1 h-1 bg-white/30 rounded-full" />
                        
                        {isWinning && (
                          <span className="text-[9px] text-amber-300 animate-soft-pop block select-none">👑</span>
                        )}
                      </div>
                    )}

                    {/* Play White Stone Piece */}
                    {cell === AI_PIECE && (
                      <div className={`w-[20px] h-[20px] rounded-full bg-gradient-to-br from-white via-[#F4F2EE] to-[#DDDADA] border border-slate-300 shadow-[0_2.5px_5px_rgba(33,22,11,0.35),inset_0.5px_0.8px_1.5px_rgba(255,255,255,0.95)] z-10 select-none flex items-center justify-center transform hover:scale-105 active:scale-95 transition-all duration-150 relative ${
                        isWinning ? 'ring-4 ring-amber-400 ring-offset-2 ring-offset-[#DEC09B] scale-110 animate-pulse shadow-[0_0_15px_#f59e0b]' : ''
                      }`}>
                        {/* Gloss shader circle */}
                        <div className="absolute top-0.5 left-1 w-1 h-1 bg-white/60 rounded-full" />
                        
                        {isWinning && (
                          <span className="text-[9px] text-amber-500 animate-soft-pop block select-none">👑</span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Interactive Victory popup drawer */}
      {isGameOver && (
        <div className="kid-game-result mt-4 p-5 text-center max-w-xs mx-auto animate-soft-pop">
          {winner === PLAYER_PIECE ? (
            <div>
              <span className="text-4xl animate-soft-pop inline-block">👑⚫🏆</span>
              <h4 className="text-[13px] font-black text-rose-600 mt-2">
                {gameMode === 'ai' ? '大获全胜！黑子 5 连！' : '大喜讯！黑子队连成一线获胜！'}
              </h4>
              <p className="text-[10px] text-slate-500 font-bold mb-3.5 mt-0.5">
                {gameMode === 'ai' ? '为你颁发 100 颗超级闪亮星章！⭐' : '全家一起游戏，真是一场精彩对决！+50'}
              </p>
            </div>
          ) : winner === AI_PIECE ? (
            <div>
              <span className="text-4xl animate-soft-pop inline-block">🦁⚪🏆</span>
              <h4 className="text-[13px] font-black text-blue-800 mt-2">
                {gameMode === 'ai' ? '小布棋高一招，白子 5 连！' : '大喜讯！白子队连成一线获胜！'}
              </h4>
              <p className="text-[10px] text-slate-500 font-bold mb-3.5 mt-0.5">
                {gameMode === 'ai' ? '小布送你 15 颗星星奖励，整理思路再开一局！' : '全家脑力激荡！亲子五子棋奖励 50 星星！'}
              </p>
            </div>
          ) : (
            <div>
              <span className="text-3xl animate-soft-pop inline-block">🤝⚫⚪</span>
              <h4 className="text-[12px] font-black text-slate-755 mt-2">太精彩了！平分秋色！</h4>
              <p className="text-[10px] text-slate-500 font-bold mb-3.5 mt-0.5">双方势均力敌！合作奖励 50 颗星星！</p>
            </div>
          )}
          <button
            onClick={resetBoard}
            className="kid-game-primary w-full bg-teal-500 hover:bg-teal-600 text-white font-black text-xs py-2.5 rounded-xl transition-all active:translate-y-0.5 active:border-b-0 cursor-pointer"
          >
            ⚔️ 马上重开下一局 ⚔️
          </button>
        </div>
      )}
    </div>
  );
};
