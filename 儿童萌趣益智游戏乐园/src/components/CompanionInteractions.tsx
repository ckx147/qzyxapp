/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Heart, Sparkles, ShoppingBag, Gift } from 'lucide-react';
import { UserProfile, Achievement } from '../types';
import { FOOD_ITEMS, saveGameState, checkAchievements } from '../utils/gameHelpers';

interface CompanionProps {
  profile: UserProfile;
  achievements: Achievement[];
  setProfile: React.Dispatch<React.SetStateAction<UserProfile>>;
  setAchievements: React.Dispatch<React.SetStateAction<Achievement[]>>;
  onPointsChange: (amount: number, reason: string) => void;
  onNotification: (text: string, icon: string) => void;
}

const DIALOGUES_NORMAL = [
  "今天做运动了吗？和我一起摇摆吧！🐰",
  "摸摸我的小肚子，咕噜噜真舒服呀~ 🦖",
  "每一天都在进步，你真棒！✨",
  "呼~好想吃甜甜的大苹果呀！🍎",
  "我们要不要挑战一下数字华容道？大脑在做体操呢！🧠",
  "呼啦圈，扭扭扭！多做趣味运动能长高高哦！🦁",
  "听说五子棋里放草莓和蓝莓，听起来很好吃呢！🍓",
  "你点舒尔特方格的时候，眼睛像一闪一闪的星星一样亮！⭐"
];

const DIALOGUES_HAPPY = [
  "哇！太开心了！你是我的超级好朋友！💖",
  "咕噜噜~ 感觉全身充满了魔法力量！✨",
  "好吃好吃！我可以再吃一根棒棒糖吗？🍭",
  "抱着你贴贴！今天又是元气满满的一天！🌈",
  "看！我能做超可爱的恐龙跳舞哦！🦖💨"
];

const DIALOGUES_HUNGRY = [
  "小肚子在打鼓啦，咕噜噜... 🍩",
  "可以喂我一个香脆的饼干吗？我会给你跳个舞哦！🍪",
  "啊——大嘴巴已经准备好迎接美味啦！🦖"
];

export const CompanionInteractions: React.FC<CompanionProps> = ({
  profile,
  achievements,
  setProfile,
  setAchievements,
  onPointsChange,
  onNotification,
}) => {
  const [bubbleText, setBubbleText] = useState("哈喽！我是你的益智陪伴小助手【小布】！🦖");
  const [isAnimating, setIsAnimating] = useState(false);
  const [showShop, setShowShop] = useState(false);
  const [floatingHeart, setFloatingHeart] = useState<{ id: number; x: number; y: number }[]>([]);
  const [animationState, setAnimationState] = useState<'idle' | 'happy' | 'eat' | 'bounce'>('idle');

  // Rotate random passive dialogue every 15s
  useEffect(() => {
    const interval = setInterval(() => {
      if (animationState === 'idle') {
        const pool = profile.feedHappiness > 75 
          ? DIALOGUES_HAPPY 
          : profile.feedHappiness < 30 
            ? DIALOGUES_HUNGRY 
            : DIALOGUES_NORMAL;
        const randomMsg = pool[Math.floor(Math.random() * pool.length)];
        setBubbleText(randomMsg);
        setAnimationState('bounce');
        setTimeout(() => setAnimationState('idle'), 1000);
      }
    }, 15000);
    return () => clearInterval(interval);
  }, [profile.feedHappiness, animationState]);

  const triggerPet = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isAnimating) return;
    setIsAnimating(true);
    setAnimationState('happy');
    
    // Spawn floating heart
    const rect = e.currentTarget.getBoundingClientRect();
    const newHeart = {
      id: Date.now(),
      x: e.clientX - rect.left - 20,
      y: e.clientY - rect.top - 40
    };
    setFloatingHeart(prev => [...prev, newHeart]);

    // dialogue response
    const replies = [
      "哈哈，好痒呀！🥰",
      "摸摸头，聪明加倍！💡",
      "捏捏小鼻子，愿你今天无忧无虑！👃🌸",
      "小布最喜欢和你在一起啦！🦖⭐",
      "貼一贴！我的鳞片暖洋洋的！☀️"
    ];
    setBubbleText(replies[Math.floor(Math.random() * replies.length)]);

    // increment small happiness
    setProfile(prev => {
      const newHappiness = Math.min(100, prev.feedHappiness + 2);
      
      const updatedProfile = {
        ...prev,
        feedHappiness: newHappiness
      };

      // Achievement check inside app state will be run by App.tsx, but let's check soon
      return updatedProfile;
    });

    setTimeout(() => {
      setIsAnimating(false);
      setAnimationState('idle');
    }, 1200);
  };

  // Clear heart particle after animating
  useEffect(() => {
    if (floatingHeart.length > 0) {
      const timer = setTimeout(() => {
        setFloatingHeart(prev => prev.slice(1));
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [floatingHeart]);

  const handleFeed = (foodName: string) => {
    const food = FOOD_ITEMS.find(f => f.name === foodName);
    if (!food) return;

    if ((profile.inventory[foodName] || 0) <= 0) {
      onNotification(`你口袋里没有【${foodName}】啦，快去积分商店兑换或者每日签到获取吧！`, 'Shop');
      return;
    }

    setAnimationState('eat');
    setBubbleText(`啊呜！大口吃掉了【${foodName}】！超美味！${food.char}✨`);

    setProfile(prev => {
      const currentCount = prev.inventory[foodName] || 0;
      const newInventory = {
        ...prev.inventory,
        [foodName]: Math.max(0, currentCount - 1)
      };
      
      const newHappiness = Math.min(100, prev.feedHappiness + food.happinessGain);
      
      // Update feeding progress for achievements
      const updated = {
        ...prev,
        feedHappiness: newHappiness,
        inventory: newInventory
      };

      // Let's increment achievement progress manually for feed_5
      return updated;
    });

    // Award bonus coins on high happiness
    setTimeout(() => {
      setAnimationState('happy');
      setBubbleText(`饱饱的！心情指数变亮啦！能量 +${food.happinessGain} 💖`);
      
      // Increment feeding achievement progress
      setAchievements(prevAchs => {
        const nextAchs = prevAchs.map(ach => {
          if (ach.id === 'ach_feed_5') {
            return { ...ach, progress: ach.progress + 1 };
          }
          return ach;
        });
        return nextAchs;
      });

      setTimeout(() => {
        setAnimationState('idle');
      }, 1500);
    }, 1200);
  };

  const buyFood = (food: typeof FOOD_ITEMS[0]) => {
    if (profile.points < food.pointsCost) {
      onNotification(`你的星星积分不够买【${food.name}】哦。多多玩游戏积攒星星吧！🌟`, 'Points');
      return;
    }

    onPointsChange(-food.pointsCost, `购买零食【${food.name}】`);

    setProfile(prev => {
      const currentCount = prev.inventory[food.name] || 0;
      return {
        ...prev,
        inventory: {
          ...prev.inventory,
          [food.name]: currentCount + 1
        }
      };
    });

    onNotification(`成功兑换了 1 个 ${food.char} ${food.name}！`, 'Bag');
  };

  // Determine emotional sprite base on happiness
  const getMascotEmoji = () => {
    switch (animationState) {
      case 'happy': return '🦖🥰';
      case 'eat': return '🦖😋🍰';
      case 'bounce': return '🦖🎈';
      default:
        if (profile.feedHappiness > 75) return '🦖💖';
        if (profile.feedHappiness < 30) return '🦖😢';
        return '🦖💚';
    }
  };

  const getMascotColor = () => {
    if (profile.feedHappiness > 75) return 'from-emerald-300 to-teal-400 border-teal-400';
    if (profile.feedHappiness < 30) return 'from-yellow-200 to-amber-300 border-amber-400';
    return 'from-emerald-200 to-green-300 border-green-400';
  };

  return (
    <div className="bg-white rounded-[36px] p-6 shadow-[0_12px_45px_rgba(16,185,129,0.06)] border border-slate-100 flex flex-col items-center relative overflow-hidden" id="companion-interaction-card">
      <div className="absolute top-3 right-3 flex gap-1">
        <button 
          onClick={() => setShowShop(!showShop)}
          className={`flex items-center gap-1.5 text-xs font-black py-1.5 px-4 rounded-full transition-all active:scale-95 cursor-pointer shadow-3xs ${
            showShop ? 'bg-[#FF9F1C] text-white hover:bg-orange-500' : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-100/80'
          }`}
          id="btn-snack-shop"
        >
          <ShoppingBag size={13} />
          {showShop ? '返回投喂' : '零食商店'}
        </button>
      </div>

      <div className="text-center w-full mt-4 mb-2">
        <div className="flex items-center justify-between text-xs font-bold text-gray-500 px-1 mb-1.5">
          <span className="flex items-center gap-1"><Heart className="text-rose-500 fill-rose-400" size={14} /> 小布的好感度</span>
          <span className="text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full font-black text-[11px]">{profile.feedHappiness}/100</span>
        </div>
        <div className="h-4 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-200/60 shadow-inner">
          <motion.div
            className="h-full bg-gradient-to-r from-[#4ADE80] to-emerald-500 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${profile.feedHappiness}%` }}
            transition={{ type: 'spring', stiffness: 60 }}
          />
        </div>
      </div>

      {/* Speech bubble - Cozy speech balloon design inspired by Immersive UI */}
      <div className="relative bg-[#FFFBF7] border border-[#FFE0C2]/80 text-slate-700 rounded-2xl px-4 py-3 my-3 text-xs font-extrabold max-w-xs shadow-3xs" id="mascot-speech-bubble">
        <p className="leading-relaxed text-center">{bubbleText}</p>
        <div className="absolute bottom-[-9px] left-1/2 transform -translate-x-1/2 w-4 h-4 bg-[#FFFBF7] border-r border-b border-[#FFE0C2]/80 rotate-45" />
      </div>

      {/* Mascot area */}
      <div 
        onClick={triggerPet}
        className={`w-36 h-36 rounded-full bg-gradient-to-b ${getMascotColor()} border-[3px] shadow-[0_12px_32px_rgba(16,185,129,0.12)] flex items-center justify-center cursor-pointer relative select-none touch-none hover:scale-105 active:scale-95 transition-all duration-300`}
        id="mascot-avatar-area"
      >
        <motion.div
          animate={animationState === 'happy' ? {
            scale: [1, 1.2, 0.9, 1.1, 1],
            rotate: [0, 10, -10, 5, 0],
          } : animationState === 'eat' ? {
            y: [0, -15, 0, -10, 0],
            scale: [1, 1.1, 0.95, 1.05, 1],
          } : animationState === 'bounce' ? {
            y: [0, -20, 0],
          } : {
            y: [0, -5, 0],
          }}
          transition={animationState === 'idle' ? {
            repeat: Infinity,
            duration: 3,
            ease: "easeInOut"
          } : {
            duration: 1
          }}
          className="text-6xl flex items-center justify-center filter drop-shadow-sm"
        >
          {getMascotEmoji().slice(0, 2)}
          {animationState === 'eat' && (
            <motion.span 
              initial={{ opacity: 1, scale: 1, y: 0 }}
              animate={{ opacity: 0, scale: 0.5, y: -30 }}
              transition={{ duration: 1 }}
              className="absolute text-3xl right-2 top-2"
            >
              ⭐
            </motion.span>
          )}
        </motion.div>

        {/* Floating Hearts */}
        <AnimatePresence>
          {floatingHeart.map(heart => (
            <motion.div
              key={heart.id}
              initial={{ opacity: 0, scale: 0.5, x: heart.x, y: heart.y }}
              animate={{ opacity: 1, scale: 1.2, y: heart.y - 60 }}
              exit={{ opacity: 0, y: heart.y - 120 }}
              className="absolute pointer-events-none text-rose-500 text-2xl"
            >
              ❤️
            </motion.div>
          ))}
        </AnimatePresence>
        
        <div className="absolute bottom-1 bg-white/95 border border-slate-200/50 rounded-full px-2.5 py-0.5 text-[9px] font-black text-gray-500 block shadow-3xs">
          👈 摸摸我呀
        </div>
      </div>

      <p className="text-[10px] text-gray-400 mt-2.5 font-bold uppercase tracking-wider">点击小布进行互动，增加好感度~</p>

      {/* Main Bottom interactive action space: Shop vs Feed Pack */}
      <div className="w-full mt-4" id="inventory-or-shop-container">
        {showShop ? (
          <div className="bg-amber-50/50 rounded-[28px] p-4 border border-amber-200/60 shadow-3xs">
            <h4 className="text-[11px] font-black text-amber-800 mb-2.5 flex items-center justify-center gap-1.5 uppercase">
              <Sparkles size={12} /> 零食杂货铺 (消耗星星积分)
            </h4>
            <div className="grid grid-cols-1 gap-2 max-h-52 overflow-y-auto pr-1">
              {FOOD_ITEMS.map(food => (
                <div 
                  key={food.id}
                  className="flex items-center justify-between bg-white p-2.5 rounded-2xl border border-amber-100/50 shadow-3xs hover:border-amber-200 transition-all"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{food.char}</span>
                    <div className="text-left leading-tight">
                      <p className="text-xs font-black text-slate-700">{food.name}</p>
                      <p className="text-[9px] text-slate-400 font-bold mt-0.5">{food.desc}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => buyFood(food)}
                    className="bg-amber-400 hover:bg-amber-500 active:scale-95 text-white text-[10px] font-black py-1 px-3 rounded-full flex items-center gap-0.5 cursor-pointer shadow-3xs"
                  >
                    ⭐ {food.pointsCost}
                  </button>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="bg-emerald-50/40 rounded-[28px] p-4 border border-emerald-200/50 shadow-3xs">
            <h4 className="text-[11px] font-black text-emerald-800 mb-2.5 text-center flex items-center justify-center gap-1.5 uppercase">
              <Gift size={12} className="text-emerald-600" /> 我的魔法零食袋 (投喂小布)
            </h4>
            <div className="grid grid-cols-3 gap-2">
              {FOOD_ITEMS.map(item => {
                const count = profile.inventory[item.name] || 0;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleFeed(item.name)}
                    disabled={count <= 0 || animationState === 'eat'}
                    className={`flex flex-col items-center justify-center p-2.5 rounded-2xl bg-white border transition-all relative ${
                      count > 0 
                        ? 'border-emerald-200/60 hover:border-emerald-300 active:scale-95 cursor-pointer shadow-3xs' 
                        : 'border-slate-100 opacity-50 cursor-not-allowed'
                    }`}
                  >
                    <span className="text-3xl mb-1">{item.char}</span>
                    <span className="text-[10px] font-black text-slate-700">{item.name}</span>
                    <span className="absolute top-1 right-1 bg-emerald-600 text-white font-extrabold text-[9px] w-4 h-4 rounded-full flex items-center justify-center">
                      {count}
                    </span>
                    <span className="text-[9px] text-emerald-600 mt-1 font-bold">+{item.happinessGain} 快乐</span>
                  </button>
                );
              })}
            </div>
            {(Object.values(profile.inventory) as number[]).reduce((a,b) => a+b, 0) === 0 && (
              <p className="text-[10px] text-center text-slate-400 mt-3 font-semibold">口袋空空如也，点右上角【零食商店】买点好吃的吧！</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
