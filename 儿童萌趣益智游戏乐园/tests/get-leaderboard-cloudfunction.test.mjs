import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const {
  getLeaderboard,
  normalizeLimit,
} = require('../cloudfunctions/getLeaderboard/index.cjs');

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function createRepositories(seed = {}) {
  const users = (seed.users || []).map(row => clone(row));
  const stats = (seed.userStats || []).map(row => clone(row));

  return {
    users: {
      rows: users,
      async findByOpenid(openid) {
        return users.find(row => row._openid === openid) || null;
      },
      async findByIds(ids) {
        const allowed = new Set(ids);
        return users.reduce((next, user) => {
          if (allowed.has(user._id)) next[user._id] = clone(user);
          return next;
        }, {});
      },
    },
    userStats: {
      rows: stats,
      async findTopByPoints(limit) {
        return stats
          .slice()
          .sort((a, b) => b.pointsBalance - a.pointsBalance)
          .slice(0, limit)
          .map(row => clone(row));
      },
    },
  };
}

describe('getLeaderboard cloud function core', () => {
  it('returns public leaderboard rows sorted by server-side points', async () => {
    const result = await getLeaderboard({
      openid: 'openid_current',
      repositories: createRepositories({
        users: [
          {
            _id: 'user_current',
            _openid: 'openid_current',
            nickname: 'Kid',
            avatarId: 'avatar_fox',
          },
          {
            _id: 'user_top',
            _openid: 'openid_top',
            nickname: 'Top',
            avatarId: 'avatar_rabbit',
          },
          {
            _id: 'user_low',
            _openid: 'openid_low',
            nickname: 'Low',
            avatarId: 'avatar_dino',
          },
        ],
        userStats: [
          {
            _id: 'stats_current',
            userId: 'user_current',
            _openid: 'openid_current',
            pointsBalance: 450,
          },
          {
            _id: 'stats_top',
            userId: 'user_top',
            _openid: 'openid_top',
            pointsBalance: 920,
          },
          {
            _id: 'stats_low',
            userId: 'user_low',
            _openid: 'openid_low',
            pointsBalance: 120,
          },
        ],
      }),
      limit: 10,
      profile: {
        id: 'user_current',
        points: 99999,
      },
      localFallback: [
        {
          id: 'fake',
          nickname: 'Fake',
          avatarId: 'avatar_robot',
          points: 99999,
        },
      ],
    });

    assert.deepEqual(result.leaderboard, [
      {
        id: 'user_top',
        nickname: 'Top',
        avatarId: 'avatar_rabbit',
        points: 920,
        isCurrentUser: false,
      },
      {
        id: 'user_current',
        nickname: 'Kid',
        avatarId: 'avatar_fox',
        points: 450,
        isCurrentUser: true,
      },
      {
        id: 'user_low',
        nickname: 'Low',
        avatarId: 'avatar_dino',
        points: 120,
        isCurrentUser: false,
      },
    ]);
    assert.equal('_openid' in result.leaderboard[0], false);
  });

  it('caps and normalizes requested limits on the server', async () => {
    assert.equal(normalizeLimit(undefined), 50);
    assert.equal(normalizeLimit('2'), 2);
    assert.equal(normalizeLimit(500), 100);
    assert.equal(normalizeLimit(-1), 50);
    assert.equal(normalizeLimit('bad'), 50);

    const repositories = createRepositories({
      users: [
        { _id: 'user_current', _openid: 'openid_current', nickname: 'Kid', avatarId: 'avatar_fox' },
        { _id: 'user_a', _openid: 'openid_a', nickname: 'A', avatarId: 'avatar_dino' },
        { _id: 'user_b', _openid: 'openid_b', nickname: 'B', avatarId: 'avatar_rabbit' },
      ],
      userStats: [
        { _id: 'stats_current', userId: 'user_current', pointsBalance: 300 },
        { _id: 'stats_a', userId: 'user_a', pointsBalance: 200 },
        { _id: 'stats_b', userId: 'user_b', pointsBalance: 100 },
      ],
    });

    const result = await getLeaderboard({
      openid: 'openid_current',
      repositories,
      limit: 2,
    });

    assert.deepEqual(result.leaderboard.map(row => row.id), ['user_current', 'user_a']);
  });

  it('rejects calls without a trusted WeChat openid', async () => {
    await assert.rejects(
      () => getLeaderboard({
        openid: '',
        repositories: createRepositories(),
      }),
      error => {
        assert.equal(error.code, 'UNAUTHENTICATED');
        assert.match(error.message, /openid/);
        return true;
      },
    );
  });

  it('requires loginOrCreateUser to create the current user first', async () => {
    await assert.rejects(
      () => getLeaderboard({
        openid: 'openid_missing',
        repositories: createRepositories(),
      }),
      error => {
        assert.equal(error.code, 'USER_NOT_FOUND');
        assert.match(error.message, /loginOrCreateUser/);
        return true;
      },
    );
  });
});
