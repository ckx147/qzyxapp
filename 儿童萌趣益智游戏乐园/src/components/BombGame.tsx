/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldAlert, RefreshCw, Zap, Flame, Smile, Play, Award, Plus, Trash2, Upload, Camera } from 'lucide-react';
import { UserProfile, GameRecord, Achievement } from '../types';
import { UserAvatar } from './UserAvatar';
import { soundSynth } from '../utils/audio';
import { readStorageJson, storageKeys, writeStorageJson } from '../utils/gameStorage';

interface BombGameProps {
  profile: UserProfile;
  achievements: Achievement[];
  setProfile: React.Dispatch<React.SetStateAction<UserProfile>>;
  setAchievements: React.Dispatch<React.SetStateAction<Achievement[]>>;
  onPointsChange: (amount: number, reason: string) => void;
  onNotification: (text: string, icon: string) => void;
}

interface PlayerItem {
  name: string;
  isAi: boolean;
  avatar: string;
}

export const PlayerAvatar: React.FC<{ id: string; className?: string }> = ({ id, className = "w-12 h-12" }) => {
  switch (id) {
    case 'baby_boy':
      return (
        <svg viewBox="0 0 100 100" className={`${className} aspect-square rounded-2xl overflow-hidden`} style={{ background: 'linear-gradient(135deg, #93C5FD, #3B82F6)' }}>
          <circle cx="50" cy="53" r="28" fill="#FDE047" opacity="0.15" />
          <circle cx="50" cy="52" r="23" fill="#FFE4E6" />
          <circle cx="26" cy="52" r="5" fill="#FFE4E6" />
          <circle cx="74" cy="52" r="5" fill="#FFE4E6" />
          <path d="M25,48 C25,25 75,25 75,48 C75,32 25,32 25,48 Z" fill="#475569" />
          <path d="M40,32 Q45,20 53,30" stroke="#475569" strokeWidth="4" strokeLinecap="round" fill="none" />
          <circle cx="42" cy="50" r="3" fill="#1E293B" />
          <circle cx="58" cy="50" r="3" fill="#1E293B" />
          <circle cx="36" cy="56" r="3" fill="#F43F5E" opacity="0.5" />
          <circle cx="64" cy="56" r="3" fill="#F43F5E" opacity="0.5" />
          <path d="M46,59 Q50,64 54,59" stroke="#E11D48" strokeWidth="2.5" strokeLinecap="round" fill="none" />
          <path d="M32,75 Q50,68 68,75 L62,100 L38,100 Z" fill="#1E3A8A" />
          <circle cx="50" cy="74" r="3" fill="#FFFFFF" />
        </svg>
      );
    case 'baby_girl':
      return (
        <svg viewBox="0 0 100 100" className={`${className} aspect-square rounded-2xl overflow-hidden`} style={{ background: 'linear-gradient(135deg, #FBCFE8, #EC4899)' }}>
          <circle cx="50" cy="52" r="23" fill="#FFE4E6" />
          <circle cx="26" cy="52" r="5" fill="#FFE4E6" />
          <circle cx="74" cy="52" r="5" fill="#FFE4E6" />
          <circle cx="24" cy="38" r="8" fill="#78350F" />
          <circle cx="76" cy="38" r="8" fill="#78350F" />
          <path d="M26,48 C25,24 75,24 74,48 C72,28 28,28 26,48 Z" fill="#78350F" />
          <path d="M22,32 L28,34 L25,38 Z" fill="#EF4444" />
          <path d="M78,32 L72,34 L75,38 Z" fill="#EF4444" />
          <circle cx="42" cy="50" r="3" fill="#1E293B" />
          <circle cx="58" cy="50" r="3" fill="#1E293B" />
          <circle cx="36" cy="56" r="3.5" fill="#F43F5E" opacity="0.6" />
          <circle cx="64" cy="56" r="3.5" fill="#F43F5E" opacity="0.6" />
          <path d="M46,59 Q50,63 54,59" stroke="#E11D48" strokeWidth="2.5" strokeLinecap="round" fill="none" />
          <path d="M32,75 Q50,70 68,75 L62,100 L38,100 Z" fill="#DB2777" />
          <path d="M42,75 L50,82 L58,75 Z" fill="#FFFFFF" />
        </svg>
      );
    case 'dad':
      return (
        <svg viewBox="0 0 100 100" className={`${className} aspect-square rounded-2xl overflow-hidden`} style={{ background: 'linear-gradient(135deg, #99F6E4, #0D9488)' }}>
          <circle cx="50" cy="50" r="24" fill="#FED7AA" />
          <path d="M24,45 C23,20 77,20 76,45 C73,26 27,26 24,45 Z" fill="#1E293B" />
          <path d="M26,50 C26,70 74,70 74,50" stroke="#475569" strokeWidth="2" strokeDasharray="3,3" fill="none" />
          <circle cx="41" cy="48" r="8" stroke="#1E293B" strokeWidth="3" fill="none" />
          <circle cx="59" cy="48" r="8" stroke="#1E293B" strokeWidth="3" fill="none" />
          <line x1="49" y1="48" x2="51" y2="48" stroke="#1E293B" strokeWidth="3" />
          <line x1="28" y1="48" x2="33" y2="48" stroke="#1E293B" strokeWidth="2" />
          <line x1="67" y1="48" x2="72" y2="48" stroke="#1E293B" strokeWidth="2" />
          <circle cx="41" cy="48" r="2.5" fill="#020617" />
          <circle cx="59" cy="48" r="2.5" fill="#020617" />
          <path d="M45,61 Q50,67 55,61" stroke="#C2410C" strokeWidth="2.5" strokeLinecap="round" fill="none" />
          <path d="M30,73 Q50,68 70,73 L64,100 L36,100 Z" fill="#0F172A" />
          <path d="M45,71 L50,83 L55,71 Z" fill="#FFFFFF" />
          <path d="M48,78 L52,78 L50,95 Z" fill="#EF4444" />
        </svg>
      );
    case 'mom':
      return (
        <svg viewBox="0 0 100 100" className={`${className} aspect-square rounded-2xl overflow-hidden`} style={{ background: 'linear-gradient(135deg, #FDE68A, #D97706)' }}>
          <circle cx="30" cy="46" r="14" fill="#451A03" />
          <circle cx="70" cy="46" r="14" fill="#451A03" />
          <circle cx="50" cy="30" r="15" fill="#451A03" />
          <circle cx="50" cy="50" r="23" fill="#FEE2E2" />
          <path d="M26,45 C26,22 74,22 74,45 C74,32 26,32 26,45 Z" fill="#451A03" />
          <path d="M37,47 Q42,43 45,48" stroke="#1E293B" strokeWidth="2.5" strokeLinecap="round" fill="none" />
          <path d="M55,48 Q58,43 63,47" stroke="#1E293B" strokeWidth="2.5" strokeLinecap="round" fill="none" />
          <circle cx="41" cy="49" r="2.5" fill="#1E293B" />
          <circle cx="59" cy="49" r="2.5" fill="#1E293B" />
          <circle cx="34" cy="56" r="4" fill="#EC4899" opacity="0.5" />
          <circle cx="66" cy="56" r="4" fill="#EC4899" opacity="0.5" />
          <path d="M45,59 Q50,65 55,59" stroke="#BE123C" strokeWidth="3" strokeLinecap="round" fill="none" />
          <path d="M30,73 Q50,68 70,73 L62,100 L38,100 Z" fill="#EF4444" />
          <circle cx="43" cy="74" r="2" fill="#FEF08A" />
          <circle cx="50" cy="75" r="2" fill="#FEF08A" />
          <circle cx="57" cy="74" r="2" fill="#FEF08A" />
        </svg>
      );
    case 'grandpa':
      return (
        <svg viewBox="0 0 100 100" className={`${className} aspect-square rounded-2xl overflow-hidden`} style={{ background: 'linear-gradient(135deg, #CBD5E1, #64748B)' }}>
          <circle cx="50" cy="52" r="23" fill="#FED7AA" />
          <path d="M24,52 C24,40 28,34 32,32 C28,38 26,44 26,52 Z" fill="#E2E8F0" />
          <path d="M76,52 C76,40 72,34 68,32 C72,38 74,44 74,52 Z" fill="#E2E8F0" />
          <circle cx="30" cy="36" r="6" fill="#E2E8F0" />
          <circle cx="70" cy="36" r="6" fill="#E2E8F0" />
          <path d="M34,42 Q40,38 44,41" stroke="#E2E8F0" strokeWidth="3" strokeLinecap="round" fill="none" />
          <path d="M56,41 Q60,38 66,42" stroke="#E2E8F0" strokeWidth="3" strokeLinecap="round" fill="none" />
          <circle cx="41" cy="48" r="7" stroke="#F59E0B" strokeWidth="2.5" fill="none" />
          <circle cx="59" cy="48" r="7" stroke="#F59E0B" strokeWidth="2.5" fill="none" />
          <line x1="48" y1="48" x2="52" y2="48" stroke="#F59E0B" strokeWidth="2.5" />
          <circle cx="41" cy="48" r="2" fill="#1E293B" />
          <circle cx="59" cy="48" r="2" fill="#1E293B" />
          <path d="M40,58 Q50,52 60,58 Q50,62 40,58 Z" fill="#F1F5F9" stroke="#CBD5E1" strokeWidth="1" />
          <path d="M46,63 Q50,67 54,63" stroke="#9A3412" strokeWidth="2" strokeLinecap="round" fill="none" />
          <path d="M32,75 Q50,71 68,75 L62,100 L38,100 Z" fill="#047857" />
        </svg>
      );
    case 'grandma':
      return (
        <svg viewBox="0 0 100 100" className={`${className} aspect-square rounded-2xl overflow-hidden`} style={{ background: 'linear-gradient(135deg, #E9D5FF, #8B5CF6)' }}>
          <circle cx="50" cy="24" r="10" fill="#E2E8F0" stroke="#CBD5E1" strokeWidth="1" />
          <circle cx="41" cy="27" r="8" fill="#E2E8F0" />
          <circle cx="59" cy="27" r="8" fill="#E2E8F0" />
          <circle cx="50" cy="52" r="23" fill="#FFE4E6" />
          <path d="M26,48 C26,26 74,26 74,48 C74,34 26,34 26,48 Z" fill="#E2E8F0" />
          <circle cx="39" cy="48" r="8" stroke="#7C3AED" strokeWidth="2" fill="none" />
          <circle cx="61" cy="48" r="8" stroke="#7C3AED" strokeWidth="2" fill="none" />
          <line x1="47" y1="48" x2="53" y2="48" stroke="#7C3AED" strokeWidth="2" />
          <circle cx="39" cy="48" r="2" fill="#1E293B" />
          <circle cx="61" cy="48" r="2" fill="#1E293B" />
          <circle cx="34" cy="56" r="3" fill="#EF4444" opacity="0.4" />
          <circle cx="66" cy="56" r="3" fill="#EF4444" opacity="0.4" />
          <path d="M45,61 Q50,67 55,61" stroke="#9F1239" strokeWidth="2.5" strokeLinecap="round" fill="none" />
          <path d="M32,75 Q50,71 68,75 L62,100 L38,100 Z" fill="#701A75" />
          <circle cx="50" cy="80" r="4" fill="#FBBF24" />
        </svg>
      );
    case 'sister':
      return (
        <svg viewBox="0 0 100 100" className={`${className} aspect-square rounded-2xl overflow-hidden`} style={{ background: 'linear-gradient(135deg, #A7F3D0, #059669)' }}>
          <circle cx="50" cy="52" r="23" fill="#FFF1F2" />
          <path d="M26,48 C26,25 74,25 74,48 C74,32 26,32 26,48 Z" fill="#B45309" />
          <path d="M24,46 L21,68 L27,68 Z" fill="#B45309" />
          <path d="M76,46 L79,68 L73,68 Z" fill="#B45309" />
          <rect x="29" y="38" width="6" height="2.5" rx="1" fill="#EF4444" transform="rotate(15 29 38)" />
          <rect x="65" y="38" width="6" height="2.5" rx="1" fill="#3B82F6" transform="rotate(-15 65 38)" />
          <circle cx="42" cy="50" r="3" fill="#0F172A" />
          <circle cx="58" cy="50" r="3" fill="#0F172A" />
          <circle cx="36" cy="56" r="3" fill="#F43F5E" opacity="0.6" />
          <circle cx="64" cy="56" r="3" fill="#F43F5E" opacity="0.6" />
          <path d="M46,59 Q50,63 54,59" stroke="#E11D48" strokeWidth="2.5" strokeLinecap="round" fill="none" />
          <path d="M32,75 Q50,71 68,75 L62,100 L38,100 Z" fill="#8B5CF6" />
        </svg>
      );
    case 'brother':
      return (
        <svg viewBox="0 0 100 100" className={`${className} aspect-square rounded-2xl overflow-hidden`} style={{ background: 'linear-gradient(135deg, #FED7AA, #EA580C)' }}>
          <circle cx="50" cy="52" r="23" fill="#FEE2E2" />
          <path d="M26,46 C26,24 74,24 74,46 Z" fill="#3B82F6" />
          <path d="M30,34 L70,34 L75,39 L25,39 Z" fill="#1D4ED8" />
          <circle cx="42" cy="50" r="3" fill="#0F172A" />
          <circle cx="58" cy="50" r="3" fill="#0F172A" />
          <path d="M46,59 Q50,64 54,59" stroke="#BE123C" strokeWidth="2.5" strokeLinecap="round" fill="none" />
          <path d="M32,75 Q50,70 68,75 L62,100 L38,100 Z" fill="#10B981" />
        </svg>
      );
    case 'dino':
      return (
        <svg viewBox="0 0 100 100" className={`${className} aspect-square rounded-2xl overflow-hidden`} style={{ background: 'linear-gradient(135deg, #A7F3D0, #10B981)' }}>
          <path d="M22,35 L12,40 L22,48 L10,55 L22,63 L14,70 L26,75" fill="#F59E0B" />
          <rect x="24" y="32" width="52" height="42" rx="20" fill="#059669" />
          <circle cx="45" cy="50" r="18" fill="#059669" />
          <circle cx="60" cy="56" r="16" fill="#059669" />
          <circle cx="54" cy="45" r="7" fill="#FFFFFF" />
          <circle cx="55" cy="45" r="4.5" fill="#1E293B" />
          <circle cx="57" cy="43" r="2" fill="#FFFFFF" />
          <circle cx="45" cy="56" r="4" fill="#F43F5E" opacity="0.6" />
          <path d="M52,56 Q58,60 62,54" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" fill="none" />
          <polygon points="54,56 57,56 56,60" fill="#FFFFFF" />
          <path d="M34,74 Q50,72 66,74 L62,100 L38,100 Z" fill="#047857" />
          <polygon points="50,80 52,85 57,85 53,88 55,93 50,90 45,93 47,88 43,85 48,85" fill="#FBBF24" />
        </svg>
      );
    case 'puppy':
      return (
        <svg viewBox="0 0 100 100" className={`${className} aspect-square rounded-2xl overflow-hidden`} style={{ background: 'linear-gradient(135deg, #FDE8E1, #D97706)' }}>
          <circle cx="50" cy="52" r="22" fill="#F59E0B" />
          <ellipse cx="50" cy="59" rx="10" ry="7" fill="#FFFBEB" />
          <polygon points="46,55 54,55 50,60" fill="#1E293B" rx="1" />
          <path d="M48,63 C48,70 52,70 52,63 Z" fill="#F43F5E" />
          <path d="M28,34 Q18,44 26,58 C32,58 32,46 28,34" fill="#78350F" />
          <path d="M72,34 Q82,44 74,58 C68,58 68,46 72,34" fill="#78350F" />
          <path d="M36,46 Q40,41 44,46" stroke="#1E293B" strokeWidth="3" strokeLinecap="round" fill="none" />
          <path d="M56,46 Q60,41 64,46" stroke="#1E293B" strokeWidth="3" strokeLinecap="round" fill="none" />
          <circle cx="34" cy="54" r="3" fill="#F43F5E" opacity="0.5" />
          <circle cx="66" cy="54" r="3" fill="#F43F5E" opacity="0.5" />
          <path d="M34,74 Q50,71 66,74 L60,100 L40,100 Z" fill="#EF4444" />
          <circle cx="50" cy="80" r="3" fill="#FBBF24" />
        </svg>
      );
    case 'kitten':
      return (
        <svg viewBox="0 0 100 100" className={`${className} aspect-square rounded-2xl overflow-hidden`} style={{ background: 'linear-gradient(135deg, #FEF3C7, #F59E0B)' }}>
          <polygon points="20,24 42,34 26,48" fill="#FEE2E2" />
          <polygon points="80,24 58,34 74,48" fill="#FEE2E2" />
          <polygon points="18,22 40,34 24,46" fill="#D97706" />
          <polygon points="82,22 60,34 76,46" fill="#D97706" />
          <circle cx="50" cy="53" r="21" fill="#F59E0B" />
          <ellipse cx="45" cy="60" rx="6" ry="4" fill="#FFFFFF" />
          <ellipse cx="55" cy="60" rx="6" ry="4" fill="#FFFFFF" />
          <polygon points="48,56 52,56 50,59" fill="#F43F5E" />
          <line x1="26" y1="58" x2="14" y2="56" stroke="#451A03" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="26" y1="62" x2="12" y2="62" stroke="#451A03" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="74" y1="58" x2="86" y2="56" stroke="#451A03" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="74" y1="62" x2="88" y2="62" stroke="#451A03" strokeWidth="1.5" strokeLinecap="round" />
          <circle cx="41" cy="48" r="4.5" fill="#1E293B" />
          <circle cx="59" cy="48" r="4.5" fill="#1E293B" />
          <circle cx="42" cy="46" r="1.5" fill="#FFFFFF" />
          <circle cx="60" cy="46" r="1.5" fill="#FFFFFF" />
          <path d="M47,60 Q50,62 53,60" fill="none" stroke="#451A03" strokeWidth="2" strokeLinecap="round" />
          <path d="M34,74 Q50,72 66,74 L60,100 L40,100 Z" fill="#D97706" />
        </svg>
      );
    default:
      return <UserAvatar id={id} className={className} />;
  }
};

const PENALTIES = [
  { text: "双手叉腰，学可爱小兔子双腿跳 5 下 🐰", icon: "🐰" },
  { text: "像快乐小猫一样趴下，伸个大懒腰喵喵叫 🐱", icon: "🐱" },
  { text: "单脚站立学小公鸡大声喔喔叫 5 秒 🐔", icon: "🐔" },
  { text: "双手握拳像强壮金刚大猩猩一样敲敲胸口，大喊自己超聪明！🦍", icon: "🦍" },
  { text: "双臂张开学飞机起飞，在房间里快乐飞完 1 圈 ✈️", icon: "✈️" },
  { text: "做 4 次深深呼气吸气，并做出最大最夸张的鬼脸表情 🤪", icon: "🤪" },
  { text: "屁股左右摇摆 6 次，学企鹅摆一摆 🐧", icon: "🐧" }
];

const DEFAULT_PLAYERS_LIST: PlayerItem[] = [
  { name: '宝贝', isAi: false, avatar: 'baby_boy' },
  { name: '小布', isAi: true, avatar: 'dino' }
];

const AVATAR_OPTIONS = [
  { id: 'baby_boy', name: '宝贝男孩' },
  { id: 'baby_girl', name: '宝贝女孩' },
  { id: 'dad', name: '爸爸' },
  { id: 'mom', name: '妈妈' },
  { id: 'grandpa', name: '爷爷' },
  { id: 'grandma', name: '奶奶' },
  { id: 'sister', name: '姐姐' },
  { id: 'brother', name: '哥哥' },
  { id: 'dino', name: '小布(AI)' },
  { id: 'puppy', name: '小狗' },
  { id: 'kitten', name: '小猫' },
];

export const BombGame: React.FC<BombGameProps> = ({
  profile,
  achievements,
  setProfile,
  setAchievements,
  onPointsChange,
  onNotification,
}) => {
  const [players, setPlayers] = useState<PlayerItem[]>(() => [
    { name: profile.nickname || '宝贝', isAi: false, avatar: profile.avatarId || 'baby_boy' },
    { name: '小布', isAi: true, avatar: 'dino' }
  ]);
  const [activePlayerIndex, setActivePlayerIndex] = useState(0);
  const [minBound, setMinBound] = useState(1);
  const [maxBound, setMaxBound] = useState(100);
  const [secretBomb, setSecretBomb] = useState(0);
  const [gameStage, setGameStage] = useState<'welcome' | 'playing' | 'exploded' | 'cleared'>('welcome');
  const [currentGuess, setCurrentGuess] = useState('');
  const [history, setHistory] = useState<{ senderName: string; avatar: string; guess: number; feedback: string; isAi: boolean }[]>([]);
  const [selectedPenalty, setSelectedPenalty] = useState<typeof PENALTIES[0] | null>(null);
  const [explodingPlayer, setExplodingPlayer] = useState<PlayerItem | null>(null);
  const [shakeScreen, setShakeScreen] = useState(false);
  const [aiIsThinking, setAiIsThinking] = useState(false);
  const [newPlayerName, setNewPlayerName] = useState('');
  const [selectedAvatarId, setSelectedAvatarId] = useState('baby_boy');

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [customAvatars, setCustomAvatars] = useState<string[]>(() => {
    return readStorageJson<string[]>(storageKeys.bombCustomAvatars, []);
  });

  useEffect(() => {
    const saved = writeStorageJson(storageKeys.bombCustomAvatars, customAvatars);
    if (!saved) {
      console.warn('Failed to save custom avatars');
    }
  }, [customAvatars]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      onNotification("请上传图片文件哟！", "Info");
      return;
    }

    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Build a perfect squarish 1:1 image format at 160x160 resolution
        const size = 160;
        canvas.width = size;
        canvas.height = size;
        
        const minSide = Math.min(img.width, img.height);
        const sx = (img.width - minSide) / 2;
        const sy = (img.height - minSide) / 2;
        
        ctx.drawImage(img, sx, sy, minSide, minSide, 0, 0, size, size);
        
        try {
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.85);
          setCustomAvatars(prev => {
            const updated = [compressedDataUrl, ...prev].slice(0, 12);
            return updated;
          });
          setSelectedAvatarId(compressedDataUrl);
          onNotification("创意头像上传成功！已选定 📷", "Success");
        } catch (err) {
          onNotification("图片转换失败，请更换一张试试！", "Info");
        }
      }
    };
    img.onerror = () => {
      onNotification("图片加载失败，换一张试试吧", "Info");
    };
    
    img.src = URL.createObjectURL(file);
  };

  // Initialize bomb
  const startNewGame = () => {
    if (players.length < 2) {
      onNotification("最少要 2 个小伙伴参与游戏哦！", "Info");
      return;
    }
    const bomb = Math.floor(Math.random() * 98) + 2; // bomb strictly between 2 and 99 initially
    setSecretBomb(bomb);
    setMinBound(1);
    setMaxBound(100);
    setHistory([]);
    setCurrentGuess('');
    setActivePlayerIndex(0);
    setExplodingPlayer(null);
    setSelectedPenalty(null);
    setGameStage('playing');
  };

  // AI guess logic
  useEffect(() => {
    if (gameStage === 'playing' && players[activePlayerIndex]?.isAi) {
      setAiIsThinking(true);
      const timer = setTimeout(() => {
        // AI makes a smart guess in current min and max boundaries
        const range = maxBound - minBound;
        let aiGuess = 0;
        
        if (range <= 1) {
          aiGuess = minBound + 1; // force trigger
        } else {
          // AI prefers central smart guesses to narrow it or can guess slightly random to be fun
          const center = Math.floor((minBound + maxBound) / 2);
          const deviation = Math.floor((Math.random() * (range / 3)) - (range / 6));
          aiGuess = Math.max(minBound + 1, Math.min(maxBound - 1, center + deviation));
        }

        // Handle AI guess trigger
        handleGuessValue(aiGuess, activePlayerIndex);
        setAiIsThinking(false);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [activePlayerIndex, gameStage]);

  const handleGuessValue = (num: number, playerIdx: number) => {
    const currentPlayer = players[playerIdx];
    if (!currentPlayer) return;

    if (num <= minBound || num >= maxBound) {
      if (!currentPlayer.isAi) {
        soundSynth.playWarning();
        onNotification(`哎呀，必须猜 ${minBound} 到 ${maxBound} 之间的数字呀！`, 'ShieldAlert');
      }
      return;
    }

    if (num === secretBomb) {
      setShakeScreen(true);
      setTimeout(() => setShakeScreen(false), 800);

      // Bomb exploded!
      setExplodingPlayer(currentPlayer);

      if (!currentPlayer.isAi) {
        // Human player loses, triggering movement penalty
        soundSynth.playExplode();
        const randomPenalty = PENALTIES[Math.floor(Math.random() * PENALTIES.length)];
        setSelectedPenalty(randomPenalty);
        setGameStage('exploded');

        // Record metrics
        setProfile(prev => {
          const updatedRecords = {
            ...prev.records,
            bombGuesses: prev.records.bombGuesses + 1,
            bombExplodes: prev.records.bombExplodes + 1,
          };
          return {
            ...prev,
            records: updatedRecords
          };
        });

        // Evaluate achievements
        setAchievements(prev => {
          return prev.map(ach => {
            if (ach.id === 'ach_bomb_1') {
              return { ...ach, progress: 1 };
            }
            return ach;
          });
        });

      } else {
        // AI loses! Kid group wins by safe survival!
        soundSynth.playWin();
        setGameStage('cleared');
        onPointsChange(50, "在数字炸弹幸存并在AI踩中炸弹时获胜");

        // Record metrics
        setProfile(prev => {
          const updatedRecords = {
            ...prev.records,
            bombGuesses: prev.records.bombGuesses + 1,
            bombClears: prev.records.bombClears + 1,
          };
          return {
            ...prev,
            records: updatedRecords
          };
        });

        // Evaluate clearing achievements
        setAchievements(prev => {
          return prev.map(ach => {
            if (ach.id === 'ach_bomb_3') {
              const current = ach.progress + 1;
              return { ...ach, progress: Math.min(ach.targetValue, current) };
            }
            return ach;
          });
        });
      }
      return;
    }

    // Shrink boundaries
    soundSynth.playMove();
    let feedback = '';
    if (num < secretBomb) {
      setMinBound(num);
      feedback = `大于 ${num}`;
    } else {
      setMaxBound(num);
      feedback = `小于 ${num}`;
    }

    setHistory(prev => [{ 
      senderName: currentPlayer.name, 
      avatar: currentPlayer.avatar,
      guess: num, 
      isAi: currentPlayer.isAi,
      feedback 
    }, ...prev]);

    setCurrentGuess('');
    setActivePlayerIndex((playerIdx + 1) % players.length);
  };

  const handlePlayerSubmit = () => {
    const num = parseInt(currentGuess);
    if (isNaN(num)) {
      soundSynth.playWarning();
      onNotification("请输入一个正确的数字哦！", "Info");
      return;
    }
    handleGuessValue(num, activePlayerIndex);
  };

  // Keyboard keypad press helpers
  const pressKey = (val: string) => {
    soundSynth.playClick();
    if (val === 'C') {
      setCurrentGuess('');
    } else if (val === '⌫') {
      setCurrentGuess(prev => prev.slice(0, -1));
    } else {
      if (currentGuess.length >= 3) return; // limit to 3 digits (100 is max)
      setCurrentGuess(prev => prev + val);
    }
  };

  const completeExplodePenalty = () => {
    setGameStage('welcome');
    onNotification("运动完毕！大家和身体都得到了极棒的锻炼！🌟", "Smile");
    onPointsChange(10, "完成数字炸弹趣味运动惩罚鼓励奖"); // friendly consolation points
  };

  return (
    <div className={`kid-game-panel p-5 transition-all ${shakeScreen ? 'animate-shake' : ''}`} id="bomb-game-module">
      <div className="kid-game-header flex items-center justify-between mb-4 pb-3">
        <div className="flex items-center gap-2">
          <span className="text-3xl animate-soft-pop">💣</span>
          <div className="text-left leading-tight">
            <h3 className="font-black text-slate-700 text-sm">亲子数字炸弹大对决</h3>
            <p className="text-[10px] text-orange-500 font-bold mt-0.5">支持多人和爸爸妈妈一起玩的排雷派对游戏！🎈</p>
          </div>
        </div>
        <button 
          onClick={startNewGame}
          className="bg-orange-50 hover:bg-orange-100 border border-orange-200 text-orange-700 py-1.5 px-3.5 rounded-full text-xs font-black flex items-center gap-1 transition-all cursor-pointer"
        >
          <RefreshCw size={12} /> 重置首局
        </button>
      </div>

      <div className="storybook-game-scene scene-bomb p-4 mb-4 text-left">
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-14 h-14 rounded-2xl bg-white/90 border border-rose-100 flex items-center justify-center text-3xl shadow-sm">
            ⏱️
          </div>
          <div className="flex-1 min-w-0">
            <span className="inline-flex bg-white/85 border border-orange-100 text-[#D97706] rounded-full px-2.5 py-1 text-[9px] font-black mb-1">
              第一章 · 数字山谷的安全钟
            </span>
            <p className="text-[10.5px] text-[#6B5338] font-bold leading-relaxed">
              山谷里的安全钟滴答作响，排雷队要在数字边界中找出危险数。
            </p>
          </div>
          <span className="relative z-10 text-4xl animate-soft-pop">💣</span>
        </div>
      </div>

      {/* Screen Game Stage routers */}
      {gameStage === 'welcome' && (
        <div className="text-center py-8 px-4 animate-fade-in" id="bomb-intro-view">
          <div className="text-6xl mb-4 animate-soft-pop">💣💥</div>
          <h4 className="text-sm font-black text-slate-700 mb-2">安全预警！数字炸弹已安放</h4>
          <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed mb-6 font-bold">
            在数字 <span className="text-orange-500 font-black px-1">1 ~ 100</span> 中隐藏着一个会让炸弹爆炸的秘密数字！排雷队轮流拆雷，输入数字后边界会越来越窄，猜中秘密数字的一方就会引发炸弹爆炸哦！
          </p>

          {/* Family Players Setup Area */}
          <div className="bg-white rounded-[24px] border border-orange-100 p-4 shadow-sm mb-6 max-w-md mx-auto text-left">
            <h5 className="text-xs font-black text-rose-500 mb-2 flex items-center gap-1">
              👨‍{""}‍{""}👧‍{""}👦 设置排雷成员 (可任意增减人数)
            </h5>
            <p className="text-[10px] text-slate-400 font-bold mb-3 leading-relaxed">
              支持 2 人以上的任何人数游戏！可以添加爸爸妈妈、爷爷奶奶，陪伴龙小布（自动AI逻辑）也可共同进行。
            </p>

            {/* Existing Players list display */}
            <div className="flex flex-wrap gap-2 mb-4">
              {players.map((plr, index) => (
                <div 
                  key={index}
                  className="bg-slate-50 border border-slate-200/60 rounded-2xl py-1 L-1 pr-3 flex items-center gap-2 text-xs font-black text-slate-700 animate-fade-in shadow-3xs"
                >
                  <PlayerAvatar id={plr.avatar} className="w-9 h-9" />
                  <div className="flex flex-col items-start leading-none">
                    <span className="text-[11px] font-bold">{plr.name}</span>
                    {plr.isAi && <span className="text-[8px] text-[#D97706] font-extrabold mt-0.5">智能机器人</span>}
                  </div>
                  {players.length > 2 && (
                    <button
                      onClick={() => {
                        setPlayers(prev => prev.filter((_, i) => i !== index));
                      }}
                      className="text-slate-400 hover:text-red-500 hover:bg-slate-100 p-1.5 rounded-full transition-all cursor-pointer ml-1"
                    >
                      <Trash2 size={12} />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Quick pre-select chips */}
            <div className="mb-4">
              <span className="text-[10px] uppercase font-black text-[#D97706] block mb-1.5">🧁 一键快速加入:</span>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { name: '爸爸', avatar: 'dad', isAi: false },
                  { name: '妈妈', avatar: 'mom', isAi: false },
                  { name: '爷爷', avatar: 'grandpa', isAi: false },
                  { name: '奶奶', avatar: 'grandma', isAi: false },
                  { name: '姐姐', avatar: 'sister', isAi: false },
                  { name: '哥哥', avatar: 'brother', isAi: false },
                  { name: '小狗', avatar: 'puppy', isAi: false },
                  { name: '小猫', avatar: 'kitten', isAi: false },
                  { name: '小布', avatar: 'dino', isAi: true }
                ].map((preset, pIdx) => {
                  const alreadyHas = players.some(pl => pl.name === preset.name);
                  return (
                    <button
                      key={pIdx}
                      disabled={alreadyHas || players.length >= 10}
                      onClick={() => {
                        setPlayers(prev => [...prev, { name: preset.name, isAi: preset.isAi, avatar: preset.avatar }]);
                      }}
                      className="bg-white border border-slate-200 hover:bg-orange-50 hover:border-orange-200 text-orange-800 font-bold text-[10px] py-1 px-2.5 rounded-xl disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-1 cursor-pointer shadow-3xs"
                    >
                      + {preset.name}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Tap to Pick Custom Avatar Grid */}
            <div className="mb-4 bg-slate-50/50 p-4 rounded-2xl border border-slate-200">
              <span className="text-[10px] uppercase font-black text-rose-500 block mb-3">🎨 挑选头像 (点击挑选推荐，或上传你/宝宝的照片)：</span>
              
              {/* Custom uploaded group (only if there are custom uploaded avatars) */}
              {customAvatars.length > 0 && (
                <div className="mb-4 bg-orange-50/40 p-2.5 rounded-xl border border-orange-100">
                  <span className="text-[10px] font-black text-orange-600 block mb-2">⭐ 已上传的自定义头像 (点击选中)：</span>
                  <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                    {customAvatars.map((dataUrl, idx) => {
                      const isSelected = selectedAvatarId === dataUrl;
                      return (
                        <div key={idx} className="relative group flex flex-col items-center">
                          <button
                            type="button"
                            onClick={() => setSelectedAvatarId(dataUrl)}
                            className={`w-full flex flex-col items-center p-1.5 rounded-xl border-2 transition-all cursor-pointer ${
                              isSelected 
                                ? 'border-orange-500 bg-white scale-105 shadow-sm' 
                                : 'border-transparent bg-slate-100/50 hover:bg-slate-100/80 hover:border-slate-200'
                            }`}
                          >
                            <PlayerAvatar id={dataUrl} className="w-8 h-8 select-none pointer-events-none" />
                            <span className="text-[8px] font-black text-slate-500 mt-1 leading-none truncate w-full text-center">自定义 {idx + 1}</span>
                          </button>
                          
                          {/* Small trash/remove button to delete from list */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setCustomAvatars(prev => prev.filter((_, i) => i !== idx));
                              if (selectedAvatarId === dataUrl) {
                                setSelectedAvatarId('baby_boy');
                              }
                              onNotification("已删除此自定义头像", "Info");
                            }}
                            className="absolute -top-1 -right-1 bg-rose-500 hover:bg-rose-600 text-white p-0.5 rounded-full shadow-md hover:scale-110 transition-all cursor-pointer z-10"
                          >
                            <Trash2 size={8} />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Standard presets + Upload trigger button */}
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-black text-slate-400 block font-bold">🎁 官方推荐 & 本地上传：</span>
              </div>
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                {/* Upload Trigger Button Card */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex flex-col items-center justify-center p-1.5 rounded-xl border-2 border-dashed border-slate-300 bg-white hover:bg-orange-50 hover:border-orange-400 hover:text-orange-600 transition-all cursor-pointer aspect-square"
                >
                  <Upload size={16} className="text-slate-400 mb-1" />
                  <span className="text-[8px] font-extrabold text-slate-500 leading-none">本地上传</span>
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept="image/*" 
                    onChange={handleFileUpload} 
                  />
                </button>

                {AVATAR_OPTIONS.map((av) => {
                  const isSelected = selectedAvatarId === av.id;
                  return (
                    <button
                      key={av.id}
                      type="button"
                      onClick={() => setSelectedAvatarId(av.id)}
                      className={`flex flex-col items-center p-1.5 rounded-xl border-2 transition-all cursor-pointer ${
                        isSelected 
                          ? 'border-orange-500 bg-white scale-105 shadow-sm' 
                          : 'border-transparent bg-slate-100/50 hover:bg-slate-100/80 hover:border-slate-200'
                      }`}
                    >
                      <PlayerAvatar id={av.id} className="w-8 h-8 select-none pointer-events-none" />
                      <span className="text-[8px] font-bold text-slate-500 mt-1 leading-none">{av.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Custom name typing builder */}
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="或者输入其他名称，例如：小宝"
                value={newPlayerName}
                onChange={(e) => setNewPlayerName(e.target.value)}
                maxLength={8}
                className="flex-1 border-2 border-orange-100 rounded-xl px-3 py-1.5 text-xs text-slate-700 font-bold focus:outline-none focus:border-orange-300"
              />
              <button
                onClick={() => {
                  if (!newPlayerName.trim()) return;
                  if (players.length >= 10) {
                    onNotification("成员太多分不清啦，最多 10 人哦！", "Info");
                    return;
                  }
                  setPlayers(prev => [...prev, { name: newPlayerName.trim(), isAi: false, avatar: selectedAvatarId }]);
                  setNewPlayerName('');
                }}
                className="bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white font-black text-xs px-4 py-1.5 rounded-xl border border-orange-600 shadow-3xs cursor-pointer flex items-center gap-1 transition-all"
              >
                <Plus size={12} /> 自定义添加成员
              </button>
            </div>
          </div>

          <div className="kid-game-note p-4 mb-6 text-left max-w-md mx-auto">
            <h5 className="text-xs font-black text-[#D97706] flex items-center gap-1.5 mb-1">
              <Zap size={14} className="text-amber-500 fill-amber-300" /> 萌趣运动规则：
            </h5>
            <p className="text-[11px] text-slate-600 leading-relaxed font-bold">
              如果不幸踩了炸弹，不要灰心！只要根据屏幕提示完成一个<strong className="text-rose-500">超萌超简单的身体舒展小惩罚</strong>，依然可以领到 10 星星的健康徽章鼓励哟！
            </p>
          </div>

          <button
            onClick={startNewGame}
            className="kid-game-primary bg-[#FF9F1C] hover:bg-[#F59E0B] text-white font-black text-sm py-3.5 px-8 rounded-full active:translate-y-0.5 active:border-b-0 duration-150 cursor-pointer flex items-center gap-2 mx-auto animate-soft-pop"
          >
            <Play size={18} fill="currentColor" /> 开启拆雷派对！
          </button>
        </div>
      )}

      {gameStage === 'playing' && (
        <div className="space-y-4 animate-fade-in" id="bomb-play-view">
          {/* Players Game Turn Lineup */}
          <div className="bg-slate-50 p-2.5 rounded-2xl border border-slate-200 flex items-center gap-2 overflow-x-auto select-none justify-start md:justify-center">
            {players.map((plr, idx) => {
              const isActive = idx === activePlayerIndex;
              return (
                <div 
                  key={idx}
                  className={`py-1 px-3 rounded-2xl flex items-center gap-2 text-[11px] font-black transition-all duration-150 shrink-0 ${
                    isActive 
                      ? 'bg-gradient-to-r from-amber-400 to-orange-400 text-white shadow-sm scale-105 ring-2 ring-orange-300' 
                      : 'bg-[#FFF9F2]/60 text-slate-500 opacity-60'
                  }`}
                >
                  <PlayerAvatar id={plr.avatar} className="w-6 h-6 animate-pulse" />
                  <span>{plr.name}</span>
                </div>
              );
            })}
          </div>

          {/* Main big display of live ranges */}
          <div className="kid-game-note p-5 text-center relative overflow-hidden">
            <div className="absolute top-1.5 left-3 flex gap-1 text-[9px] text-[#D97706] font-black uppercase tracking-wider">当前排雷安全边界</div>
            <div className="flex items-center justify-around py-3">
              <div className="text-center">
                <span className="text-[10px] font-black text-slate-400">大于</span>
                <p className="text-4xl font-black text-[#FF6B6B] font-mono mt-1">{minBound}</p>
              </div>
              <div className="text-[#FF9F1C] text-2xl font-black animate-pulse">↔️</div>
              <div className="text-center">
                <span className="text-[10px] font-black text-slate-400">小于</span>
                <p className="text-4xl font-black text-[#FF6B6B] font-mono mt-1">{maxBound}</p>
              </div>
            </div>

            {/* Turn tracker */}
            <div className="bg-white rounded-2xl py-2 px-3 border border-[#FFE0C2] flex items-center justify-between text-xs font-bold shadow-3xs">
              {players[activePlayerIndex]?.isAi ? (
                <div className="flex items-center gap-2.5 text-[#D97706] w-full justify-center">
                  <PlayerAvatar id={players[activePlayerIndex]?.avatar} className="w-8 h-8 animate-pulse" />
                  <span className="font-extrabold text-orange-600">
                    🦕 {players[activePlayerIndex]?.name} 正在抓耳挠腮地思考排雷...
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-2.5 text-indigo-700 w-full justify-center">
                  <PlayerAvatar id={players[activePlayerIndex]?.avatar} className="w-8 h-8 animate-soft-pop" />
                  <span className="font-extrabold text-indigo-800">
                    👉 轮到 【{players[activePlayerIndex]?.name}】 排除！在下方按键盘输入
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* User input area - only show when user's turn */}
          <div className="grid grid-cols-12 gap-3">
            {/* Input & Keypad */}
            <div className="col-span-12 md:col-span-6 space-y-2">
              <div className="bg-white rounded-2xl border-2 border-orange-100 p-2 text-center flex items-center justify-between shadow-inner">
                <span className="text-[10px] font-black text-slate-400 pl-2">
                  {!players[activePlayerIndex]?.isAi ? `${players[activePlayerIndex]?.name} 写的数字` : '小布排除数'}:
                </span>
                <span className="text-3xl font-black text-[#FF6B6B] font-mono pr-4 h-10 flex items-center">
                  {currentGuess || <span className="text-slate-200 text-2xl font-sans">??</span>}
                </span>
              </div>
              
              {/* Kids pad */}
              <div className="grid grid-cols-3 gap-1.5" id="kids-bomb-keypad">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', '⌫'].map(k => (
                  <button
                    key={k}
                    onClick={() => pressKey(k)}
                    disabled={players[activePlayerIndex]?.isAi || aiIsThinking}
                    className="bg-white border active:translate-y-0.5 border-orange-200 disabled:opacity-50 text-[#FF6B6B] font-black py-2.5 rounded-xl shadow-xs text-lg transition-all cursor-pointer flex items-center justify-center font-mono"
                  >
                    {k}
                  </button>
                ))}
              </div>

              {/* Submit guessed sum */}
              <button
                onClick={handlePlayerSubmit}
                disabled={players[activePlayerIndex]?.isAi || currentGuess === '' || aiIsThinking}
                className="kid-game-primary w-full bg-[#FF6B6B] disabled:from-slate-200 disabled:to-slate-300 disabled:text-slate-400 disabled:cursor-not-allowed hover:bg-[#FF8E9E] text-white font-black py-3 rounded-2xl cursor-pointer transition-all flex items-center justify-center gap-2 text-xs uppercase tracking-wide duration-75 active:translate-y-0.5 active:border-b-0"
                id="btn-guess-submit"
              >
                <ShieldAlert size={14} /> 给 {players[activePlayerIndex]?.name} 排除高危数字 ({currentGuess || '?'})
              </button>
            </div>

            {/* Game Logs / History */}
            <div className="col-span-12 md:col-span-6 bg-[#FFF9F2] rounded-[24px] p-3.5 border border-orange-100 flex flex-col h-70">
              <span className="text-[10px] font-black text-[#D97706] mb-2 flex items-center gap-1 uppercase tracking-wider">
                💬 战场排解记录 ({history.length} 回合)
              </span>
              <div className="flex-1 overflow-y-auto space-y-2 pr-1 text-left scrollbar-thin">
                {history.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-slate-400 text-xs text-center">
                    <p className="font-bold">雷区静悄悄...</p>
                    <p className="text-[9px] text-slate-400 mt-1 font-semibold">写下一个数字，边界即刻缩窄！</p>
                  </div>
                ) : (
                  history.map((h, i) => (
                    <div 
                      key={i}
                      className={`p-2 rounded-xl text-xs flex items-center justify-between border ${
                        !h.isAi 
                          ? 'bg-[#FFF1F2] border-[#FFE4E6] text-rose-950' 
                          : 'bg-[#F0F9FF] border-[#E0F2FE] text-sky-950'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <PlayerAvatar id={h.avatar} className="w-7 h-7" />
                        <span className="font-bold text-[11px]">
                          <strong>{h.senderName}</strong> 排除 <strong className="font-mono text-xs underline bg-white px-1.5 py-0.5 rounded-md">{h.guess}</strong>
                        </span>
                      </div>
                      <span className="font-black bg-white py-0.5 px-2 rounded-full text-[9px] text-[#FF6B6B] shadow-3xs uppercase tracking-wide">
                        {h.feedback}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* EXPLODED GAME OVER STAGE */}
      {gameStage === 'exploded' && selectedPenalty && (
        <div className="kid-game-result text-center py-6 px-4 max-w-sm mx-auto animate-soft-pop" id="bomb-exploded-panel">
          <motion.div 
            animate={{ scale: [1, 1.4, 0.9, 1.2, 1], rotate: [0, -15, 15, 0] }}
            transition={{ duration: 0.8 }}
            className="text-7xl mb-4"
          >
            💥💣🔥
          </motion.div>
          <h4 className="text-lg font-black text-rose-850 mb-1">呜哇！炸弹爆炸炸开花啦！💥</h4>
          <p className="text-xs font-bold text-slate-500 mb-4">
            很遗憾！<span className="text-rose-600 font-black pr-1">{explodingPlayer?.name}</span>
            排除到了神秘秘密数字 <span className="bg-rose-500 text-white rounded-full px-2 py-0.5 font-mono text-xs font-bold">{secretBomb}</span>！
          </p>

          <div className="bg-white rounded-2xl border border-rose-200 p-5 shadow-inner mb-6 mx-auto flex flex-col items-center">
            <PlayerAvatar id={explodingPlayer?.avatar || 'baby_boy'} className="w-16 h-16 mb-2.5 shadow-sm" />
            <span className="inline-block bg-rose-100 text-rose-700 font-extrabold text-[10px] px-3 py-1 rounded-full mb-3">
              🍭 亲子趣味暖身小惩罚
            </span>
            <div className="text-4xl mb-2">{selectedPenalty.icon}</div>
            <p className="text-xs font-black text-slate-700 leading-relaxed text-center">
              请大玩家/小朋友 <strong className="text-rose-600 font-black">{explodingPlayer?.name}</strong> 接受做这个趣味运动：
            </p>
            <p className="text-xs font-black text-amber-600 leading-relaxed mt-1 text-center font-bold">
              {selectedPenalty.text}
            </p>
          </div>

          <div className="flex flex-col gap-2 mx-auto">
            <button
              onClick={completeExplodePenalty}
              className="kid-game-primary w-full bg-[#FF6B6B] hover:bg-[#FF8E9E] text-white font-black py-3.5 rounded-2xl active:translate-y-0.5 active:border-b-0 transition-all text-xs cursor-pointer"
            >
              🙋 我已经完成了有趣的运动惩罚！
            </button>
            <button
              onClick={startNewGame}
              className="bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold py-2 rounded-xl text-xs transition-all"
            >
              换个数重新来一局
            </button>
          </div>
        </div>
      )}

      {/* GAME SURVIVED CLEARED STAGE */}
      {gameStage === 'cleared' && (
        <div className="kid-game-result text-center py-8 px-4 max-w-sm mx-auto" id="bomb-cleared-panel">
          <div className="text-7xl mb-3 animate-soft-pop">🏆⭐🦖</div>
          <h4 className="text-[#059669] text-base font-black mb-1">🎉 耶！雷区大成功排除！</h4>
          <p className="text-xs font-bold text-slate-500 mb-4">
            太空安全大胜利！智能队友 <span className="text-emerald-600 font-extrabold">{explodingPlayer?.name || '小布'}</span> 踩中了最后的炸弹数字 <span className="bg-emerald-500 text-white font-bold rounded-full px-2 py-0.5 font-mono text-sm">{secretBomb}</span>。全体人类小分队安全幸存！🏆
          </p>

          <div className="bg-white rounded-2xl border border-emerald-200 p-4 shadow-inner mb-6 mx-auto flex flex-col items-center animate-fade-in">
            <PlayerAvatar id={explodingPlayer?.avatar || 'dino'} className="w-16 h-16 mb-2.5 shadow-sm" />
            <p className="text-slate-600 text-xs font-black mb-2 text-center">🎉 智能系统正在接受可爱运动惩罚：</p>
            <p className="text-xs font-black text-[#D97706] leading-relaxed mb-4 text-center">
              “{explodingPlayer?.name || '小布'} 学可爱小青蛙原地高高跳 3 下 🐸，哼哧哼哧扭尾巴！”
            </p>
            <div className="border-t border-slate-100 pt-3 flex items-center justify-around w-full">
              <div>
                <span className="text-2xl">✨</span>
                <p className="text-[10px] font-black text-emerald-700 font-bold">积分奖励 +50</p>
              </div>
              <div className="w-px h-8 bg-slate-200" />
              <div>
                <span className="text-2xl">🍎</span>
                <p className="text-[10px] font-black text-emerald-700 font-bold">太空排雷师</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 justify-center mx-auto">
            <button
              onClick={startNewGame}
              className="kid-game-primary flex-1 bg-emerald-500 hover:bg-emerald-600 text-white font-black py-3.5 rounded-2xl active:translate-y-0.5 active:border-b-0 transition-all text-xs cursor-pointer"
            >
              继续挑战
            </button>
            <button
              onClick={() => setGameStage('welcome')}
              className="bg-slate-200 hover:bg-slate-300 text-slate-600 font-extrabold py-3.5 px-4 rounded-2xl text-[10px] transition-all cursor-pointer"
            >
              返回
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
