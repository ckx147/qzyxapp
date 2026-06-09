/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  Award,
  Calendar,
  Compass,
  Cookie,
  Flame,
  Heart,
  Shapes,
  ShieldAlert,
  Shuffle,
  Zap,
  type LucideIcon,
} from 'lucide-react';
import { Achievement } from '../types';
import { getAchievementTierConfig } from '../utils/tierConfig';

interface AchievementsViewProps {
  achievements: Achievement[];
  onClaimReward: (achId: string) => void;
}

const ACHIEVEMENT_ICONS: Record<string, LucideIcon> = {
  Award,
  Calendar,
  Compass,
  Cookie,
  Flame,
  Heart,
  Shapes,
  ShieldAlert,
  Shuffle,
  Zap,
};

export const AchievementsView: React.FC<AchievementsViewProps> = ({ achievements, onClaimReward }) => {
  // Total claimed/unlocked tiers count to determine their Honorary Title
  const totalCompletedTiers = achievements.reduce((acc, ach) => {
    const claimedCount = (ach.tier || 1) - 1 + (ach.rewardsClaimed ? 1 : 0);
    return acc + claimedCount;
  }, 0);

  // Kids explorer title calculation
  const getAdventurerTitle = (tiers: number) => {
    if (tiers === 0) return { name: '🌱 萌新小学徒', desc: '刚踏入思维乐园的探险萌新，加油打卡闯关吧！', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
    if (tiers <= 3) return { name: '🎒 见习魔法使', desc: '初步掌握数字魔法，你的大脑在慢慢变聪明哦！', color: 'bg-sky-50 text-sky-700 border-sky-200' };
    if (tiers <= 8) return { name: '🎖️ 资深探险家', desc: '成功破解不少华容道与五子棋！已经小有名气啦！', color: 'bg-amber-50 text-amber-700 border-amber-200' };
    if (tiers <= 18) return { name: '🔮 元素奥秘大师', desc: '神奇的智慧之光环绕。各大解谜关卡已经不在话下！', color: 'bg-purple-50 text-purple-700 border-purple-200' };
    if (tiers <= 35) return { name: '👑 传奇头脑王者', desc: '智商爆表的超级神童！所有的金光勋章都印着你的名字！', color: 'bg-rose-50 text-rose-700 border-rose-300' };
    return { name: '🌌 终极至尊神话', desc: '传说中的终极智慧之神，荣耀之碑由你铸造，太震撼了！', color: 'bg-gradient-to-r from-yellow-100 via-pink-100 to-indigo-100 text-slate-800 border-amber-300' };
  };

  const titleMeta = getAdventurerTitle(totalCompletedTiers);

  return (
    <div className="kid-game-panel p-5" id="achievements-gallery-module">
      {/* 1. Header & Summary Stats */}
      <div className="kid-game-header flex flex-col gap-3 pb-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-left">
            <span className="text-3xl animate-soft-pop">🏅</span>
            <div>
              <h3 className="font-black text-slate-700 text-sm">成长魔法荣誉榜</h3>
              <p className="text-[10px] text-slate-400 font-bold mt-0.5">荣誉层层进阶，分步解锁赢伴侣零食好礼！</p>
            </div>
          </div>
          <span className="bg-[#FFEDD5] text-[#D97706] font-black text-[10px] py-1 px-3 rounded-full border border-[#FFE0C2]">
            荣誉勋章数: {achievements.length} | 晋级总数: {totalCompletedTiers}
          </span>
        </div>

        {/* Dynamic kids honorary title frame */}
        <div className={`p-3 rounded-2xl border flex flex-col sm:flex-row items-center gap-2 text-left ${titleMeta.color} transition-all`}>
          <div className="text-center sm:text-left">
            <div className="flex items-center justify-center sm:justify-start gap-1.5">
              <span className="text-xs font-black tracking-wide leading-none">{titleMeta.name}</span>
              <span className="bg-white/80 text-[7px] font-black px-1.5 py-0.5 rounded-full border border-current">LV.{totalCompletedTiers}</span>
            </div>
            <p className="text-[9px] font-bold mt-1 text-slate-500 leading-normal">{titleMeta.desc}</p>
          </div>
        </div>
      </div>

      <p className="text-[11px] text-slate-400 my-4 font-bold text-left leading-relaxed">
        无论是排雷小能手、华容道还是五子棋，均支持升级到更高的白银、黄金、钻石等共 7 个大段位！每次升级均可手动点击 🎁 开启宝盒索要大额能量与美食零食奖励哟！🍖😋
      </p>

      {/* 2. Progressive Badges Grid Board */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4.5" id="achievements-badges-grid">
        {achievements.map((ach) => {
          const tierLevel = ach.tier || 1;
          const config = getAchievementTierConfig(ach.id, tierLevel);
          const iconComponent = ACHIEVEMENT_ICONS[ach.icon] || Award;
          
          // Calculate precise percentages for counts and records (lower is better check)
          let pct = 0;
          let isKlotskiOrSchulte = ['ach_klotski_1', 'ach_schulte_1', 'ach_schulte_speed'].includes(ach.id);
          
          if (isKlotskiOrSchulte) {
            // Lower moves or times is better
            // If they haven't solved it yet, value is 9999 or 0
            if (ach.progress > 0 && ach.progress < 9999) {
              const rat = config.targetValue / ach.progress;
              pct = Math.min(100, Math.floor(rat * 100));
            } else {
              pct = 0;
            }
          } else {
            // Standard count
            pct = Math.min(100, Math.floor((ach.progress / config.targetValue) * 100));
          }

          // Special maximum tier finished check
          const isFullPeak = ach.tier === 7 && ach.rewardsClaimed;

          // Define tier style color accents for premium badge cards
          const tierBorders = [
            'border-[#E2BCA4] bg-orange-50/15', // Bronze
            'border-slate-300 bg-slate-50/20', // Silver
            'border-amber-300 bg-amber-50/10', // Gold
            'border-sky-300 bg-sky-50/10', // Platinum
            'border-purple-300 bg-purple-50/10', // Diamond
            'border-pink-300 bg-pink-50/10', // Master
            'border-rose-400 bg-rose-50/15', // King
          ];
          const activeBorder = tierBorders[Math.min(6, tierLevel - 1)];

          const nextTierName = tierLevel < 7 ? getAchievementTierConfig(ach.id, tierLevel + 1).tierName : '';

          return (
            <div 
              key={ach.id}
              className={`p-5 rounded-[24px] border transition-all flex flex-col justify-between relative overflow-hidden group ${
                isFullPeak
                  ? 'bg-[#FFF9F2] border-amber-300 text-slate-700 shadow-[0_14px_28px_rgba(217,119,6,0.10)]'
                  : ach.unlocked
                    ? 'bg-[#FFFDF9] text-slate-800 scale-100 shadow-sm ' + activeBorder
                    : 'bg-slate-50/50 border-slate-200 text-slate-400'
              }`}
            >
              {/* Card top banner header element */}
              <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-[#FFE0C2]/50 to-transparent" />

              {/* Top Banner Tag indicator */}
              <div className="absolute top-2 right-2 flex items-center gap-1 z-10">
                <span className={`text-[8.5px] font-black py-0.5 px-2 rounded-full flex items-center gap-1 border ${
                  ach.unlocked 
                    ? 'bg-amber-100 text-amber-800 border-amber-200' 
                    : 'bg-slate-100 text-slate-500 border-slate-200'
                }`}>
                  <span className="scale-110">{config.badgeEmoji}</span>
                  <span>{config.tierName}</span>
                </span>
              </div>

              {/* Core content block */}
              <div>
                <div className="flex items-start gap-3 text-left">
                  {/* Visual Left Icon Circle */}
                  <div className={`p-2.5 rounded-2xl shrink-0 transition-all duration-300 ${
                    ach.unlocked || isFullPeak 
                      ? 'bg-amber-50 scale-105 shadow-3xs border border-[#FFE0C2]/60 text-amber-600' 
                      : 'bg-slate-100 text-slate-400 border border-slate-200/50'
                  }`}>
                    {React.createElement(iconComponent, {
                      size: 20,
                      className: ach.unlocked && !ach.rewardsClaimed ? 'text-amber-500 animate-soft-pop' : 'text-[#FF8E9E]'
                    })}
                  </div>

                  {/* Right description column */}
                  <div className="space-y-1 pr-14">
                    <h4 className="text-xs font-black text-slate-700 flex items-center gap-1.5 tracking-tight">
                      <span>{ach.title}</span>
                      {ach.unlocked && !ach.rewardsClaimed && (
                        <span className="inline-block w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
                      )}
                    </h4>
                    
                    {/* Beautifully wrapped goal info badge */}
                    <div className="bg-slate-50/80 rounded-xl p-2 border border-slate-100 leading-relaxed text-[9.5px] font-bold text-slate-500 mt-1">
                      <div className="text-slate-600 flex items-center justify-between font-black text-[9px] mb-0.5 pb-0.5 border-b border-dashed border-slate-100">
                        <span>💬 勋章任务：</span>
                        <span className="text-amber-600">
                          {isKlotskiOrSchulte ? '🏆 缩减记录' : '🌱 累积达标'}
                        </span>
                      </div>
                      {tierLevel === 1 
                        ? ach.description 
                        : `让智慧再升级！在解谜挑战中不断攀爬，刷新达到【${config.tierName}】专属记录吧！`
                      }
                    </div>
                  </div>
                </div>

                {/* Substantive Goal Stats Box */}
                <div className="mt-3.5 bg-slate-50/50 rounded-xl p-2.5 border border-slate-100/70 text-left space-y-1.5">
                  <div className="flex items-center justify-between text-[9px] font-black">
                    <span className="text-slate-400">📊 当前达成深度</span>
                    <span className={`font-mono ${ach.unlocked ? 'text-amber-600' : 'text-slate-400'}`}>{pct}%</span>
                  </div>

                  <div className="flex items-center gap-2 text-[9.5px] font-bold tracking-tight text-slate-600">
                    <span className="text-slate-400">🏁 大脑记录:</span>
                    {isKlotskiOrSchulte ? (
                      <span className="font-extrabold text-[#7C3AED]">
                        {ach.progress < 9999 ? `${ach.progress} ${ach.id.includes('klotski') ? '步' : '秒'}` : '暂无挑战数据'}
                      </span>
                    ) : (
                      <span className="font-extrabold text-[#0284C7]">
                        已完成 {ach.progress} 次
                      </span>
                    )}
                    <span className="text-slate-300">|</span>
                    <span className="text-slate-400">晋级目标:</span>
                    <span className="font-extrabold text-amber-600">
                      {isKlotskiOrSchulte ? `${config.targetValue} ${ach.id.includes('klotski') ? '步' : '秒'}` : `${config.targetValue} 次`}
                    </span>
                  </div>
                </div>
              </div>

              {/* Progress metric values bar */}
              <div className="space-y-1.5 my-3">
                <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden shadow-inner border border-slate-200/30">
                  <div 
                    className={`h-full rounded-full transition-all duration-700 ${
                      isFullPeak
                        ? 'bg-gradient-to-r from-red-400 via-orange-400 to-amber-400'
                        : ach.unlocked
                          ? 'bg-gradient-to-r from-yellow-400 to-[#FF9F1C]'
                          : 'bg-slate-300'
                    }`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>

              {/* Bottom Claim Reward Interactive Area */}
              <div className="pt-2 border-t border-dashed border-slate-200/60 flex items-center justify-between">
                {/* Rewards preview list or claim action status */}
                {isFullPeak ? (
                  <span className="inline-flex items-center justify-center w-full gap-1 bg-gradient-to-r from-red-100 via-amber-100 to-rose-100 border border-amber-300/60 text-[9px] font-black py-1.5 px-3 rounded-xl text-[#92400E]">
                    👑 太棒啦！已臻最高【神话王者】至臻巅峰 🏆
                  </span>
                ) : ach.unlocked && !ach.rewardsClaimed ? (
                  // Pulse claim trigger button
                  <button
                    type="button"
                    onClick={() => onClaimReward(ach.id)}
                    className="kid-game-primary w-full bg-[#FF9F1C] hover:bg-[#F59E0B] text-white text-[9.5px] font-black py-2.5 px-3 rounded-xl active:translate-y-0.5 active:border-b-0 cursor-pointer text-center animate-soft-pop flex items-center justify-center gap-1.5"
                  >
                    <span>🎁 开启【{config.tierName}】晋级宝盒！</span>
                    <span className="text-[8.5px] opacity-90">(得 +{config.pointsReward}⭐ 和 {config.foodReward.char} 零食)</span>
                  </button>
                ) : (
                  // Display preview of target rewards
                  <div className="flex items-center justify-between w-full text-[9px] text-slate-400 font-bold leading-none">
                    <span className="text-slate-400">下级可领:</span>
                    <div className="flex items-center gap-1.5">
                      <span className="inline-flex items-center gap-0.5 bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded-md border border-amber-100/50 font-black">
                        ⭐ +{config.pointsReward}
                      </span>
                      <span className="inline-flex items-center gap-0.5 bg-rose-50 text-rose-700 px-1.5 py-0.5 rounded-md border border-rose-100/50 font-black">
                        {config.foodReward.char} {config.foodReward.name}×{config.foodReward.count}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
