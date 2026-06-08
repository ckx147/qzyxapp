/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface TierConfig {
  tierName: string;
  badgeEmoji: string;
  colorClass: string;
  bgGradient: string;
  targetValue: number;
  pointsReward: number;
  foodReward: {
    id: string;
    name: string;
    char: string;
    count: number;
  };
}

export const TIER_NAMES = ['青铜级', '白银级', '黄金级', '白金级', '钻石级', '大师级', '王者级'];
export const TIER_BADGES = ['🥉', '🥈', '🥇', '💎', '👑', '🔮', '🏆'];

export const TIER_GRADIENTS = [
  'from-[#CD7F32] to-[#B87333] border-[#CD7F32]', // Bronze
  'from-[#94A3B8] to-[#64748B] border-[#94A3B8]', // Silver
  'from-[#FFD166] to-[#FF9F1C] border-[#FFB52E]', // Gold
  'from-[#38BDF8] to-[#0284C7] border-[#38BDF8]', // Platinum
  'from-[#C084FC] to-[#7C3AED] border-[#C084FC]', // Diamond
  'from-[#F472B6] to-[#DB2777] border-[#F472B6]', // Master
  'from-[#EF4444] via-[#F97316] to-[#EC4899] border-[#EF4444]', // King (Animated)
];

const FOOD_POOL = [
  { id: 'candy', name: '糖果', char: '🍬' },
  { id: 'apple', name: '苹果', char: '🍎' },
  { id: 'biscuit', name: '饼干', char: '🍪' },
  { id: 'donut', name: '甜甜圈', char: '🍩' },
  { id: 'icecream', name: '冰淇淋', char: '🍦' },
];

/**
 * Returns tier configuration for list item
 */
export function getAchievementTierConfig(achievementId: string, tierLevel: number): TierConfig {
  const levelIndex = Math.min(6, Math.max(0, tierLevel - 1));
  const tierName = TIER_NAMES[levelIndex];
  const badgeEmoji = TIER_BADGES[levelIndex];
  const bgGradient = TIER_GRADIENTS[levelIndex];
  const colorClass = levelIndex === 0 ? 'text-[#854D0E]' : 'text-slate-800';

  // Point rewards rise exponentially per tier: 40 -> 80 -> 120 -> 180 -> 260 -> 380 -> 550
  const pointsRewardArray = [50, 100, 150, 220, 300, 420, 600];
  const pointsReward = pointsRewardArray[levelIndex];

  // Food Reward based on tierlevel index
  const foodIndex = levelIndex % FOOD_POOL.length;
  const foodItem = FOOD_POOL[foodIndex];
  const foodCount = Math.floor(levelIndex / FOOD_POOL.length) + 1; // 1 for earlier, 2 for Master & King

  // Define unique target progressions tailored for each achievement
  let targetValue = 1;
  switch (achievementId) {
    case 'ach_checkin_1': // 打卡先锋 (Total checkins/or streak)
      targetValue = [1, 3, 7, 14, 30, 50, 100][levelIndex];
      break;
    case 'ach_checkin_3': // 连续打卡
      targetValue = [2, 3, 5, 7, 15, 30, 50][levelIndex];
      break;
    case 'ach_bomb_1': // 数字炸弹挑战 (Explosions)
      targetValue = [1, 3, 5, 10, 20, 40, 70][levelIndex];
      break;
    case 'ach_bomb_3': // 排雷战神 (Clears)
      targetValue = [1, 3, 5, 10, 18, 30, 50][levelIndex];
      break;
    case 'ach_klotski_1': // 空间魔法学者 (Moves for 3x3)
      targetValue = [120, 80, 55, 45, 35, 25, 18][levelIndex];
      break;
    case 'ach_schulte_1': // 舒尔特方格 3x3 time
      targetValue = [45, 30, 20, 15, 11, 8, 5][levelIndex];
      break;
    case 'ach_schulte_speed': // 舒尔特方格 4x4 time
      targetValue = [80, 60, 45, 35, 25, 20, 15][levelIndex];
      break;
    case 'ach_gomoku_1': // 棋圣胜利场次
      targetValue = [1, 3, 7, 12, 20, 35, 50][levelIndex];
      break;
    case 'ach_feed_5': // 喂零食次数
      targetValue = [1, 3, 8, 15, 25, 40, 60][levelIndex];
      break;
    case 'ach_happy_dino': // 伴侣满足度 level
      targetValue = [40, 60, 80, 90, 95, 98, 100][levelIndex];
      break;
    default:
      targetValue = [1, 3, 5, 10, 15, 20, 30][levelIndex];
  }

  return {
    tierName,
    badgeEmoji,
    colorClass,
    bgGradient,
    targetValue,
    pointsReward,
    foodReward: {
      id: foodItem.id,
      name: foodItem.name,
      char: foodItem.char,
      count: foodCount,
    }
  };
}
