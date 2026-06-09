import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const {
  ACHIEVEMENT_METADATA,
  getHomeState,
} = require('../cloudfunctions/getHomeState/index.cjs');
const { DEFAULT_RECORDS } = require('../cloudfunctions/loginOrCreateUser/index.cjs');

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function createSingleRepo(seed = []) {
  const rows = seed.map(row => clone(row));

  return {
    rows,
    async findByOpenid(openid) {
      return rows.find(row => row._openid === openid) || null;
    },
  };
}

function createListRepo(seed = []) {
  const rows = seed.map(row => clone(row));

  return {
    rows,
    async findByOpenid(openid) {
      return rows.filter(row => row._openid === openid);
    },
  };
}

function createRepositories(seed = {}) {
  return {
    users: createSingleRepo(seed.users),
    userStats: createSingleRepo(seed.userStats),
    achievements: createListRepo(seed.achievements),
    inventoryItems: createListRepo(seed.inventoryItems),
    checkins: createSingleRepo(seed.checkins),
    leaderboard: {
      rows: seed.leaderboard || [],
      async findPublic() {
        return this.rows.map(row => clone(row));
      },
    },
  };
}

describe('getHomeState cloud function core', () => {
  it('returns the frontend GameState shape for the current user', async () => {
    const repositories = createRepositories({
      users: [
        {
          _id: 'user_current',
          _openid: 'openid_current',
          nickname: 'Kid',
          avatarId: 'avatar_fox',
        },
      ],
      userStats: [
        {
          _id: 'stats_current',
          userId: 'user_current',
          _openid: 'openid_current',
          pointsBalance: 450,
          feedHappiness: 76,
          records: {
            ...DEFAULT_RECORDS,
            bombClears: 3,
            gomokuWins: 2,
          },
          checkInStreak: 4,
          lastCheckInDate: '2026-06-10',
        },
      ],
      achievements: [
        {
          _id: 'ach_current',
          userId: 'user_current',
          _openid: 'openid_current',
          achievementId: 'ach_bomb_3',
          tier: 2,
          progress: 3,
          unlocked: true,
          unlockedAt: '2026-06-10',
          rewardsClaimed: false,
        },
      ],
      inventoryItems: [
        {
          _id: 'item_candy',
          userId: 'user_current',
          _openid: 'openid_current',
          itemName: 'candy',
          count: 2,
        },
        {
          _id: 'item_apple',
          userId: 'user_current',
          _openid: 'openid_current',
          itemName: 'apple',
          count: 1,
        },
      ],
      checkins: [
        {
          _id: 'checkin_current',
          userId: 'user_current',
          _openid: 'openid_current',
          lastCheckInDate: '2026-06-10',
          streak: 4,
          unlockedItems: ['candy', 'apple'],
        },
      ],
      leaderboard: [
        {
          _id: 'rank_other',
          userId: 'user_other',
          nickname: 'Other',
          avatarId: 'avatar_rabbit',
          points: 800,
        },
        {
          _id: 'rank_current',
          userId: 'user_current',
          nickname: 'Stale',
          avatarId: 'avatar_dino',
          points: 1,
        },
      ],
    });

    const state = await getHomeState({
      openid: 'openid_current',
      repositories,
      today: '2026-06-10',
    });

    assert.deepEqual(state.profile, {
      id: 'user_current',
      nickname: 'Kid',
      avatarId: 'avatar_fox',
      points: 450,
      feedHappiness: 76,
      inventory: {
        candy: 2,
        apple: 1,
      },
      records: {
        ...DEFAULT_RECORDS,
        bombClears: 3,
        gomokuWins: 2,
      },
    });
    assert.equal('_openid' in state.profile, false);
    assert.deepEqual(state.checkIn, {
      lastCheckInDate: '2026-06-10',
      streak: 4,
      checkedInToday: true,
      unlockedItems: ['candy', 'apple'],
    });
    assert.deepEqual(state.achievements, [
      {
        id: 'ach_bomb_3',
        ...ACHIEVEMENT_METADATA.ach_bomb_3,
        targetValue: ACHIEVEMENT_METADATA.ach_bomb_3.targetValue,
        unlocked: true,
        unlockedAt: '2026-06-10',
        progress: 3,
        tier: 2,
        rewardsClaimed: false,
      },
    ]);
    assert.deepEqual(state.leaderboard, [
      {
        id: 'user_other',
        nickname: 'Other',
        avatarId: 'avatar_rabbit',
        points: 800,
        isCurrentUser: false,
      },
      {
        id: 'user_current',
        nickname: 'Kid',
        avatarId: 'avatar_fox',
        points: 450,
        isCurrentUser: true,
      },
    ]);
  });

  it('falls back to the current user leaderboard row when no snapshot row exists', async () => {
    const state = await getHomeState({
      openid: 'openid_current',
      repositories: createRepositories({
        users: [
          {
            _id: 'user_current',
            _openid: 'openid_current',
            nickname: 'Kid',
            avatarId: 'avatar_fox',
          },
        ],
        userStats: [
          {
            _id: 'stats_current',
            userId: 'user_current',
            _openid: 'openid_current',
            pointsBalance: 120,
            feedHappiness: 50,
            records: DEFAULT_RECORDS,
            checkInStreak: 0,
            lastCheckInDate: null,
          },
        ],
        achievements: [],
        inventoryItems: [],
        checkins: [],
        leaderboard: [],
      }),
      today: '2026-06-10',
    });

    assert.deepEqual(state.leaderboard, [
      {
        id: 'user_current',
        nickname: 'Kid',
        avatarId: 'avatar_fox',
        points: 120,
        isCurrentUser: true,
      },
    ]);
    assert.deepEqual(state.checkIn, {
      lastCheckInDate: null,
      streak: 0,
      checkedInToday: false,
      unlockedItems: [],
    });
  });

  it('rejects calls without a trusted WeChat openid', async () => {
    await assert.rejects(
      () => getHomeState({
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

  it('requires loginOrCreateUser to create the user first', async () => {
    await assert.rejects(
      () => getHomeState({
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
