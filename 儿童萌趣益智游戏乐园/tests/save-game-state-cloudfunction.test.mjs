import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { DEFAULT_RECORDS } = require('../cloudfunctions/loginOrCreateUser/index.cjs');
const {
  createDatabaseRepositories,
  saveGameState,
} = require('../cloudfunctions/saveGameState/index.cjs');

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
    async update(id, data) {
      const row = rows.find(item => item._id === id);
      assert.ok(row, `expected row ${id} to exist`);
      Object.assign(row, clone(data));
    },
    async upsertForUser(userId, openid, data) {
      const existing = rows.find(row => row.userId === userId || row._openid === openid);
      if (existing) {
        Object.assign(existing, clone(data));
      } else {
        rows.push({
          _id: `doc_${rows.length + 1}`,
          userId,
          _openid: openid,
          ...clone(data),
        });
      }
    },
  };
}

function createReplaceRepo(seed = []) {
  const rows = seed.map(row => clone(row));

  return {
    rows,
    async replaceForUser(userId, openid, nextValue, nowIso) {
      for (let index = rows.length - 1; index >= 0; index -= 1) {
        if (rows[index].userId === userId) rows.splice(index, 1);
      }

      if (Array.isArray(nextValue)) {
        for (const item of nextValue) {
          rows.push({
            _id: `doc_${rows.length + 1}`,
            userId,
            _openid: openid,
            ...clone(item),
            updatedAt: nowIso,
          });
        }
        return;
      }

      for (const [itemName, count] of Object.entries(nextValue)) {
        rows.push({
          _id: `doc_${rows.length + 1}`,
          userId,
          _openid: openid,
          itemName,
          count,
          updatedAt: nowIso,
        });
      }
    },
  };
}

function createRepositories(seed = {}) {
  return {
    users: createSingleRepo(seed.users),
    userStats: createSingleRepo(seed.userStats),
    achievements: createReplaceRepo(seed.achievements),
    inventoryItems: createReplaceRepo(seed.inventoryItems),
    checkins: createSingleRepo(seed.checkins),
    leaderboard: {
      rows: seed.leaderboard || [],
      async replaceForUser() {
        throw new Error('saveGameState must not write leaderboard rows');
      },
    },
  };
}

function createState(overrides = {}) {
  return {
    profile: {
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
      _openid: 'malicious',
      unknown: 'drop-me',
    },
    achievements: [
      {
        id: 'ach_bomb_3',
        title: 'Ignored title',
        tier: 2,
        progress: 3,
        unlocked: true,
        unlockedAt: '2026-06-10',
        rewardsClaimed: false,
        targetValue: 3,
        _openid: 'malicious',
      },
    ],
    checkIn: {
      lastCheckInDate: '2026-06-10',
      streak: 4,
      checkedInToday: true,
      unlockedItems: ['candy', 'apple'],
      _openid: 'malicious',
    },
    leaderboard: [
      {
        id: 'fake',
        nickname: 'Fake',
        avatarId: 'avatar_robot',
        points: 999999,
      },
    ],
    ...overrides,
  };
}

describe('saveGameState cloud function core', () => {
  it('starts independent game-state writes concurrently', async () => {
    const started = [];
    let releaseWrites;
    const writesReleased = new Promise(resolve => {
      releaseWrites = resolve;
    });
    const waitForWriteBatch = name => async () => {
      started.push(name);
      if (started.length === 5) releaseWrites();
      await writesReleased;
    };
    const repositories = {
      users: {
        async findByOpenid() {
          return { _id: 'user_current', _openid: 'openid_current' };
        },
        update: waitForWriteBatch('users'),
      },
      userStats: {
        upsertForUser: waitForWriteBatch('userStats'),
      },
      achievements: {
        replaceForUser: waitForWriteBatch('achievements'),
      },
      inventoryItems: {
        replaceForUser: waitForWriteBatch('inventoryItems'),
      },
      checkins: {
        upsertForUser: waitForWriteBatch('checkins'),
      },
    };

    await Promise.race([
      saveGameState({
        openid: 'openid_current',
        repositories,
        state: createState(),
      }),
      new Promise((_, reject) => {
        setTimeout(() => reject(new Error(`writes remained serial: ${started.join(', ')}`)), 100);
      }),
    ]);

    assert.deepEqual(new Set(started), new Set([
      'users',
      'userStats',
      'achievements',
      'inventoryItems',
      'checkins',
    ]));
  });

  it('adds replacement achievement rows concurrently', async () => {
    let activeAdds = 0;
    let maxActiveAdds = 0;
    const collections = {
      achievements: [
        {
          _id: 'old_achievement',
          userId: 'user_current',
          _openid: 'openid_current',
        },
      ],
    };
    const db = {
      collection(name) {
        const rows = collections[name] || (collections[name] = []);
        return {
          where(query) {
            const matched = () => rows.filter(row => Object.entries(query).every(
              ([key, value]) => row[key] === value,
            ));
            return {
              async get() {
                return { data: matched() };
              },
              limit() {
                return {
                  async get() {
                    return { data: matched().slice(0, 1) };
                  },
                };
              },
            };
          },
          doc(id) {
            return {
              async remove() {
                const index = rows.findIndex(row => row._id === id);
                if (index >= 0) rows.splice(index, 1);
              },
              async update({ data }) {
                const row = rows.find(item => item._id === id);
                Object.assign(row, clone(data));
              },
            };
          },
          async add({ data }) {
            activeAdds += 1;
            maxActiveAdds = Math.max(maxActiveAdds, activeAdds);
            await new Promise(resolve => setTimeout(resolve, 10));
            rows.push({ _id: `doc_${rows.length + 1}`, ...clone(data) });
            activeAdds -= 1;
          },
        };
      },
    };
    const repositories = createDatabaseRepositories(db);
    const achievements = Array.from({ length: 10 }, (_, index) => ({
      achievementId: `achievement_${index + 1}`,
      tier: 1,
      progress: index,
      unlocked: false,
      rewardsClaimed: false,
      targetValue: 10,
    }));

    await repositories.achievements.replaceForUser(
      'user_current',
      'openid_current',
      achievements,
      '2026-06-11T00:00:00.000Z',
    );

    assert.ok(maxActiveAdds > 1, `expected concurrent adds, observed ${maxActiveAdds}`);
    assert.equal(collections.achievements.length, 10);
  });

  it('saves whitelisted profile stats, records, achievements, check-in, and inventory', async () => {
    const repositories = createRepositories({
      users: [
        {
          _id: 'user_current',
          _openid: 'openid_current',
          nickname: 'Old',
          avatarId: 'avatar_dino',
        },
      ],
      userStats: [
        {
          _id: 'stats_current',
          userId: 'user_current',
          _openid: 'openid_current',
          pointsBalance: 100,
          feedHappiness: 50,
          records: DEFAULT_RECORDS,
        },
      ],
      achievements: [
        {
          _id: 'old_ach',
          userId: 'user_current',
          _openid: 'openid_current',
          achievementId: 'old',
        },
      ],
      inventoryItems: [
        {
          _id: 'old_item',
          userId: 'user_current',
          _openid: 'openid_current',
          itemName: 'old',
          count: 1,
        },
      ],
      checkins: [
        {
          _id: 'checkin_current',
          userId: 'user_current',
          _openid: 'openid_current',
          streak: 0,
        },
      ],
    });

    const result = await saveGameState({
      openid: 'openid_current',
      repositories,
      state: createState(),
      now: '2026-06-10T12:00:00.000Z',
    });

    assert.deepEqual(repositories.users.rows[0], {
      _id: 'user_current',
      _openid: 'openid_current',
      nickname: 'Kid',
      avatarId: 'avatar_fox',
      updatedAt: '2026-06-10T12:00:00.000Z',
    });
    assert.equal(repositories.userStats.rows[0].pointsBalance, 450);
    assert.equal(repositories.userStats.rows[0].feedHappiness, 76);
    assert.equal(repositories.userStats.rows[0].records.gomokuWins, 2);
    assert.equal(repositories.userStats.rows[0].checkInStreak, 4);
    assert.equal(repositories.userStats.rows[0].lastCheckInDate, '2026-06-10');
    assert.deepEqual(repositories.inventoryItems.rows.map(row => [row.itemName, row.count]), [
      ['candy', 2],
      ['apple', 1],
    ]);
    assert.deepEqual(repositories.achievements.rows.map(row => row.achievementId), ['ach_bomb_3']);
    assert.equal('_openid' in result.profile, false);
    assert.deepEqual(result.leaderboard, []);
  });

  it('rejects a profile id that does not belong to the current openid', async () => {
    await assert.rejects(
      () => saveGameState({
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
        }),
        state: createState({
          profile: {
            ...createState().profile,
            id: 'user_other',
          },
        }),
      }),
      error => {
        assert.equal(error.code, 'FORBIDDEN_USER_MISMATCH');
        return true;
      },
    );
  });

  it('rejects calls without a trusted WeChat openid', async () => {
    await assert.rejects(
      () => saveGameState({
        openid: '',
        repositories: createRepositories(),
        state: createState(),
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
      () => saveGameState({
        openid: 'openid_missing',
        repositories: createRepositories(),
        state: createState(),
      }),
      error => {
        assert.equal(error.code, 'USER_NOT_FOUND');
        assert.match(error.message, /loginOrCreateUser/);
        return true;
      },
    );
  });
});
