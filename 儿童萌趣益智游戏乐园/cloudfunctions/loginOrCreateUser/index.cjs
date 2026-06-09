const DEFAULT_PROFILE = {
  nickname: 'Smart Explorer',
  avatarId: 'avatar_dino',
  points: 100,
  feedHappiness: 50,
};

const DEFAULT_RECORDS = {
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

const DEFAULT_INVENTORY = {
  candy: 1,
  apple: 2,
  biscuit: 1,
};

const DEFAULT_ACHIEVEMENTS = [
  'ach_checkin_1',
  'ach_checkin_3',
  'ach_bomb_1',
  'ach_bomb_3',
  'ach_klotski_1',
  'ach_schulte_1',
  'ach_schulte_speed',
  'ach_gomoku_1',
  'ach_feed_5',
  'ach_happy_dino',
];

function getIsoNow(now = new Date()) {
  return now instanceof Date ? now.toISOString() : new Date(now).toISOString();
}

function assertOpenid(openid) {
  if (!openid || typeof openid !== 'string') {
    const error = new Error('Missing WeChat openid');
    error.code = 'UNAUTHENTICATED';
    throw error;
  }
}

function buildProfile(user, stats, inventoryItems) {
  const inventory = inventoryItems.reduce((next, item) => {
    next[item.itemName] = item.count;
    return next;
  }, {});

  return {
    id: user._id,
    nickname: user.nickname,
    avatarId: user.avatarId,
    points: stats.pointsBalance,
    feedHappiness: stats.feedHappiness,
    inventory,
    records: stats.records,
  };
}

async function ensureStats(repositories, user, openid, nowIso) {
  const existingStats = await repositories.userStats.findByOpenid(openid);
  if (existingStats) return existingStats;

  return repositories.userStats.create({
    userId: user._id,
    _openid: openid,
    pointsBalance: DEFAULT_PROFILE.points,
    feedHappiness: DEFAULT_PROFILE.feedHappiness,
    records: { ...DEFAULT_RECORDS },
    checkInStreak: 0,
    lastCheckInDate: null,
    createdAt: nowIso,
    updatedAt: nowIso,
  });
}

async function ensureInventory(repositories, user, openid, nowIso) {
  const existingItems = await repositories.inventoryItems.findByOpenid(openid);
  if (existingItems.length > 0) return existingItems;

  const createdItems = [];
  for (const [itemName, count] of Object.entries(DEFAULT_INVENTORY)) {
    createdItems.push(await repositories.inventoryItems.create({
      userId: user._id,
      _openid: openid,
      itemName,
      count,
      createdAt: nowIso,
      updatedAt: nowIso,
    }));
  }

  return createdItems;
}

async function ensureAchievements(repositories, user, openid, nowIso) {
  const existingAchievements = await repositories.achievements.findByOpenid(openid);
  if (existingAchievements.length > 0) return existingAchievements;

  return Promise.all(DEFAULT_ACHIEVEMENTS.map(achievementId => repositories.achievements.create({
    userId: user._id,
    _openid: openid,
    achievementId,
    tier: 1,
    progress: 0,
    unlocked: false,
    rewardsClaimed: false,
    createdAt: nowIso,
    updatedAt: nowIso,
  })));
}

async function loginOrCreateUser({ openid, repositories, now = new Date() }) {
  assertOpenid(openid);
  const nowIso = getIsoNow(now);
  const existingUser = await repositories.users.findByOpenid(openid);

  if (existingUser) {
    await repositories.users.update(existingUser._id, {
      lastLoginAt: nowIso,
      updatedAt: nowIso,
    });

    const stats = await ensureStats(repositories, existingUser, openid, nowIso);
    const inventoryItems = await ensureInventory(repositories, existingUser, openid, nowIso);
    await ensureAchievements(repositories, existingUser, openid, nowIso);

    return {
      userId: existingUser._id,
      isNewUser: false,
      profile: buildProfile(existingUser, stats, inventoryItems),
    };
  }

  const user = await repositories.users.create({
    _openid: openid,
    nickname: DEFAULT_PROFILE.nickname,
    avatarId: DEFAULT_PROFILE.avatarId,
    status: 'active',
    createdAt: nowIso,
    updatedAt: nowIso,
    lastLoginAt: nowIso,
  });
  const stats = await ensureStats(repositories, user, openid, nowIso);
  const inventoryItems = await ensureInventory(repositories, user, openid, nowIso);
  await ensureAchievements(repositories, user, openid, nowIso);

  return {
    userId: user._id,
    isNewUser: true,
    profile: buildProfile(user, stats, inventoryItems),
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

    async create(data) {
      const result = await collection.add({ data });
      return {
        _id: result._id,
        ...data,
      };
    },

    async update(id, data) {
      await collection.doc(id).update({ data });
      return {
        _id: id,
        ...data,
      };
    },
  };
}

function createDatabaseRepositories(db) {
  const users = createCollectionRepository(db, 'users');
  const userStats = createCollectionRepository(db, 'user_stats');
  const achievements = createCollectionRepository(db, 'achievements');
  const inventoryItemsCollection = createCollectionRepository(db, 'inventory_items');

  return {
    users,
    userStats,
    achievements: {
      ...achievements,
      findByOpenid: achievements.findAllByOpenid,
    },
    inventoryItems: {
      ...inventoryItemsCollection,
      findByOpenid: inventoryItemsCollection.findAllByOpenid,
    },
  };
}

exports.loginOrCreateUser = loginOrCreateUser;
exports.createDatabaseRepositories = createDatabaseRepositories;
exports.DEFAULT_RECORDS = DEFAULT_RECORDS;
exports.DEFAULT_INVENTORY = DEFAULT_INVENTORY;
exports.DEFAULT_ACHIEVEMENTS = DEFAULT_ACHIEVEMENTS;

exports.main = async function main() {
  const cloud = require('wx-server-sdk');
  cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

  const { OPENID } = cloud.getWXContext();
  return loginOrCreateUser({
    openid: OPENID,
    repositories: createDatabaseRepositories(cloud.database()),
  });
};
