const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 100;

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

function normalizeLimit(limit) {
  const parsed = Number(limit ?? DEFAULT_LIMIT);
  if (!Number.isFinite(parsed) || parsed <= 0) return DEFAULT_LIMIT;
  return Math.min(Math.floor(parsed), MAX_LIMIT);
}

function toPoints(row) {
  return Number(row.pointsBalance ?? row.points ?? 0);
}

async function getLeaderboard({ openid, repositories, limit = DEFAULT_LIMIT }) {
  assertOpenid(openid);

  const currentUser = await repositories.users.findByOpenid(openid);
  if (!currentUser) throwCodedError('USER_NOT_FOUND', 'Current user does not exist. Call loginOrCreateUser first.');

  const safeLimit = normalizeLimit(limit);
  const statsRows = await repositories.userStats.findTopByPoints(safeLimit);
  const usersById = await repositories.users.findByIds(statsRows.map(row => row.userId));

  const leaderboard = statsRows
    .map(row => {
      const user = usersById[row.userId];
      if (!user) return null;

      return {
        id: user._id,
        nickname: user.nickname,
        avatarId: user.avatarId,
        points: toPoints(row),
        isCurrentUser: user._id === currentUser._id,
      };
    })
    .filter(Boolean)
    .sort((a, b) => b.points - a.points);

  return { leaderboard };
}

function createDatabaseRepositories(db) {
  const command = db.command;
  const usersCollection = db.collection('users');
  const statsCollection = db.collection('user_stats');

  return {
    users: {
      async findByOpenid(openid) {
        const result = await usersCollection.where({ _openid: openid }).limit(1).get();
        return result.data[0] || null;
      },

      async findByIds(ids) {
        if (!ids.length) return {};
        const result = await usersCollection.where({ _id: command.in(ids) }).get();
        return (result.data || []).reduce((next, user) => {
          next[user._id] = user;
          return next;
        }, {});
      },
    },

    userStats: {
      async findTopByPoints(limit) {
        const result = await statsCollection
          .orderBy('pointsBalance', 'desc')
          .limit(limit)
          .get();
        return result.data || [];
      },
    },
  };
}

exports.getLeaderboard = getLeaderboard;
exports.createDatabaseRepositories = createDatabaseRepositories;
exports.normalizeLimit = normalizeLimit;

exports.main = async function main(event = {}) {
  const cloud = require('wx-server-sdk');
  cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

  const { OPENID } = cloud.getWXContext();
  return getLeaderboard({
    openid: OPENID,
    repositories: createDatabaseRepositories(cloud.database()),
    limit: event.limit,
  });
};
