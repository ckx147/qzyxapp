/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Calendar, CheckCircle2, Gift } from 'lucide-react';
import { UserProfile, CheckInState, Achievement } from '../types';
import { DAILY_REWARDS, saveGameState, checkAchievements } from '../utils/gameHelpers';

interface CheckInProps {
  profile: UserProfile;
  checkIn: CheckInState;
  achievements: Achievement[];
  setProfile: React.Dispatch<React.SetStateAction<UserProfile>>;
  setCheckIn: React.Dispatch<React.SetStateAction<CheckInState>>;
  setAchievements: React.Dispatch<React.SetStateAction<Achievement[]>>;
  onPointsChange: (amount: number, reason: string) => void;
  onNotification: (text: string, icon: string) => void;
}

export const DailyCheckIn: React.FC<CheckInProps> = ({
  profile,
  checkIn,
  achievements,
  setProfile,
  setCheckIn,
  setAchievements,
  onPointsChange,
  onNotification,
}) => {
  const [showRewardClaimedModal, setShowRewardClaimedModal] = useState<any | null>(null);

  // Core sign-in handler
  const handleCheckInNow = () => {
    if (checkIn.checkedInToday) {
      onNotification("你今天已经完成每日打卡啦！明天再来找小布玩耍并领糖果吧！🦄", "Calendar");
      return;
    }

    const todayStr = new Date().toISOString().split('T')[0];
    
    // Check linear sequence
    let currentStreak = checkIn.streak + 1;
    // Reset if they skipped a day? To keep it kid-friendly, let's check
    if (checkIn.lastCheckInDate) {
      const lastDate = new Date(checkIn.lastCheckInDate);
      const today = new Date(todayStr);
      const diffTime = Math.abs(today.getTime() - lastDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays > 1) {
        // Broke streak, reset back to 1
        currentStreak = 1;
      }
    }

    // Wrap streak to 7 max
    const rewardIndex = (currentStreak - 1) % 7;
    const reward = DAILY_REWARDS[rewardIndex];

    // Grant Points and food items
    onPointsChange(reward.points, `第 ${currentStreak} 天每日打卡`);
    
    setProfile(prev => {
      const inventoryCopy = { ...prev.inventory };
      inventoryCopy[reward.item] = (inventoryCopy[reward.item] || 0) + reward.count;
      return {
        ...prev,
        inventory: inventoryCopy
      };
    });

    const nextCheckIn: CheckInState = {
      lastCheckInDate: todayStr,
      streak: currentStreak,
      checkedInToday: true,
      unlockedItems: [...checkIn.unlockedItems, reward.item]
    };

    setCheckIn(nextCheckIn);

    // Trigger achievement evaluations
    setAchievements(prevAchs => {
      return prevAchs.map(ach => {
        if (ach.id === 'ach_checkin_1') {
          return { ...ach, progress: 1 };
        }
        if (ach.id === 'ach_checkin_3') {
          return { ...ach, progress: Math.max(ach.progress, currentStreak) };
        }
        return ach;
      });
    });

    setShowRewardClaimedModal(reward);
    onNotification(`已成功打卡第 ${currentStreak} 天！获得打卡礼包 ${reward.icon} ${reward.item} * ${reward.count}！请记得去投喂小布哦~`, "Gift");
  };

  return (
    <div className="bg-white rounded-[36px] p-6 shadow-[0_12px_45px_rgba(251,191,36,0.06)] border border-slate-100 relative" id="daily-checkin-wrapper">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-extrabold text-slate-700 flex items-center gap-1.5 uppercase tracking-wide">
          <Calendar className="text-[#FF9F1C]" size={16} />
          每日打卡奇遇记
        </h2>
        <span className="text-[10px] bg-amber-50 text-[#D97706] font-black px-2.5 py-0.5 rounded-full border border-amber-100/50">
          已连续打卡 {checkIn.streak} 天
        </span>
      </div>

      <p className="text-[11px] text-[#FF9F1C] font-semibold bg-amber-50/40 p-2.5 rounded-xl border border-amber-100/30 mb-4 leading-relaxed text-left">
        坚持每天和陪伴龙【小布】一起打卡，不仅能获得丰厚能量点，还能在商店给它买糖果，增进友情解锁神秘荣誉哦！🦄👇
      </p>

      {/* Daily path nodes */}
      <div className="grid grid-cols-4 sm:grid-cols-7 gap-2 mb-4.5" id="checkin-nodes-grid">
        {Array.from({ length: 7 }).map((_, i) => {
          const currentDay = i + 1;
          const correspondingReward = DAILY_REWARDS[i];
          const isClaimed = checkIn.streak >= currentDay;
          const isCurrentActive = checkIn.streak + 1 === currentDay && !checkIn.checkedInToday;

          return (
            <div 
              key={i}
              className={`flex flex-col items-center justify-between p-2 rounded-2xl border transition-all duration-300 relative ${
                isClaimed 
                  ? 'bg-[#FFFBF7] border-amber-200/40 text-slate-400' 
                  : isCurrentActive
                    ? 'bg-rose-50/50 border-[#FF8E9E] scale-102 text-[#F43F5E] animate-pulse font-extrabold'
                    : 'bg-slate-50 border-slate-200/60 text-slate-400'
              }`}
            >
              <span className="text-[9px] font-black block">D{currentDay}</span>
              
              <div className="text-2xl my-1 relative filter drop-shadow-3xs">
                {isClaimed ? (
                  <div className="relative">
                    <span className="opacity-25">{correspondingReward.icon}</span>
                    <CheckCircle2 className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-[#10B981] bg-white rounded-full shadow-3xs" size={15} />
                  </div>
                ) : (
                  <span>{correspondingReward.icon}</span>
                )}
              </div>

              <div className="text-center leading-none">
                <p className="text-[9px] font-black">+{correspondingReward.points}⭐</p>
                <p className="text-[8px] font-bold text-slate-400 truncate max-w-10 block mt-0.5">{correspondingReward.item}</p>
              </div>

              {isCurrentActive && (
                <span className="absolute -top-1.5 bg-rose-500 text-white text-[7px] px-1.5 py-0.5 rounded-full font-black animate-bounce leading-none shadow-3xs">
                  可领
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Punch button - Stylings matching Immersive UI CTA immediate sign-in button */}
      <button
        onClick={handleCheckInNow}
        disabled={checkIn.checkedInToday}
        className={`w-full py-3.5 mb-1.5 rounded-2xl font-black text-xs uppercase tracking-wider cursor-pointer transition-all duration-300 active:scale-95 shadow-3xs ${
          checkIn.checkedInToday
            ? 'bg-slate-100 border border-slate-200/60 text-slate-400 cursor-not-allowed shadow-none'
            : 'bg-gradient-to-r from-amber-400 to-[#FF9F1C] text-white hover:shadow-md'
        }`}
        id="btn-day-checkin"
      >
        {checkIn.checkedInToday ? '🎉 今日已打卡 期待明天惊喜！' : '🎁 立即打卡签到 领取礼物！'}
      </button>

      {/* Rewards details overlay modal */}
      <AnimatePresence>
        {showRewardClaimedModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 pointer-events-auto"
            id="reward-claimed-modal"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 30 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 30 }}
              className="bg-white border border-slate-100 rounded-[32px] p-6 max-w-sm w-full text-center shadow-2xl relative"
            >
              <div className="absolute top-[-36px] left-1/2 transform -translate-x-1/2 bg-amber-400 text-white rounded-full p-3.5 border-4 border-white shadow-lg animate-bounce">
                <Gift size={24} />
              </div>

              <h3 className="text-lg font-black text-slate-800 mt-6 mb-1">恭喜小勇士！</h3>
              <p className="text-xs text-[#FF9F1C] font-black uppercase tracking-wider mb-4">打卡成功！思维能量爆表！🚀</p>
              
              <div className="bg-amber-50/30 rounded-2xl p-4.5 mb-4 border border-amber-100/50 flex flex-col items-center">
                <p className="text-slate-400 text-[10px] font-black mb-1.5 uppercase tracking-wide">本次签到获得的宝藏</p>
                <div className="flex items-center gap-4">
                  <div className="flex flex-col items-center">
                    <span className="text-3xl filter drop-shadow-3xs">⭐</span>
                    <span className="text-xs font-black text-slate-700 mt-1">+{showRewardClaimedModal.points} 星星积分</span>
                  </div>
                  <div className="text-amber-300 text-lg font-black">+</div>
                  <div className="flex flex-col items-center">
                    <span className="text-3xl filter drop-shadow-3xs">{showRewardClaimedModal.icon}</span>
                    <span className="text-xs font-black text-slate-700 mt-1">{showRewardClaimedModal.item} * {showRewardClaimedModal.count}</span>
                  </div>
                </div>
              </div>

              <p className="text-[10px] text-slate-400 font-bold leading-relaxed">
                这些星点食物已经放入你的魔法零食袋，点击上面的 【小布】 头像给它喂食并增加好感度吧！🦖🍬
              </p>

              <button
                onClick={() => setShowRewardClaimedModal(null)}
                className="mt-5 w-full bg-[#FF9F1C] hover:bg-orange-500 text-white font-black text-xs py-3 px-6 rounded-2xl transition-all shadow-md active:scale-95 cursor-pointer uppercase tracking-wider"
              >
                太棒了，开启新旅程！
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
