const { DEFAULT_RECORDS } = require('../loginOrCreateUser/index.cjs');

const ACHIEVEMENT_METADATA = {
  ach_checkin_1: {
    title: 'First Check-in',
    description: 'Complete the first daily check-in.',
    icon: 'Compass',
    color: 'bg-indigo-100 text-indigo-600',
    type: 'checkin',
    targetValue: 1,
  },
  ach_checkin_3: {
    title: 'Check-in Streak',
    description: 'Reach a three-day check-in streak.',
    icon: 'Calendar',
    color: 'bg-sky-100 text-sky-600',
    type: 'checkin',
    targetValue: 3,
  },
  ach_bomb_1: {
    title: 'Bomb Apprentice',
    description: 'Try the number bomb game once.',
    icon: 'Flame',
    color: 'bg-orange-100 text-orange-600',
    type: 'bomb',
    targetValue: 1,
  },
  ach_bomb_3: {
    title: 'Mine Sweeper',
    description: 'Clear three number bombs.',
    icon: 'ShieldAlert',
    color: 'bg-yellow-100 text-yellow-600',
    type: 'bomb',
    targetValue: 3,
  },
  ach_klotski_1: {
    title: 'Puzzle Mover',
    description: 'Complete a 3x3 klotski puzzle.',
    icon: 'Shapes',
    color: 'bg-emerald-100 text-emerald-600',
    type: 'klotski',
    targetValue: 1,
  },
  ach_schulte_1: {
    title: 'Focus Starter',
    description: 'Complete a 3x3 Schulte grid.',
    icon: 'Zap',
    color: 'bg-amber-100 text-amber-600',
    type: 'schulte',
    targetValue: 1,
  },
  ach_schulte_speed: {
    title: 'Fast Eyes',
    description: 'Finish a Schulte challenge quickly.',
    icon: 'Shuffle',
    color: 'bg-rose-100 text-rose-600',
    type: 'schulte',
    targetValue: 15,
  },
  ach_gomoku_1: {
    title: 'Gomoku Winner',
    description: 'Win a Gomoku game.',
    icon: 'Award',
    color: 'bg-teal-100 text-teal-600',
    type: 'gomoku',
    targetValue: 1,
  },
  ach_feed_5: {
    title: 'Snack Helper',
    description: 'Feed the companion five times.',
    icon: 'Cookie',
    color: 'bg-pink-100 text-pink-600',
    type: 'interaction',
    targetValue: 5,
  },
  ach_happy_dino: {
    title: 'Happy Companion',
    description: 'Raise companion happiness above 80.',
    icon: 'Heart',
    color: 'bg-purple-100 text-purple-600',
    type: 'interaction',
    targetValue: 80,
  },
};

function assertOpenid(openid) {
  if (!openid || typeof openid !== 'string') {
    const error = new Error('Missing WeChat openid');
    error.code = 'UNAUTHENTICATED';
    throw error;
  }
}

function throwCodedError(code, message) {
  const error = new Error(message);
  error.code = code;
  throw error;
}

function toDateString(now = new Date()) {
  if (typeof now === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(now)) return now;
  return (now instanceof Date ? now : new Date(now)).toISOString().slice(0, 10);
}

function buildInventory(inventoryItems) {
  return inventoryItems.reduce((next, item) => {
    next[item.itemName] = item.count;
    return next;
  }, {});
}

function buildProfile(user, stats, inventoryItems) {
  return {
    id: user._id,
    nickname: user.nickname,
    avatarId: user.avatarId,
    points: stats.pointsBalance,
    feedHappiness: stats.feedHappiness,
    inventory: buildInventory(inventoryItems),
    records: {
      ...DEFAULT_RECORDS,
      ...(stats.records || {}),
    },
  };
}

function buildAchievements(achievementRows) {
  return achievementRows.map(row => {
    const metadata = ACHIEVEMENT_METADATA[row.achievementId] || {
      title: row.achievementId,
      description: '',
      icon: 'Award',
      color: 'bg-slate-100 text-slate-600',
      type: 'general',
      targetValue: row.targetValue || 1,
    };

    return {
      id: row.achievementId,
      ...metadata,
      targetValue: row.targetValue || metadata.targetValue,
      unlocked: Boolean(row.unlocked),
      unlockedAt: row.unlockedAt,
      progress: row.progress || 0,
      tier: row.tier || 1,
      rewardsClaimed: row.rewardsClaimed === undefined ? false : Boolean(row.rewardsClaimed),
    };
  });
}

function buildCheckIn(stats, checkInRow, today) {
  const lastCheckInDate = checkInRow?.lastCheckInDate ?? stats.lastCheckInDate ?? null;

  return {
    lastCheckInDate,
    streak: checkInRow?.streak ?? stats.checkInStreak ?? 0,
    checkedInToday: lastCheckInDate === today,
    unlockedItems: checkInRow?.unlockedItems || [],
  };
}

function buildLeaderboard(profile, leaderboardRows) {
  const publicRows = leaderboardRows.map(row => ({
    id: row.userId || row._id,
    nickname: row.nickname,
    avatarId: row.avatarId,
    points: row.points,
    isCurrentUser: (row.userId || row._id) === profile.id,
  }));
  const current = publicRows.find(row => row.id === profile.id);

  if (current) {
    current.nickname = profile.nickname;
    current.avatarId = profile.avatarId;
    current.points = profile.points;
    current.isCurrentUser = true;
  } else {
    publicRows.push({
      id: profile.id,
      nickname: profile.nickname,
      avatarId: profile.avatarId,
      points: profile.points,
      isCurrentUser: true,
    });
  }

  return publicRows.sort((a, b) => b.points - a.points);
}

async function getHomeState({ openid, repositories, today = new Date() }) {
  assertOpenid(openid);

  const user = await repositories.users.findByOpenid(openid);
  if (!user) throwCodedError('USER_NOT_FOUND', 'Current user does not exist. Call loginOrCreateUser first.');

  const stats = await repositories.userStats.findByOpenid(openid);
  if (!stats) throwCodedError('STATE_NOT_FOUND', 'Current user stats do not exist. Call loginOrCreateUser first.');

  const [achievementRows, inventoryItems, checkInRow, leaderboardRows] = await Promise.all([
    repositories.achievements.findByOpenid(openid),
    repositories.inventoryItems.findByOpenid(openid),
    repositories.checkins.findByOpenid(openid),
    repositories.leaderboard.findPublic(),
  ]);
  const profile = buildProfile(user, stats, inventoryItems);

  return {
    profile,
    achievements: buildAchievements(achievementRows),
    checkIn: buildCheckIn(stats, checkInRow, toDateString(today)),
    leaderboard: buildLeaderboard(profile, leaderboardRows),
  };
}

function createCollectionRepository(db, collectionName) {
  const collection = db.collection(collectionName);

  return {
    async findByOpenid(openid) {
      const result = await collection.where({ _openid: openid }).limit(1).get();
      return result.data[0] || null;
    },

    async findAllByOpenid(openid) {
      const result = await collection.where({ _openid: openid }).get();
      return result.data || [];
    },
  };
}

function createDatabaseRepositories(db) {
  const users = createCollectionRepository(db, 'users');
  const userStats = createCollectionRepository(db, 'user_stats');
  const achievementsCollection = createCollectionRepository(db, 'achievements');
  const inventoryItemsCollection = createCollectionRepository(db, 'inventory_items');
  const checkins = createCollectionRepository(db, 'checkins');

  return {
    users,
    userStats,
    achievements: {
      ...achievementsCollection,
      findByOpenid: achievementsCollection.findAllByOpenid,
    },
    inventoryItems: {
      ...inventoryItemsCollection,
      findByOpenid: inventoryItemsCollection.findAllByOpenid,
    },
    checkins,
    leaderboard: {
      async findPublic() {
        const result = await db.collection('leaderboard_snapshots')
          .orderBy('points', 'desc')
          .limit(20)
          .get();
        return result.data || [];
      },
    },
  };
}

exports.getHomeState = getHomeState;
exports.createDatabaseRepositories = createDatabaseRepositories;
exports.ACHIEVEMENT_METADATA = ACHIEVEMENT_METADATA;

exports.main = async function main() {
  const cloud = require('wx-server-sdk');
  cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

  const { OPENID } = cloud.getWXContext();
  return getHomeState({
    openid: OPENID,
    repositories: createDatabaseRepositories(cloud.database()),
  });
};
