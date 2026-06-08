/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { UserProfile, Achievement, LeaderboardItem, GameRecord, CheckInState } from '../types';
import { getAchievementTierConfig } from './tierConfig';

export const AVATARS = [
  { id: 'avatar_dino', char: '🦖', name: '萌酷霸王龙', color: 'bg-emerald-100 border-emerald-300' },
  { id: 'avatar_rabbit', char: '🐰', name: '乖巧粉粉兔', color: 'bg-pink-100 border-pink-300' },
  { id: 'avatar_cat', char: '🐱', name: '淘气小花猫', color: 'bg-amber-100 border-amber-300' },
  { id: 'avatar_bear', char: '🐻', name: '憨厚小力熊', color: 'bg-orange-100 border-orange-300' },
  { id: 'avatar_fox', char: '🦊', name: '聪明红毛狐', color: 'bg-red-100 border-red-300' },
  { id: 'avatar_panda', char: '🐼', name: '快乐大熊猫', color: 'bg-slate-100 border-slate-300' },
  { id: 'avatar_unicorn', char: '🦄', name: '幻想独角兽', color: 'bg-indigo-100 border-indigo-300' },
  { id: 'avatar_robot', char: '🤖', name: '智多星机甲', color: 'bg-sky-100 border-sky-300' },
];

export const INITIAL_RECORDS: GameRecord = {
  bombGuesses: 0,
  bombExplodes: 0,
  bombClears: 0,
  klotskiBestMoves3x3: 9999,
  klotskiBestTime3x3: 9999,
  klotskiBestMoves4x4: 9999,
  klotskiBestTime4x4: 9999,
  schulteBest3x3: 9999,
  schulteBest4x4: 9999,
  schulteBest5x5: 9999,
  gomokuWins: 0,
  gomokuLosses: 0,
  gomokuDraws: 0,
};

export const INITIAL_PROFILE: UserProfile = {
  id: 'user_kid_1',
  nickname: '聪明小探险家',
  avatarId: 'avatar_dino',
  points: 100, // starting points
  feedHappiness: 50, // 0 to 100
  inventory: {
    '糖果': 1,
    '苹果': 2,
    '饼干': 1,
  },
  records: INITIAL_RECORDS,
};

export const FOOD_ITEMS = [
  { id: 'candy', name: '糖果', char: '🍬', happinessGain: 8, pointsCost: 15, desc: '甜甜糖果，瞬间加糖' },
  { id: 'apple', name: '苹果', char: '🍎', happinessGain: 12, pointsCost: 20, desc: '健康苹果，补充维生素' },
  { id: 'biscuit', name: '饼干', char: '🍪', happinessGain: 15, pointsCost: 25, desc: '香脆饼干，恢复元气' },
  { id: 'donut', name: '甜甜圈', char: '🍩', happinessGain: 20, pointsCost: 35, desc: '缤纷甜甜圈，快乐拉满' },
  { id: 'icecream', name: '冰淇淋', char: '🍦', happinessGain: 25, pointsCost: 45, desc: '清凉冰淇淋，开心无比' },
];

export const INITIAL_ACHIEVEMENTS: Achievement[] = [
  {
    id: 'ach_checkin_1',
    title: '初试探险',
    description: '完成首次每日打卡签到',
    icon: 'Compass',
    color: 'bg-indigo-100 text-indigo-600',
    type: 'checkin',
    targetValue: 1,
    unlocked: false,
    progress: 0,
  },
  {
    id: 'ach_checkin_3',
    title: '打卡达人',
    description: '连续打卡签到达到 3 天',
    icon: 'Calendar',
    color: 'bg-sky-100 text-sky-600',
    type: 'checkin',
    targetValue: 3,
    unlocked: false,
    progress: 0,
  },
  {
    id: 'ach_bomb_1',
    title: '拆弹学徒',
    description: '在数字炸弹游戏中首次猜出数字（经历爆炸）',
    icon: 'Flame',
    color: 'bg-orange-100 text-orange-600',
    type: 'bomb',
    targetValue: 1,
    unlocked: false,
    progress: 0,
  },
  {
    id: 'ach_bomb_3',
    title: '排雷小能手',
    description: '在数字炸弹中成功排除 3 次炸弹',
    icon: 'ShieldAlert',
    color: 'bg-yellow-10 border-yellow-600',
    type: 'bomb',
    targetValue: 3,
    unlocked: false,
    progress: 0,
  },
  {
    id: 'ach_klotski_1',
    title: '空间魔法学家',
    description: '成功解开一局 3x3 数字华容道',
    icon: 'Shapes',
    color: 'bg-emerald-100 text-emerald-600',
    type: 'klotski',
    targetValue: 1,
    unlocked: false,
    progress: 0,
  },
  {
    id: 'ach_schulte_1',
    title: '神速金睛',
    description: '顺利点完 3x3 舒尔特方格专注训练',
    icon: 'Zap',
    color: 'bg-amber-100 text-amber-600',
    type: 'schulte',
    targetValue: 1,
    unlocked: false,
    progress: 0,
  },
  {
    id: 'ach_schulte_speed',
    title: '眼力闪电侠',
    description: '在 15 秒内顺利点完 3x3 舒尔特训练',
    icon: 'Shuffle',
    color: 'bg-rose-100 text-rose-600',
    type: 'schulte',
    targetValue: 1,
    unlocked: false,
    progress: 0,
  },
  {
    id: 'ach_gomoku_1',
    title: '初出茅庐棋士',
    description: '在五子棋中成功打败 AI “小布”',
    icon: 'Award',
    color: 'bg-teal-100 text-teal-600',
    type: 'gomoku',
    targetValue: 1,
    unlocked: false,
    progress: 0,
  },
  {
    id: 'ach_feed_5',
    title: '金牌小厨神',
    description: '喂养伴侣小布零食达到 5 次',
    icon: 'Cookie',
    color: 'bg-pink-100 text-pink-600',
    type: 'interaction',
    targetValue: 5,
    unlocked: false,
    progress: 0,
  },
  {
    id: 'ach_happy_dino',
    title: '知心挚友',
    description: '让陪伴恐龙小布的心情满足度达到 80 以上',
    icon: 'Heart',
    color: 'bg-purple-100 text-purple-600',
    type: 'interaction',
    targetValue: 80,
    unlocked: false,
    progress: 0,
  }
];

export const INITIAL_LEADERBOARD: LeaderboardItem[] = [
  { id: 'bot_1', nickname: '乐乐兔', avatarId: 'avatar_rabbit', points: 920 },
  { id: 'bot_2', nickname: '聪聪猴', avatarId: 'avatar_fox', points: 780 },
  { id: 'bot_3', nickname: '胖胖熊猫', avatarId: 'avatar_panda', points: 650 },
  { id: 'bot_4', nickname: '萌萌小星人', avatarId: 'avatar_robot', points: 480 },
  { id: 'bot_5', nickname: '皮皮狐', avatarId: 'avatar_fox', points: 300 },
];

export const INITIAL_CHECKIN_STATE: CheckInState = {
  lastCheckInDate: null,
  streak: 0,
  checkedInToday: false,
  unlockedItems: [],
};

// Daily stick rewards for 7-day pattern
export const DAILY_REWARDS = [
  { day: 1, points: 20, item: '糖果', count: 1, foodId: 'candy', icon: '🍬' },
  { day: 2, points: 30, item: '苹果', count: 1, foodId: 'apple', icon: '🍎' },
  { day: 3, points: 40, item: '饼干', count: 1, foodId: 'biscuit', icon: '🍪' },
  { day: 4, points: 50, item: '甜甜圈', count: 1, foodId: 'donut', icon: '🍩' },
  { day: 5, points: 60, item: '冰淇淋', count: 1, foodId: 'icecream', icon: '🍦' },
  { day: 6, points: 80, item: '超级糖果豪华篮', count: 2, foodId: 'candy', icon: '🍬' },
  { day: 7, points: 120, item: '终极彩虹马卡龙', count: 2, foodId: 'donut', icon: '🍩' },
];

export function getGameState() {
  const profileStr = localStorage.getItem('kid_games_profile');
  const achievementsStr = localStorage.getItem('kid_games_achievements');
  const checkInStr = localStorage.getItem('kid_games_checkin');
  const leaderboardStr = localStorage.getItem('kid_games_leaderboard');

  let profile = profileStr ? JSON.parse(profileStr) as UserProfile : INITIAL_PROFILE;
  let achievements = achievementsStr ? JSON.parse(achievementsStr) as Achievement[] : INITIAL_ACHIEVEMENTS;
  let checkIn = checkInStr ? JSON.parse(checkInStr) as CheckInState : INITIAL_CHECKIN_STATE;
  let leaderboard = leaderboardStr ? JSON.parse(leaderboardStr) as LeaderboardItem[] : INITIAL_LEADERBOARD;

  // Sanitize achievements with tier structures
  achievements = achievements.map(ach => ({
    ...ach,
    tier: ach.tier || 1,
    rewardsClaimed: ach.rewardsClaimed === undefined ? false : ach.rewardsClaimed
  }));

  // Add user to leaderboard dynamically if not present
  const userInLeaderboard = leaderboard.find(item => item.id === profile.id);
  if (!userInLeaderboard) {
    leaderboard.push({
      id: profile.id,
      nickname: profile.nickname,
      avatarId: profile.avatarId,
      points: profile.points,
      isCurrentUser: true
    });
  } else {
    // Update existing
    userInLeaderboard.points = profile.points;
    userInLeaderboard.nickname = profile.nickname;
    userInLeaderboard.avatarId = profile.avatarId;
  }
  
  // Sort leaderboard
  leaderboard.sort((a,b) => b.points - a.points);

  // Check checkin today
  const todayStr = new Date().toISOString().split('T')[0];
  if (checkIn.lastCheckInDate === todayStr) {
    checkIn.checkedInToday = true;
  } else {
    checkIn.checkedInToday = false;
  }

  return { profile, achievements, checkIn, leaderboard };
}

export function saveGameState(
  profile: UserProfile,
  achievements: Achievement[],
  checkIn: CheckInState,
  leaderboard: LeaderboardItem[]
) {
  // Sync user in leaderboard
  const userInLd = leaderboard.find(item => item.id === profile.id);
  if (userInLd) {
    userInLd.points = profile.points;
    userInLd.nickname = profile.nickname;
    userInLd.avatarId = profile.avatarId;
  } else {
    leaderboard.push({
      id: profile.id,
      nickname: profile.nickname,
      avatarId: profile.avatarId,
      points: profile.points,
      isCurrentUser: true
    });
  }
  leaderboard.sort((a,b) => b.points - a.points);

  localStorage.setItem('kid_games_profile', JSON.stringify(profile));
  localStorage.setItem('kid_games_achievements', JSON.stringify(achievements));
  localStorage.setItem('kid_games_checkin', JSON.stringify(checkIn));
  localStorage.setItem('kid_games_leaderboard', JSON.stringify(leaderboard));
}

// Check newly unlocked achievements
export function checkAchievements(
  profile: UserProfile,
  achievements: Achievement[],
  checkIn?: CheckInState
): { updatedAchievements: Achievement[]; newlyUnlocked: Achievement[] } {
  const newlyUnlocked: Achievement[] = [];
  const updated = achievements.map(ach => {
    // If already unlocked at this tier, wait for user to claim reward to level up
    if (ach.unlocked) return ach;

    const tierLevel = ach.tier || 1;
    const tierConfig = getAchievementTierConfig(ach.id, tierLevel);
    
    // Dynamically align current target with current tier
    const targetValue = tierConfig.targetValue;
    ach.targetValue = targetValue;

    let progressVal = 0;
    let isCompleted = false;

    switch (ach.id) {
      case 'ach_checkin_1':
        progressVal = checkIn ? checkIn.unlockedItems.length : ach.progress;
        isCompleted = progressVal >= targetValue;
        break;
      case 'ach_checkin_3':
        progressVal = checkIn ? checkIn.streak : ach.progress;
        isCompleted = progressVal >= targetValue;
        break;
      case 'ach_bomb_1':
        progressVal = profile.records.bombExplodes;
        isCompleted = progressVal >= targetValue;
        break;
      case 'ach_bomb_3':
        progressVal = profile.records.bombClears;
        isCompleted = progressVal >= targetValue;
        break;
      case 'ach_klotski_1':
        // Lower is better. Best record under 9999.
        progressVal = profile.records.klotskiBestMoves3x3;
        isCompleted = progressVal > 0 && progressVal <= targetValue;
        break;
      case 'ach_schulte_1':
        // Lower is better. Best record under 9999.
        progressVal = profile.records.schulteBest3x3;
        isCompleted = progressVal > 0 && progressVal <= targetValue;
        break;
      case 'ach_schulte_speed':
        // Lower is better. Best record under 9999.
        progressVal = profile.records.schulteBest4x4;
        isCompleted = progressVal > 0 && progressVal <= targetValue;
        break;
      case 'ach_gomoku_1':
        progressVal = profile.records.gomokuWins;
        isCompleted = progressVal >= targetValue;
        break;
      case 'ach_feed_5':
        // Manual increment from component, use current saved progress
        progressVal = ach.progress;
        isCompleted = progressVal >= targetValue;
        break;
      case 'ach_happy_dino':
        progressVal = profile.feedHappiness;
        isCompleted = progressVal >= targetValue;
        break;
      default:
        progressVal = ach.progress;
        isCompleted = progressVal >= targetValue;
    }

    ach.progress = progressVal;

    if (isCompleted && !ach.unlocked) {
      newlyUnlocked.push({ 
        ...ach, 
        unlocked: true, 
        unlockedAt: new Date().toLocaleDateString() 
      });
      return {
        ...ach,
        unlocked: true,
        unlockedAt: new Date().toLocaleDateString()
      };
    }
    return ach;
  });

  return { updatedAchievements: updated, newlyUnlocked };
}
