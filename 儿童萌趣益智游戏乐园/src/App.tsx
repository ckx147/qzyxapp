/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Home, 
  Gamepad2, 
  Trophy, 
  User, 
  Sparkles, 
  Wifi, 
  Battery, 
  Tv, 
  X, 
  CheckCircle, 
  Compass, 
  Award,
  Zap,
  Info,
  ChevronRight
} from 'lucide-react';
import { UserProfile, Achievement, CheckInState, LeaderboardItem } from './types';
import { 
  getGameState, 
  saveGameState, 
  checkAchievements, 
  AVATARS, 
  DAILY_REWARDS 
} from './utils/gameHelpers';
import { getAchievementTierConfig } from './utils/tierConfig';
import { soundSynth } from './utils/audio';

// Subcomponents
import { CompanionInteractions } from './components/CompanionInteractions';
import { DailyCheckIn } from './components/DailyCheckIn';
import { BombGame } from './components/BombGame';
import { KlotskiGame } from './components/KlotskiGame';
import { SchulteGame } from './components/SchulteGame';
import { GomokuGame } from './components/GomokuGame';
import { ProfileView } from './components/ProfileView';
import { AchievementsView } from './components/AchievementsView';
import { UserAvatar } from './components/UserAvatar';

export default function App() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [checkIn, setCheckIn] = useState<CheckInState | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardItem[]>([]);
  
  // Navigation tabs
  const [activeTab, setActiveTab] = useState<'home' | 'games' | 'leaderboard' | 'profile'>('home');
  const [activeGame, setActiveGame] = useState<'bomb' | 'klotski' | 'schulte' | 'gomoku' | null>(null);

  // Global notifications state
  const [notification, setNotification] = useState<{ text: string; icon: string; id: number } | null>(null);
  const [unlockedAchievementAlert, setUnlockedAchievementAlert] = useState<Achievement | null>(null);
  const [muted, setMuted] = useState(soundSynth.getMuteState());
  const hasCompletedInitialAchievementCheck = useRef(false);

  // Initialize Game state
  useEffect(() => {
    const state = getGameState();
    setProfile(state.profile);
    setAchievements(state.achievements);
    setCheckIn(state.checkIn);
    setLeaderboard(state.leaderboard);
  }, []);

  // Web Audio API BGM auto-activation upon user's first raw interaction (browser gesture bypass)
  useEffect(() => {
    const startBgmOnGesture = () => {
      soundSynth.startBgm();
      window.removeEventListener('click', startBgmOnGesture);
      window.removeEventListener('touchstart', startBgmOnGesture);
    };
    window.addEventListener('click', startBgmOnGesture);
    window.addEventListener('touchstart', startBgmOnGesture);
    return () => {
      window.removeEventListener('click', startBgmOnGesture);
      window.removeEventListener('touchstart', startBgmOnGesture);
    };
  }, []);

  // Save state on any profile or achievement write
  useEffect(() => {
    if (profile && checkIn) {
      saveGameState(profile, achievements, checkIn, leaderboard);
    }
  }, [profile, achievements, checkIn, leaderboard]);

  // Constantly check if any achievement is unlocked upon stats progress
  useEffect(() => {
    if (!profile || achievements.length === 0 || !checkIn) return;

    if (!hasCompletedInitialAchievementCheck.current) {
      hasCompletedInitialAchievementCheck.current = true;
      return;
    }

    const { updatedAchievements, newlyUnlocked } = checkAchievements(profile, achievements, checkIn);
    
    if (newlyUnlocked.length > 0) {
      setAchievements(updatedAchievements);
      // Popup first newly unlocked badge
      setUnlockedAchievementAlert(newlyUnlocked[0]);
      soundSynth.playWin();
      
      // Fire visual reward notification
      const tierLvl = newlyUnlocked[0].tier || 1;
      const tierConf = getAchievementTierConfig(newlyUnlocked[0].id, tierLvl);
      triggerNotification(`恭喜达成 ${tierConf.badgeEmoji} 【${newlyUnlocked[0].title}】${tierConf.tierName} 目标！可前往勋章墙领取晋级好礼！🎁`, 'Award');
    }
  }, [profile?.records, profile?.feedHappiness, checkIn?.streak, checkIn?.unlockedItems?.length]);

  const triggerNotification = (text: string, icon: string) => {
    setNotification({ text, icon, id: Date.now() });
  };

  const scrollToElement = (elementId: string) => {
    window.setTimeout(() => {
      const target = document.getElementById(elementId);
      if (!target) return;

      const mainScroller = document.getElementById('mobile-main-canvas-content');
      if (mainScroller && mainScroller.scrollHeight > mainScroller.clientHeight) {
        const parentRect = mainScroller.getBoundingClientRect();
        const targetRect = target.getBoundingClientRect();
        const nextTop = Math.max(0, mainScroller.scrollTop + targetRect.top - parentRect.top - 12);
        mainScroller.scrollTop = nextTop;
        mainScroller.scrollTo({
          top: nextTop,
          behavior: 'smooth',
        });
        return;
      }

      let scrollParent = target.parentElement;
      while (scrollParent && scrollParent !== document.body) {
        const style = window.getComputedStyle(scrollParent);
        const canScroll = /(auto|scroll)/.test(`${style.overflowY} ${style.overflow}`);
        if (canScroll && scrollParent.scrollHeight > scrollParent.clientHeight) {
          const parentRect = scrollParent.getBoundingClientRect();
          const targetRect = target.getBoundingClientRect();
          scrollParent.scrollTo({
            top: Math.max(0, scrollParent.scrollTop + targetRect.top - parentRect.top - 12),
            behavior: 'smooth',
          });
          return;
        }
        scrollParent = scrollParent.parentElement;
      }

      target.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    }, 80);
  };

  const openBackpackShortcut = () => {
    soundSynth.playClick();
    setActiveTab('home');
    setActiveGame(null);
    scrollToElement('inventory-or-shop-container');
  };

  const openTodayRouteShortcut = () => {
    soundSynth.playClick();
    setActiveTab('games');
    setActiveGame(null);
  };

  const openGrowthStampShortcut = () => {
    soundSynth.playClick();
    setActiveTab('profile');
    setActiveGame(null);
  };

  // Clear toast timeout
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        setNotification(null);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  // Points handler
  const handlePointsChange = (amount: number, reason: string) => {
    if (!profile) return;
    if (amount > 0) {
      soundSynth.playScore();
    } else if (amount < 0) {
      soundSynth.playWarning();
    }
    setProfile(prev => {
      if (!prev) return prev;
      const newPoints = Math.max(0, prev.points + amount);
      triggerNotification(`${amount > 0 ? '🎉 +' : '🩹 '}${amount} 星星积分 (${reason})`, 'Sparkles');
      return {
        ...prev,
        points: newPoints
      };
    });
  };

  // Claim achievement rewards and advance tiers
  const handleClaimAchievementReward = (achId: string) => {
    if (!profile) return;
    
    const targetAchIndex = achievements.findIndex(ach => ach.id === achId);
    if (targetAchIndex === -1) return;
    const ach = achievements[targetAchIndex];
    
    // Can only claim if unlocked and not claimed yet
    if (!ach.unlocked || ach.rewardsClaimed) return;
    
    const currentTier = ach.tier || 1;
    const config = getAchievementTierConfig(achId, currentTier);
    
    // 1. Grant points
    const bonusPoints = config.pointsReward;
    
    // 2. Grant food snacks to inventory
    const food = config.foodReward;
    
    setProfile(prev => {
      if (!prev) return prev;
      const nextInv = { ...prev.inventory };
      nextInv[food.name] = (nextInv[food.name] || 0) + food.count;
      return {
        ...prev,
        points: prev.points + bonusPoints,
        inventory: nextInv
      };
    });
    
    // 3. Reset unlocked to false & increment tier level unless max level is reached
    const isMaxTier = currentTier === 7;
    const nextTier = Math.min(7, currentTier + 1);
    const nextConfig = getAchievementTierConfig(achId, nextTier);
    
    const updatedAchievements = achievements.map((a, idx) => {
      if (idx === targetAchIndex) {
        return {
          ...a,
          tier: isMaxTier ? currentTier : nextTier,
          unlocked: isMaxTier ? true : false,
          rewardsClaimed: isMaxTier ? true : false,
          targetValue: isMaxTier ? a.targetValue : nextConfig.targetValue,
          unlockedAt: isMaxTier ? a.unlockedAt : undefined
        };
      }
      return a;
    });
    
    setAchievements(updatedAchievements);
    
    triggerNotification(`🏅 已领取${config.tierName}【${ach.title}】进阶宝盒：获得星星×${bonusPoints}！恐龙零食袋中塞入了 ${food.char} ${food.name}×${food.count}！🍬🍡`, 'Award');
  };

  if (!profile || !checkIn) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center text-slate-500 font-sans">
        <div className="w-10 h-10 border-4 border-amber-400 border-t-transparent rounded-full animate-spin mb-2" />
        <p className="font-extrabold text-sm">正在加载儿童萌趣乐园...</p>
      </div>
    );
  }

  // Active avatar object
  const activeAvatarObj = AVATARS.find(a => a.id === profile.avatarId) || AVATARS[0];

  return (
    <div className="min-h-screen bg-magical-playground py-4 sm:py-8 px-2 flex flex-col items-center justify-center font-sans antialiased text-slate-800">
      
      {/* Desktop context panels */}
      <div className="hidden lg:block fixed left-10 top-10 text-center max-w-xs text-[#5C3E00] font-medium bg-white/92 p-6 rounded-3xl shadow-[0_18px_45px_rgba(146,64,14,0.12)] border border-[#FFE0C2]">
        <h1 className="text-xl font-black text-[#FF6B6B] mb-2">好奇小熊 🐻</h1>
        <p className="text-xs leading-relaxed text-[#5F5142] font-semibold">
          给孩子的益智练习馆：拆数字谜题、练专注追踪、玩策略对弈，把每次尝试变成清楚的成长反馈。
        </p>
      </div>

      <div className="hidden lg:block fixed right-10 bottom-10 bg-white/92 p-6 rounded-3xl shadow-[0_18px_45px_rgba(146,64,14,0.12)] max-w-xs border border-emerald-100">
        <h5 className="font-black text-[#FF9F1C] text-sm flex items-center gap-1.5 mb-2">
          <Sparkles className="text-amber-500 fill-amber-200" size={16} /> 积分魔法盒：
        </h5>
        <p className="text-xs text-[#4B5D48] leading-relaxed font-semibold">
          打卡、游戏和成就都会进入同一套积分反馈。家长能看懂进度，孩子也能知道下一步该做什么。
        </p>
      </div>

      {/* 4. Elegant Kid-Tablet Simulator Frame */}
      <div 
        className="relative w-full max-w-[430px] h-[860px] max-h-screen sm:max-h-[860px] storybook-page rounded-none sm:rounded-[54px] shadow-[0_24px_70px_rgba(253,186,116,0.22)] border-0 sm:border-[14px] border-[#FFE5CC] flex flex-col overflow-hidden pb-safe transition-all duration-300 hover:shadow-[0_24px_85px_rgba(253,186,116,0.30)]"
        id="kids-applet-mobile-canvas-frame"
      >
        {/* Simulated top notch & device status bar */}
        <div className="bg-[#FFE5CC] h-7 px-6 flex items-center justify-between text-[11px] font-black select-none shrink-0 rounded-b-none relative">
          <span className="font-sans text-[#92400E]">12:08 🍟</span>
          {/* Simulated speaker island notch */}
          <div className="h-3 w-20 bg-white/40 absolute top-0 left-1/2 -translate-x-1/2 rounded-b-lg flex items-center justify-center">
            <div className="w-6 h-0.5 bg-white/60 rounded-full" />
          </div>
          <div className="flex items-center gap-1 text-[10px] text-[#92400E]">
            <span className="bg-[#10B981] text-white font-extrabold px-1.5 py-0.5 rounded-full text-[8px] scale-90 leading-none">在线</span>
            <Wifi size={11} className="text-[#92400E]" />
            <Battery size={13} className="text-[#92400E]" />
          </div>
        </div>

        {/* Mobile Header Banner - Immersive Cute UI Style */}
        <div className="bg-white/95 backdrop-blur-md px-4 py-3 text-slate-800 flex items-center justify-between border-b border-[#FFE0C2]/80 shadow-3xs select-none shrink-0" id="mobile-home-header">
          {activeGame ? (
            <button 
              onClick={() => {
                soundSynth.playClick();
                setActiveGame(null);
              }}
              className="bg-[#FFF1F2] hover:bg-[#FFE4E6] active:translate-y-0.5 border border-[#FFD1DC] text-[#FF6B6B] transition-all rounded-xl px-3 py-1.5 text-xs font-black shadow-3xs flex items-center gap-1 cursor-pointer"
              id="back-to-hub-button"
            >
              <span>🏠</span> 返回
            </button>
          ) : (
            <div 
              className="flex items-center gap-2 bg-[#FFF9F2] p-1.5 pr-3 rounded-full shadow-sm border border-[#FFE0C2] cursor-pointer hover:bg-white transition-all active:scale-95" 
              onClick={() => {
                soundSynth.playClick();
                setActiveTab('profile');
              }}
            >
              <UserAvatar id={profile.avatarId} className="w-8 h-8" textClassName="text-base" />
              <div className="text-left leading-none">
                <span className="text-[9px] text-[#FF9F1C] font-black block">小勇士</span>
                <span className="text-xs font-bold text-slate-700 truncate max-w-[80px] block mt-0.5">{profile.nickname}</span>
              </div>
            </div>
          )}

          {/* Large dynamic Title logo */}
          <div className="text-center flex-1 mx-2">
            <h2 className="font-extrabold text-sm text-[#FF6B6B] tracking-tight leading-none">
              {activeGame === 'bomb' ? '💣 数字炸弹' :
               activeGame === 'klotski' ? '🧩 数字华容道' :
               activeGame === 'schulte' ? '⚡ 舒尔特训练' :
               activeGame === 'gomoku' ? '🍇 甜心五子棋' :
               '好奇小熊'}
            </h2>
            {!activeGame && <span className="text-[8px] text-slate-400 font-bold block mt-1">Lv.8 益智馆</span>}
          </div>

          {/* User Score coin label and Sound toggle */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => {
                const nextMute = soundSynth.toggleMute();
                setMuted(nextMute);
                if (!nextMute) {
                  soundSynth.playSuccess();
                } else {
                  // Subtle tap response
                }
              }}
              className="bg-white hover:bg-slate-50 border border-slate-200 w-7 h-7 rounded-full flex items-center justify-center text-xs shadow-3xs cursor-pointer active:scale-90 transition-all font-sans"
              title={muted ? "开启声音" : "关闭声音"}
              id="sound-mute-toggle-btn"
            >
              {muted ? "🔇" : "🔊"}
            </button>
            <div className="bg-white px-2.5 py-1.5 rounded-full shadow-sm border border-slate-200 flex items-center gap-1 text-xs">
              <span className="text-sm select-none">✨</span>
              <span className="font-black text-[#FF9F1C] tracking-tighter text-sm font-sans">{profile.points}</span>
            </div>
          </div>
        </div>

        {/* Dynamic active screens rendering based on context */}
        <div className="flex-1 overflow-y-auto storybook-page p-4 relative" id="mobile-main-canvas-content">
          
          {/* TOAST Notifications alerts */}
          <AnimatePresence>
            {notification && (
              <motion.div
                initial={{ opacity: 0, y: -12, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.98 }}
                className="sticky top-2 z-40 mb-3 bg-[#3D2C7A] text-white text-xs font-bold p-3 rounded-2xl shadow-lg flex items-center justify-between border border-violet-300/50"
                id="toast-notification-banner"
              >
                <div className="flex items-center gap-2">
                  <span className="text-xl">🌟</span>
                  <p className="text-left font-extrabold leading-snug">{notification.text}</p>
                </div>
                <button onClick={() => setNotification(null)} className="text-slate-300 hover:text-white shrink-0 ml-1.5">
                  <X size={14} />
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* MAIN ACTIVE VIEW ROUTER */}
          {activeGame ? (
            <div className="space-y-4" id="child-active-game-box">
              {activeGame === 'bomb' && (
                <BombGame 
                  profile={profile} 
                  achievements={achievements} 
                  setProfile={setProfile}
                  setAchievements={setAchievements}
                  onPointsChange={handlePointsChange}
                  onNotification={triggerNotification}
                />
              )}
              {activeGame === 'klotski' && (
                <KlotskiGame 
                  profile={profile} 
                  achievements={achievements} 
                  setProfile={setProfile}
                  setAchievements={setAchievements}
                  onPointsChange={handlePointsChange}
                  onNotification={triggerNotification}
                />
              )}
              {activeGame === 'schulte' && (
                <SchulteGame 
                  profile={profile} 
                  achievements={achievements} 
                  setProfile={setProfile}
                  setAchievements={setAchievements}
                  onPointsChange={handlePointsChange}
                  onNotification={triggerNotification}
                />
              )}
              {activeGame === 'gomoku' && (
                <GomokuGame 
                  profile={profile} 
                  achievements={achievements} 
                  setProfile={setProfile}
                  setAchievements={setAchievements}
                  onPointsChange={handlePointsChange}
                  onNotification={triggerNotification}
                />
              )}
            </div>
          ) : (
            <div className="space-y-4">
              
              {/* Tab 1: Home Lobby (Mascot & Sign-in card) */}
              {activeTab === 'home' && (
                <div className="space-y-4" id="lobby-view-tab">
                  {/* Banner greeting card */}
                  <div className="storybook-hero p-4 relative overflow-hidden text-left">
                    <div className="storybook-sky h-36 p-4 relative overflow-hidden mb-3">
                      <div className="absolute left-4 bottom-4 w-24 h-10 bg-[#7BCF8E] rounded-t-full opacity-90" />
                      <div className="absolute left-24 bottom-3 w-32 h-12 bg-[#A5D96A] rounded-t-full opacity-85" />
                      <div className="absolute right-4 bottom-5 w-14 h-16 bg-[#FF9F1C] rounded-[22px] rotate-3 shadow-[0_8px_18px_rgba(217,119,6,0.16)] flex items-center justify-center text-3xl">
                        📖
                      </div>
                      <div className="absolute left-6 top-5 storybook-stamp px-3 py-1.5 text-[10px] font-black text-[#D97706]">
                        今日绘本第 8 章
                      </div>
                      <div className="absolute left-7 bottom-8 text-5xl animate-soft-pop">🦖</div>
                      <div className="absolute right-20 top-7 text-3xl">⭐</div>
                    </div>
                    <h3 className="font-black text-[#5C3E00] text-base mb-1">欢迎回到小布的奇思森林</h3>
                    <p className="text-[10.5px] text-[#6B5338] leading-relaxed font-bold">
                      今天的故事地图已经展开：先照顾小布，再进入数字山谷、观察星桥和五子棋花园。
                    </p>
                    <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                      <button
                        type="button"
                        id="shortcut-backpack"
                        onClick={openBackpackShortcut}
                        aria-label="查看背包补给"
                        className="storybook-stamp py-2 transition-all duration-150 active:translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF9F1C]/50 cursor-pointer"
                      >
                        <span className="block text-lg">🎒</span>
                        <span className="text-[8.5px] font-black text-[#8A6A3A]">背包补给</span>
                      </button>
                      <button
                        type="button"
                        id="shortcut-route"
                        onClick={openTodayRouteShortcut}
                        aria-label="查看今日路线"
                        className="storybook-stamp py-2 transition-all duration-150 active:translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF9F1C]/50 cursor-pointer"
                      >
                        <span className="block text-lg">🧭</span>
                        <span className="text-[8.5px] font-black text-[#8A6A3A]">今日路线</span>
                      </button>
                      <button
                        type="button"
                        id="shortcut-stamps"
                        onClick={openGrowthStampShortcut}
                        aria-label="查看成长印章"
                        className="storybook-stamp py-2 transition-all duration-150 active:translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF9F1C]/50 cursor-pointer"
                      >
                        <span className="block text-lg">🏅</span>
                        <span className="text-[8.5px] font-black text-[#8A6A3A]">成长印章</span>
                      </button>
                    </div>
                  </div>

                  {/* Character Interaction Module */}
                  <CompanionInteractions 
                    profile={profile} 
                    achievements={achievements}
                    setProfile={setProfile}
                    setAchievements={setAchievements}
                    onPointsChange={handlePointsChange}
                    onNotification={triggerNotification}
                  />

                  {/* Daily Sign In Component */}
                  <DailyCheckIn 
                    profile={profile}
                    checkIn={checkIn}
                    achievements={achievements}
                    setProfile={setProfile}
                    setCheckIn={setCheckIn}
                    setAchievements={setAchievements}
                    onPointsChange={handlePointsChange}
                    onNotification={triggerNotification}
                  />
                </div>
              )}

              {/* Tab 2: Games Hub Selection */}
              {activeTab === 'games' && (
                <div className="space-y-5 text-left" id="games-selection-tab">
                  <div className="storybook-hero p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl animate-soft-pop">🗺️</span>
                      <div>
                        <p className="text-xs font-black text-[#5C3E00]">选择今天的绘本章节</p>
                        <p className="text-[10px] text-[#8A6A3A] font-bold mt-0.5">每一章都是一个脑力场景，完成后收集星星和成长印章。</p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-3" id="hub-games-grid-layout">
                    {/* Game Item 1: Number Bomb (Pink Theme #FF8E9E) */}
                    <div 
                      onClick={() => setActiveGame('bomb')}
                      className="storybook-chapter-card p-4 transition-all hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
                      id="launch-bomb-game-card"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-14 h-14 bg-[#FFF1F2] border-2 border-[#FFE4E6] rounded-2xl flex items-center justify-center text-3xl shadow-inner shrink-0">
                          💣
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <h4 className="font-black text-sm text-[#5C3E00]">第一章：数字山谷的安全钟</h4>
                            <ChevronRight size={14} className="text-[#FF8E9E] shrink-0" />
                          </div>
                          <p className="text-[10px] text-[#6B5338] mt-1.5 leading-relaxed font-semibold">
                            小布在山谷里听见倒计时，和家人轮流排除秘密数字。
                          </p>
                          <div className="mt-3 flex items-center gap-2">
                            <span className="text-[9px] bg-[#FFF1F2] text-[#F43F5E] font-black px-2.5 py-1 rounded-full border border-[#FFE4E6]">+10~50 ⭐</span>
                            <span className="storybook-trail h-0.5 flex-1" />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Game Item 2: Klotski Slider (Blue Theme #7AD4FF) */}
                    <div 
                      onClick={() => setActiveGame('klotski')}
                      className="storybook-chapter-card p-4 transition-all hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
                      id="launch-klotski-game-card"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-14 h-14 bg-[#F0F9FF] border-2 border-[#E0F2FE] rounded-2xl flex items-center justify-center text-3xl shadow-inner shrink-0">
                          🧩
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <h4 className="font-black text-sm text-[#5C3E00]">第二章：木块城堡的归位路</h4>
                            <ChevronRight size={14} className="text-[#0284C7] shrink-0" />
                          </div>
                          <p className="text-[10px] text-[#6B5338] mt-1.5 leading-relaxed font-semibold">
                            推动木块穿过城堡小路，把混乱数字送回它们的房间。
                          </p>
                          <div className="mt-3 flex items-center gap-2">
                            <span className="text-[9px] bg-[#F0F9FF] text-[#0284C7] font-black px-2.5 py-1 rounded-full border border-[#E0F2FE]">+80~150 ⭐</span>
                            <span className="storybook-trail h-0.5 flex-1" />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Game Item 3: Schulte Table (Purple Theme #A78BFF) */}
                    <div 
                      onClick={() => setActiveGame('schulte')}
                      className="storybook-chapter-card p-4 transition-all hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
                      id="launch-schulte-game-card"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-14 h-14 bg-[#F5F3FF] border-2 border-[#EDE9FE] rounded-2xl flex items-center justify-center text-3xl shadow-inner shrink-0">
                          ⚡
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <h4 className="font-black text-sm text-[#5C3E00]">第三章：星桥观察员</h4>
                            <ChevronRight size={14} className="text-[#6D28D9] shrink-0" />
                          </div>
                          <p className="text-[10px] text-[#6B5338] mt-1.5 leading-relaxed font-semibold">
                            沿着闪闪发光的星桥找数字，训练眼睛和注意力。
                          </p>
                          <div className="mt-3 flex items-center gap-2">
                            <span className="text-[9px] bg-[#F5F3FF] text-[#6D28D9] font-black px-2.5 py-1 rounded-full border border-[#EDE9FE]">+60~120 ⭐</span>
                            <span className="storybook-trail h-0.5 flex-1" />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Game Item 4: Gomoku Cherry (Green Theme #4ADE80) */}
                    <div 
                      onClick={() => setActiveGame('gomoku')}
                      className="storybook-chapter-card p-4 transition-all hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
                      id="launch-gomoku-game-card"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-14 h-14 bg-[#F0FDF4] border-2 border-[#DCFCE7] rounded-2xl flex items-center justify-center text-3xl shadow-inner shrink-0">
                          🍒
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <h4 className="font-black text-sm text-[#5C3E00]">第四章：果园棋盘的五连花</h4>
                            <ChevronRight size={14} className="text-[#15803D] shrink-0" />
                          </div>
                          <p className="text-[10px] text-[#6B5338] mt-1.5 leading-relaxed font-semibold">
                            在果园棋盘上排出五颗果实，和小布练习策略观察。
                          </p>
                          <div className="mt-3 flex items-center gap-2">
                            <span className="text-[9px] bg-[#F0FDF4] text-[#15803D] font-black px-2.5 py-1 rounded-full border border-[#DCFCE7]">+100 ⭐</span>
                            <span className="storybook-trail h-0.5 flex-1" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 3: Leaderboard panel */}
              {activeTab === 'leaderboard' && (
                <div className="space-y-4 text-left animate-fade-in" id="leaderboard-view-tab">
                  {/* Header box */}
                  <div className="bg-[#FFF9F2] rounded-3xl p-4 border border-[#FFE0C2] flex items-center justify-between shadow-sm relative overflow-hidden">
                    <span className="absolute right-[-10px] bottom-[-15px] text-6xl opacity-15">🏆</span>
                    <div>
                      <h3 className="font-black text-sm text-[#5C3E00] mb-0.5">全区大脑星星王座榜</h3>
                      <p className="text-[10px] text-[#8A6A3A] font-bold leading-relaxed">
                        跟身边其他可爱的小探险家一起比拼脑力星星，努力解锁更高的大布喂食等级吧！
                      </p>
                    </div>
                  </div>

                  {/* Leader List Card */}
                  <div className="bg-white rounded-3xl border border-sky-100 p-4 space-y-2.5 shadow-[0_14px_34px_rgba(2,132,199,0.08)]">
                    {leaderboard.map((item, idx) => {
                      const rank = idx + 1;
                      const avatarDetail = AVATARS.find(a => a.id === item.avatarId) || AVATARS[0];
                      const isMe = item.id === profile.id;

                      return (
                        <div 
                          key={item.id}
                          className={`flex items-center justify-between p-3 rounded-2xl transition-all border ${
                            isMe 
                              ? 'bg-[#FFF9F2] border-amber-300 text-[#5C3E00] shadow-sm scale-102'
                              : 'bg-slate-50 border-slate-200'
                          }`}
                          id={`leaderboard-row-${rank}`}
                        >
                          <div className="flex items-center gap-3">
                            {/* Rank Badge */}
                            <span className="w-6 text-center font-black font-sans text-xs">
                              {rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : rank}
                            </span>

                            {/* Avatar */}
                            <UserAvatar id={item.avatarId} className="w-9 h-9" textClassName="text-xl" />

                            {/* Nickname */}
                            <div className="text-left">
                              <h4 className="text-xs font-black text-slate-700 flex items-center gap-1.5 leading-tight">
                                {item.nickname}
                                {isMe && (
                                  <span className="bg-rose-500 text-white font-black text-[7px] px-1.5 py-0.5 rounded-full inline-block leading-none uppercase">
                                    我 / 本尊
                                  </span>
                                )}
                              </h4>
                              <p className="text-[8px] text-slate-400 font-bold">小小探险家</p>
                            </div>
                          </div>

                          {/* Points sum label */}
                          <div className="bg-white py-1 px-3 rounded-full border border-slate-200 text-xs font-black text-slate-600 font-mono shadow-3xs">
                            ⭐ {item.points}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Tab 4: Profile View and Achievements */}
              {activeTab === 'profile' && (
                <div className="space-y-4" id="profile-detailed-tab">
                  {/* Detailed profile and play metrics summary */}
                  <ProfileView 
                    profile={profile} 
                    leaderboard={leaderboard} 
                    setProfile={setProfile} 
                    onNotification={triggerNotification}
                  />

                  {/* Badges system overview list */}
                  <AchievementsView 
                    achievements={achievements} 
                    onClaimReward={handleClaimAchievementReward}
                  />
                </div>
              )}

            </div>
          )}
        </div>

        {/* Global Bottom Navigation Tab Bar */}
        <div className="bg-white/95 backdrop-blur-md border-t border-[#FFE0C2]/80 py-2.5 flex justify-around select-none shrink-0 shadow-[0_-5px_20px_rgba(253,186,116,0.06)]" id="mobile-navigation-footer">
          <button 
            onClick={() => {
              soundSynth.playClick();
              setActiveTab('home');
              setActiveGame(null);
            }}
            className={`flex flex-col items-center justify-center py-1 px-4 transition-all duration-200 relative ${
              activeTab === 'home' && !activeGame ? 'text-[#FF6B6B] scale-105 font-extrabold' : 'text-slate-400 hover:text-slate-600 font-medium'
            }`}
            id="tab-btn-home"
          >
            <Home size={20} className={activeTab === 'home' && !activeGame ? 'text-[#FF6B6B] fill-[#FFE4E6]' : ''} />
            <span className="text-[10px] uppercase tracking-wider mt-1">快乐岛</span>
            {activeTab === 'home' && !activeGame && (
              <span className="absolute bottom-[-10px] w-6 h-1 bg-[#FF6B6B] rounded-full" />
            )}
          </button>

          <button 
            onClick={() => {
              soundSynth.playClick();
              setActiveTab('games');
              setActiveGame(null);
            }}
            className={`flex flex-col items-center justify-center py-1 px-4 transition-all duration-200 relative ${
              activeTab === 'games' || activeGame ? 'text-[#FF6B6B] scale-105 font-extrabold' : 'text-slate-400 hover:text-slate-600 font-medium'
            }`}
            id="tab-btn-games"
          >
            <Gamepad2 size={20} className={activeTab === 'games' || activeGame ? 'text-[#FF6B6B] fill-[#FFE4E6]' : ''} />
            <span className="text-[10px] uppercase tracking-wider mt-1">游戏堡</span>
            {(activeTab === 'games' || activeGame) && (
              <span className="absolute bottom-[-10px] w-6 h-1 bg-[#FF6B6B] rounded-full" />
            )}
          </button>

          <button 
            onClick={() => {
              soundSynth.playClick();
              setActiveTab('leaderboard');
              setActiveGame(null);
            }}
            className={`flex flex-col items-center justify-center py-1 px-4 transition-all duration-200 relative ${
              activeTab === 'leaderboard' && !activeGame ? 'text-[#FF6B6B] scale-105 font-extrabold' : 'text-slate-400 hover:text-slate-600 font-medium'
            }`}
            id="tab-btn-leaderboard"
          >
            <Trophy size={20} className={activeTab === 'leaderboard' && !activeGame ? 'text-[#FF6B6B] fill-[#FFE4E6] animate-pulse' : ''} />
            <span className="text-[10px] uppercase tracking-wider mt-1">英雄碑</span>
            {activeTab === 'leaderboard' && !activeGame && (
              <span className="absolute bottom-[-10px] w-6 h-1 bg-[#FF6B6B] rounded-full" />
            )}
          </button>

          <button 
            onClick={() => {
              soundSynth.playClick();
              setActiveTab('profile');
              setActiveGame(null);
            }}
            className={`flex flex-col items-center justify-center py-1 px-4 transition-all duration-200 relative ${
              activeTab === 'profile' && !activeGame ? 'text-[#FF6B6B] scale-105 font-extrabold' : 'text-slate-400 hover:text-slate-600 font-medium'
            }`}
            id="tab-btn-profile"
          >
            <User size={20} className={activeTab === 'profile' && !activeGame ? 'text-[#FF6B6B] fill-[#FFE4E6]' : ''} />
            <span className="text-[10px] uppercase tracking-wider mt-1">荣誉墙</span>
            {activeTab === 'profile' && !activeGame && (
              <span className="absolute bottom-[-10px] w-6 h-1 bg-[#FF6B6B] rounded-full" />
            )}
          </button>
        </div>
      </div>

      {/* Achievement Unlocked Big Popover Modal Overlay */}
      <AnimatePresence>
        {unlockedAchievementAlert && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/75 backdrop-blur-md flex items-center justify-center p-4 z-50 pointer-events-auto"
            id="achievement-alert-root"
          >
            <motion.div
              initial={{ scale: 0.7, y: 100 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.7, y: 100 }}
              className="bg-white border-6 border-amber-400 rounded-[36px] p-6 max-w-sm w-full text-center relative shadow-ex"
            >
              {/* Confetti drops elements */}
              <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-[30px]">
                {Array.from({ length: 12 }).map((_, idx) => (
                      <span
                    key={idx}
                    className="absolute text-xl select-none animate-soft-pop"
                    style={{
                      left: `${Math.random() * 80 + 10}%`,
                      top: `${Math.random() * 50 + 10}%`,
                      animationDelay: `${idx * 0.2}s`
                    }}
                  >
                    {['✨','🍬','🎉','👑','⭐'][idx % 5]}
                  </span>
                ))}
              </div>

              <div className="w-20 h-20 bg-gradient-to-tr from-amber-400 to-yellow-500 rounded-full flex items-center justify-center text-4xl border-4 border-white shadow-lg mx-auto mb-4 animate-soft-pop">
                {(() => {
                  const tL = unlockedAchievementAlert.tier || 1;
                  const tC = getAchievementTierConfig(unlockedAchievementAlert.id, tL);
                  return tC.badgeEmoji;
                })()}
              </div>

              <h3 className="text-xl font-black text-slate-800">达成阶段性荣誉！</h3>
              <p className="text-xs font-bold text-amber-500 uppercase tracking-wider mb-2">你真的越来越聪明啦！</p>

              {(() => {
                const tL = unlockedAchievementAlert.tier || 1;
                const tC = getAchievementTierConfig(unlockedAchievementAlert.id, tL);
                return (
                  <>
                    <div className="bg-amber-50/70 border-2 border-amber-200/50 rounded-2xl p-4 my-3">
                      <span className="inline-block bg-amber-400 text-white font-extrabold text-[10px] px-3 py-1 rounded-full mb-1">
                        【{tC.tierName}】荣誉达成
                      </span>
                      <p className="font-extrabold text-[#9c5900] text-sm mt-1">{unlockedAchievementAlert.title}</p>
                      <p className="text-[10px] text-slate-500 font-semibold mt-1 leading-relaxed">
                        功名进阶成功！累计获得了智慧承认，继续积累刷新记录，就能一直升到【王者级】顶峰哦！💥
                      </p>
                    </div>

                    <div className="bg-[#FFF9F2] border border-[#FFE0C2] rounded-xl p-3 flex flex-col items-center justify-center gap-1.5 mb-4 text-[10px] font-black text-[#7C4A03] leading-none">
                      <span className="text-[#8A6A3A] font-bold block">🎁 待领取的进阶大礼袋</span>
                      <div className="flex items-center gap-1.5 mt-0.5 text-rose-600 font-black">
                        <span>⭐+{tC.pointsReward} 星积分</span>
                        <span>+</span>
                        <span>{tC.foodReward.char}{tC.foodReward.name}×{tC.foodReward.count}</span>
                      </div>
                      <span className="text-[8px] text-[#B7791F] font-bold mt-1">(可前往 👤 荣誉墙 手动开启此晋级宝池)</span>
                    </div>
                  </>
                );
              })()}

              <button
                onClick={() => setUnlockedAchievementAlert(null)}
                className="w-full bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-white font-black py-3.5 px-6 rounded-2xl shadow-md cursor-pointer transition-all active:scale-95 text-xs"
              >
                我知道啦，开启新旅程！
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
