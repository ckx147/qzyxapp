/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'motion/react';
import { User, Edit2, Check, Award, Flame, Heart, Sparkles, Trophy, Eye, Star, Upload, Trash2 } from 'lucide-react';
import { UserProfile, LeaderboardItem } from '../types';
import { AVATARS } from '../utils/gameHelpers';
import { UserAvatar } from './UserAvatar';

interface ProfileProps {
  profile: UserProfile;
  leaderboard: LeaderboardItem[];
  setProfile: React.Dispatch<React.SetStateAction<UserProfile>>;
  onNotification: (text: string, icon: string) => void;
}

export const ProfileView: React.FC<ProfileProps> = ({
  profile,
  leaderboard,
  setProfile,
  onNotification,
}) => {
  const [isEditingNickname, setIsEditingNickname] = useState(false);
  const [tempNickname, setTempNickname] = useState(profile.nickname);
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [customAvatars, setCustomAvatars] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('bomb_game_custom_profile_avatars');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('bomb_game_custom_profile_avatars', JSON.stringify(customAvatars));
    } catch (e) {
      console.warn('Failed to save custom profile avatars:', e);
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
        // Safe 1:1 format scale down to 160x160 resolution
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
            const updated = [compressedDataUrl, ...prev].slice(0, 8);
            return updated;
          });
          setProfile(prev => ({
            ...prev,
            avatarId: compressedDataUrl
          }));
          onNotification("个性化头像上传成功！📸", "Check");
        } catch (err) {
          onNotification("图片转换失败，换一张试试吧！", "Info");
        }
      }
    };
    img.onerror = () => {
      onNotification("图片加载失败，换一张试试吧", "Info");
    };
    
    img.src = URL.createObjectURL(file);
  };

  // Find user current rank
  const userRankIdx = leaderboard.findIndex(item => item.id === profile.id);
  const currentRank = userRankIdx !== -1 ? userRankIdx + 1 : '未入榜';

  const handleSaveNickname = () => {
    if (!tempNickname.trim()) {
      onNotification("昵称不能为空哦！", "Info");
      return;
    }
    setProfile(prev => ({
      ...prev,
      nickname: tempNickname.trim()
    }));
    setIsEditingNickname(false);
    onNotification("昵称修改成功！", "Check");
  };

  const handleSelectAvatar = (avatarId: string) => {
    setProfile(prev => ({
      ...prev,
      avatarId
    }));
    setShowAvatarPicker(false);
    onNotification("成功更换新头像！", "Smile");
  };

  const selectedAvatarObj = AVATARS.find(a => a.id === profile.avatarId) || AVATARS[0];

  // Helper calculation for beautiful game ratings
  const formatBestRecord = (val: number, unit: string) => {
    if (val === 9999 || val === 0) return '暂无挑战数据';
    return `${val} ${unit}`;
  };

  return (
    <div className="kid-game-panel p-5 space-y-5 relative" id="profile-dashboard-card">
      {/* 1. Header Profile details */}
      <div className="bg-slate-50/75 rounded-[28px] p-5 border border-slate-100 flex flex-col items-center relative overflow-hidden">
        
        {/* Main interactive big avatar */}
        <div className="relative mt-2" id="interactive-profile-avatar">
          <div 
            onClick={() => setShowAvatarPicker(!showAvatarPicker)}
            className="w-20 h-20 rounded-full cursor-pointer hover:rotate-12 hover:scale-105 active:scale-95 transition-all duration-200"
          >
            <UserAvatar id={profile.avatarId} className="w-20 h-20" textClassName="text-4xl" />
          </div>
          <button 
            onClick={() => setShowAvatarPicker(!showAvatarPicker)}
            className="absolute bottom-0 right-0 bg-[#FF6B6B] hover:bg-[#FF8E9E] border-2 border-white rounded-full p-1.5 text-white active:scale-90 shadow-md transition-all text-xs cursor-pointer z-10"
          >
            <Edit2 size={10} />
          </button>
        </div>

        {/* Kid Nickname editable node */}
        <div className="mt-3.5 flex items-center gap-2">
          {isEditingNickname ? (
            <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-full px-3 py-1 shadow-inner">
              <input
                type="text"
                value={tempNickname}
                onChange={(e) => setTempNickname(e.target.value.slice(0, 12))}
                maxLength={12}
                className="bg-transparent outline-none text-xs font-black text-slate-700 w-32 border-none"
              />
              <button 
                onClick={handleSaveNickname}
                className="bg-emerald-500 text-white rounded-full p-1 hover:bg-emerald-600 transition-all cursor-pointer"
              >
                <Check size={12} />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              <h3 className="font-black text-slate-700 text-base">{profile.nickname}</h3>
              <button 
                onClick={() => {
                  setTempNickname(profile.nickname);
                  setIsEditingNickname(true);
                }}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <Edit2 size={12} />
              </button>
            </div>
          )}
        </div>

        <p className="text-[9px] text-slate-400 font-extrabold tracking-wider uppercase mt-1">专属成长探索档案 ID: #{profile.id}</p>

        {/* 2. Micro overall numerical indexes cards */}
        <div className="grid grid-cols-3 gap-3 w-full mt-4 border-t-2 border-slate-200/50 pt-4 text-center">
          <div>
            <div className="text-xl">🌟</div>
            <p className="text-xs font-black text-amber-600 font-mono mt-0.5">{profile.points}</p>
            <p className="text-[8px] text-slate-400 font-extrabold uppercase leading-none">星星积分</p>
          </div>
          <div className="border-l-2 border-r-2 border-slate-200/50">
            <div className="text-xl">👑</div>
            <p className="text-xs font-black text-indigo-600 font-mono mt-0.5">#{currentRank}</p>
            <p className="text-[8px] text-slate-400 font-extrabold uppercase leading-none">全区积分排行</p>
          </div>
          <div>
            <div className="text-xl">🦖</div>
            <p className="text-xs font-black text-[#10B981] font-mono mt-0.5">{profile.feedHappiness}%</p>
            <p className="text-[8px] text-slate-400 font-extrabold uppercase leading-none">小布好感度</p>
          </div>
        </div>
      </div>

      {/* Change Cartoon dialog selector overlay popup */}
      {showAvatarPicker && (
        <div 
          className="absolute inset-x-4 top-4 bottom-4 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 z-40 rounded-[28px] animate-fade-in"
          onClick={() => setShowAvatarPicker(false)}
        >
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white border border-[#FFE0C2] rounded-[28px] p-4 w-full text-center shadow-[0_18px_42px_rgba(15,23,42,0.16)] space-y-4 max-h-full overflow-y-auto shrink-0"
            id="avatar-scroller-popup"
          >
            <div className="flex items-center justify-between pb-1 border-b border-slate-100">
              <span className="text-xs font-black text-[#D97706] block">🎈 挑选新头像 🎈</span>
              <button 
                type="button"
                onClick={() => setShowAvatarPicker(false)}
                className="text-slate-400 hover:text-slate-600 text-xs font-black cursor-pointer bg-slate-100 rounded-full w-5 h-5 flex items-center justify-center shadow-2xs"
              >
                ✕
              </button>
            </div>

            {/* Custom uploads list */}
            {customAvatars.length > 0 && (
              <div className="bg-orange-50/40 p-2.5 rounded-xl border border-orange-100 text-left">
                <span className="text-[10px] font-black text-orange-600 block mb-2">⭐ 已上传的个人头像：</span>
                <div className="grid grid-cols-4 gap-2">
                  {customAvatars.map((dataUrl, idx) => {
                    const isSelected = profile.avatarId === dataUrl;
                    return (
                      <div key={idx} className="relative group">
                        <button
                          type="button"
                          onClick={() => handleSelectAvatar(dataUrl)}
                          className={`w-full p-2 rounded-xl border transition-all flex flex-col items-center bg-white cursor-pointer ${
                            isSelected 
                              ? 'bg-amber-100 border-amber-400' 
                              : 'border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          <UserAvatar id={dataUrl} className="w-9 h-9" />
                          <span className="text-[7.5px] font-black mt-1 text-slate-500 block truncate max-w-[42px] leading-3 text-center">自定义 {idx + 1}</span>
                        </button>
                        
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setCustomAvatars(prev => prev.filter((_, i) => i !== idx));
                            if (profile.avatarId === dataUrl) {
                              setProfile(prev => ({ ...prev, avatarId: 'avatar_dino' }));
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

            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black text-slate-400 block font-bold">卡通宠物分身 & 拍照上传 ：</span>
            </div>
            
            <div className="grid grid-cols-4 gap-2">
              {/* Upload trigger card */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-2 rounded-xl border-2 border-dashed border-slate-300 bg-white hover:bg-orange-50 hover:border-orange-400 hover:text-orange-700 transition-all cursor-pointer aspect-square flex flex-col items-center justify-center text-orange-800 text-center"
              >
                <Upload size={16} className="text-slate-400 mb-1" />
                <span className="text-[8px] font-black leading-tight">拍照/本地上传</span>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  accept="image/*" 
                  onChange={handleFileUpload} 
                />
              </button>

              {AVATARS.map(item => (
                <button
                  key={item.id}
                  onClick={() => handleSelectAvatar(item.id)}
                  className={`p-2 rounded-xl text-2xl border transition-all flex flex-col items-center cursor-pointer ${
                    profile.avatarId === item.id 
                      ? 'bg-amber-400 border-amber-500 text-white shadow-xs' 
                      : 'bg-white border-slate-200 hover:bg-slate-50'
                  }`}
                  title={item.name}
                >
                  <span className="select-none">{item.char}</span>
                  <span className="text-[7.5px] font-black mt-1 text-slate-500 block truncate max-w-[42px] leading-3">{item.name}</span>
                </button>
              ))}
            </div>
          </motion.div>
        </div>
      )}

      {/* 3. Detailed Growth performance metrics breakdown per game */}
      <div className="space-y-4" id="granular-game-records-cards">
        <h4 className="text-xs font-black text-[#FF6B6B] text-left pl-1 mt-6 flex items-center gap-1">
          <Sparkles size={14} className="text-amber-400 fill-amber-300 animate-spin" /> 各项成长挑战记录汇总
        </h4>

        {/* Game 1: Bomb Games */}
        <div className="kid-game-note p-4 text-left flex justify-between items-center">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl shrink-0">💣</span>
            <div className="leading-tight">
              <p className="text-xs font-black text-slate-700">数字炸弹雷区生存</p>
              <p className="text-[9px] text-slate-400 font-bold mt-1">排雷锻炼反应与勇气 🦁</p>
            </div>
          </div>
          <div className="text-right leading-relaxed">
            <p className="text-xs font-black text-orange-600">
              安全拆卸: {profile.records.bombClears} 次
            </p>
            <p className="text-[9px] text-slate-400 font-black">
              失误爆炸: {profile.records.bombExplodes} 次
            </p>
          </div>
        </div>

        {/* Game 2: Klotski Sliding */}
        <div className="kid-game-note p-4 text-left space-y-3">
          <div className="flex items-center gap-2.5 border-b border-slate-100 pb-2">
            <span className="text-2xl shrink-0">🧩</span>
            <div className="leading-tight">
              <p className="text-xs font-black text-slate-700">数字华容道智育空间</p>
              <p className="text-[9px] text-slate-400 font-bold mt-1">锻炼空间组织逻辑 🧠</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 text-center text-[10px] font-black text-slate-700">
            <div className="bg-emerald-50/50 p-2 rounded-xl border border-emerald-100">
              <span className="text-[9px] text-[#2ebd70] block leading-none mb-1">🦖 3x3 最优记录</span>
              <p className="font-sans font-black text-[10px]">
                {profile.records.klotskiBestMoves3x3 < 9999 ? `${profile.records.klotskiBestMoves3x3} 步` : '未探索'} | {profile.records.klotskiBestTime3x3 < 9999 ? `${profile.records.klotskiBestTime3x3}s` : '待挑战'}
              </p>
            </div>
            <div className="bg-teal-50/50 p-2 rounded-xl border border-teal-100">
              <span className="text-[9px] text-teal-600 block leading-none mb-1">🚀 4x4 最优记录</span>
              <p className="font-sans font-black text-[10px]">
                {profile.records.klotskiBestMoves4x4 < 9999 ? `${profile.records.klotskiBestMoves4x4} 步` : '未探索'} | {profile.records.klotskiBestTime4x4 < 9999 ? `${profile.records.klotskiBestTime4x4}s` : '待挑战'}
              </p>
            </div>
          </div>
        </div>

        {/* Game 3: Schulte Grid */}
        <div className="kid-game-note p-4 text-left space-y-3">
          <div className="flex items-center gap-2.5 border-b border-slate-100 pb-2">
            <span className="text-2xl shrink-0">👀</span>
            <div className="leading-tight">
              <p className="text-xs font-black text-slate-700">舒尔特视觉专注测试</p>
              <p className="text-[9px] text-slate-400 font-bold mt-1">追击数字锻炼注意力 ✨</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 text-center text-[10px] font-black text-slate-700">
            <div className="bg-amber-50/50 p-2 rounded-xl border border-amber-100">
              <span className="text-[9px] text-amber-500 block leading-none mb-1">3x3 极速专注</span>
              <p className="font-mono text-xs text-amber-600 font-black">
                {profile.records.schulteBest3x3 < 9999 ? `${profile.records.schulteBest3x3.toFixed(1)} 秒` : '待挑战'}
              </p>
            </div>
            <div className="bg-orange-50/50 p-2 rounded-xl border border-orange-100">
              <span className="text-[9px] text-orange-500 block leading-none mb-1">4x4 高度敏捷</span>
              <p className="font-mono text-xs text-orange-600 font-black">
                {profile.records.schulteBest4x4 < 9999 ? `${profile.records.schulteBest4x4.toFixed(1)} 秒` : '待挑战'}
              </p>
            </div>
          </div>
        </div>

        {/* Game 4: Gomoku Grid */}
        <div className="kid-game-note p-4 text-left">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="text-2xl shrink-0">🍒</span>
              <div className="leading-tight">
                <p className="text-xs font-black text-slate-700">甜心五子棋对垒</p>
                <p className="text-[9px] text-slate-400 font-bold mt-1">连通水果激发大局洞察 🍉</p>
              </div>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-1 justify-end">
                <span className="bg-emerald-50 text-emerald-700 py-0.5 px-2 rounded-md font-black text-[9px]">胜 {profile.records.gomokuWins}</span>
                <span className="bg-rose-50 text-[#F43F5E] py-0.5 px-2 rounded-md font-black text-[9px]">负 {profile.records.gomokuLosses}</span>
                <span className="bg-slate-100 text-slate-600 py-0.5 px-2 rounded-md font-black text-[9px]">平 {profile.records.gomokuDraws}</span>
              </div>
              <p className="text-[8px] text-slate-400 font-extrabold mt-1.5 uppercase leading-none">胜率: {
                (profile.records.gomokuWins + profile.records.gomokuLosses) > 0 
                  ? `${Math.round((profile.records.gomokuWins / (profile.records.gomokuWins + profile.records.gomokuLosses)) * 100)}%`
                  : '开启首场甜心脑力局吧！'
              }</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
