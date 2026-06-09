const { DEFAULT_RECORDS } = require('../loginOrCreateUser/index.cjs');

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

function getIsoNow(now = new Date()) {
  return now instanceof Date ? now.toISOString() : new Date(now).toISOString();
}

function sanitizeRecords(records = {}) {
  return Object.keys(DEFAULT_RECORDS).reduce((next, key) => {
    const value = records[key];
    next[key] = typeof value === 'number' && Number.isFinite(value) ? value : DEFAULT_RECORDS[key];
    return next;
  }, {});
}

function sanitizeProfile(profile) {
  if (!profile || typeof profile !== 'object') {
    throwCodedError('INVALID_STATE', 'Missing profile payload.');
  }

  return {
    id: profile.id,
    nickname: String(profile.nickname || '').slice(0, 40),
    avatarId: String(profile.avatarId || 'avatar_dino').slice(0, 40),
    points: Math.max(0, Math.floor(Number(profile.points || 0))),
    feedHappiness: Math.max(0, Math.min(100, Math.floor(Number(profile.feedHappiness || 0)))),
    inventory: sanitizeInventory(profile.inventory),
    records: sanitizeRecords(profile.records),
  };
}

function sanitizeInventory(inventory = {}) {
  if (!inventory || typeof inventory !== 'object') return {};

  return Object.entries(inventory).reduce((next, [itemName, count]) => {
    const safeName = String(itemName).slice(0, 40);
    const safeCount = Math.max(0, Math.floor(Number(count || 0)));
    if (safeName && safeCount > 0) next[safeName] = safeCount;
    return next;
  }, {});
}

function sanitizeAchievements(achievements = []) {
  if (!Array.isArray(achievements)) return [];

  return achievements
    .filter(item => item && typeof item === 'object' && item.id)
    .map(item => ({
      achievementId: String(item.id).slice(0, 80),
      tier: Math.max(1, Math.floor(Number(item.tier || 1))),
      progress: Math.max(0, Number(item.progress || 0)),
      unlocked: Boolean(item.unlocked),
      unlockedAt: item.unlockedAt ? String(item.unlockedAt).slice(0, 40) : undefined,
      rewardsClaimed: Boolean(item.rewardsClaimed),
      targetValue: Math.max(1, Number(item.targetValue || 1)),
    }));
}

function sanitizeCheckIn(checkIn = {}) {
  return {
    lastCheckInDate: checkIn.lastCheckInDate ? String(checkIn.lastCheckInDate).slice(0, 10) : null,
    streak: Math.max(0, Math.floor(Number(checkIn.streak || 0))),
    unlockedItems: Array.isArray(checkIn.unlockedItems)
      ? checkIn.unlockedItems.map(item => String(item).slice(0, 40)).filter(Boolean)
      : [],
  };
}

function buildResponse(profile, achievements, checkIn) {
  return {
    profile,
    achievements: achievements.map(item => ({
      id: item.achievementId,
      tier: item.tier,
      progress: item.progress,
      unlocked: item.unlocked,
      unlockedAt: item.unlockedAt,
      rewardsClaimed: item.rewardsClaimed,
      targetValue: item.targetValue,
    })),
    checkIn: {
      ...checkIn,
      checkedInToday: false,
    },
    leaderboard: [],
  };
}

async function saveGameState({ openid, repositories, state, now = new Date() }) {
  assertOpenid(openid);
  if (!state || typeof state !== 'object') throwCodedError('INVALID_STATE', 'Missing game state payload.');

  const user = await repositories.users.findByOpenid(openid);
  if (!user) throwCodedError('USER_NOT_FOUND', 'Current user does not exist. Call loginOrCreateUser first.');

  const profile = sanitizeProfile(state.profile);
  if (profile.id !== user._id) {
    throwCodedError('FORBIDDEN_USER_MISMATCH', 'Client profile id does not match the current user.');
  }

  const nowIso = getIsoNow(now);
  const achievements = sanitizeAchievements(state.achievements);
  const checkIn = sanitizeCheckIn(state.checkIn);

  await repositories.users.update(user._id, {
    nickname: profile.nickname,
    avatarId: profile.avatarId,
    updatedAt: nowIso,
  });
  await repositories.userStats.upsertForUser(user._id, openid, {
    pointsBalance: profile.points,
    feedHappiness: profile.feedHappiness,
    records: profile.records,
    checkInStreak: checkIn.streak,
    lastCheckInDate: checkIn.lastCheckInDate,
    updatedAt: nowIso,
  });
  await repositories.achievements.replaceForUser(user._id, openid, achievements, nowIso);
  await repositories.inventoryItems.replaceForUser(user._id, openid, profile.inventory, nowIso);
  await repositories.checkins.upsertForUser(user._id, openid, {
    ...checkIn,
    updatedAt: nowIso,
  });

  return buildResponse(profile, achievements, checkIn);
}

function createCollectionRepository(db, collectionName) {
  const collection = db.collection(collectionName);

  return {
    collection,
    async findByOpenid(openid) {
      const result = await collection.where({ _openid: openid }).limit(1).get();
      return result.data[0] || null;
    },
    async findAllByUserId(userId) {
      const result = await collection.where({ userId }).get();
      return result.data || [];
    },
    async update(id, data) {
      await collection.doc(id).update({ data });
    },
    async add(data) {
      await collection.add({ data });
    },
  };
}

async function removeRows(repository, rows) {
  for (const row of rows) {
    await repository.collection.doc(row._id).remove();
  }
}

function createDatabaseRepositories(db) {
  const users = createCollectionRepository(db, 'users');
  const userStats = createCollectionRepository(db, 'user_stats');
  const achievements = createCollectionRepository(db, 'achievements');
  const inventoryItems = createCollectionRepository(db, 'inventory_items');
  const checkins = createCollectionRepository(db, 'checkins');

  return {
    users,
    userStats: {
      ...userStats,
      async upsertForUser(userId, openid, data) {
        const existing = await userStats.findByOpenid(openid);
        if (existing) {
          await userStats.update(existing._id, data);
          return;
        }
        await userStats.add({
          userId,
          _openid: openid,
          ...data,
          createdAt: data.updatedAt,
        });
      },
    },
    achievements: {
      async replaceForUser(userId, openid, rows, nowIso) {
        await removeRows(achievements, await achievements.findAllByUserId(userId));
        for (const row of rows) {
          await achievements.add({
            userId,
            _openid: openid,
            ...row,
            createdAt: nowIso,
            updatedAt: nowIso,
          });
        }
      },
    },
    inventoryItems: {
      async replaceForUser(userId, openid, inventory, nowIso) {
        await removeRows(inventoryItems, await inventoryItems.findAllByUserId(userId));
        for (const [itemName, count] of Object.entries(inventory)) {
          await inventoryItems.add({
            userId,
            _openid: openid,
            itemName,
            count,
            createdAt: nowIso,
            updatedAt: nowIso,
          });
        }
      },
    },
    checkins: {
      async upsertForUser(userId, openid, data) {
        const existing = await checkins.findByOpenid(openid);
        if (existing) {
          await checkins.update(existing._id, data);
          return;
        }
        await checkins.add({
          userId,
          _openid: openid,
          ...data,
          createdAt: data.updatedAt,
        });
      },
    },
  };
}

exports.saveGameState = saveGameState;
exports.createDatabaseRepositories = createDatabaseRepositories;
exports.sanitizeProfile = sanitizeProfile;
exports.sanitizeAchievements = sanitizeAchievements;
exports.sanitizeCheckIn = sanitizeCheckIn;

exports.main = async function main(event = {}) {
  const cloud = require('wx-server-sdk');
  cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

  const { OPENID } = cloud.getWXContext();
  return saveGameState({
    openid: OPENID,
    repositories: createDatabaseRepositories(cloud.database()),
    state: event.state,
  });
};
