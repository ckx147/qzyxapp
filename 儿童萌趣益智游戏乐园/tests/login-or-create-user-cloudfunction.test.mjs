import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const {
  DEFAULT_ACHIEVEMENTS,
  DEFAULT_RECORDS,
  loginOrCreateUser,
} = require('../cloudfunctions/loginOrCreateUser/index.cjs');

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function createSingleRepo(seed = []) {
  let nextId = seed.length + 1;
  const rows = seed.map(row => clone(row));

  return {
    rows,
    async findByOpenid(openid) {
      return rows.find(row => row._openid === openid) || null;
    },
    async create(data) {
      const row = {
        _id: data._id || `doc_${nextId++}`,
        ...clone(data),
      };
      rows.push(row);
      return row;
    },
    async update(id, data) {
      const row = rows.find(item => item._id === id);
      assert.ok(row, `expected row ${id} to exist`);
      Object.assign(row, clone(data));
      return row;
    },
  };
}

function createListRepo(seed = []) {
  const repo = createSingleRepo(seed);
  repo.findByOpenid = async openid => repo.rows.filter(row => row._openid === openid);
  return repo;
}

function createRepositories(seed = {}) {
  return {
    users: createSingleRepo(seed.users),
    userStats: createSingleRepo(seed.userStats),
    achievements: createListRepo(seed.achievements),
    inventoryItems: createListRepo(seed.inventoryItems),
  };
}

describe('loginOrCreateUser cloud function core', () => {
  it('creates the default user state without exposing openid', async () => {
    const repositories = createRepositories();

    const result = await loginOrCreateUser({
      openid: 'openid_new',
      repositories,
      now: '2026-06-10T10:00:00.000Z',
    });

    assert.equal(result.isNewUser, true);
    assert.equal(result.userId, 'doc_1');
    assert.equal(result.profile.id, 'doc_1');
    assert.equal(result.profile.nickname, 'Smart Explorer');
    assert.equal(result.profile.avatarId, 'avatar_dino');
    assert.equal(result.profile.points, 100);
    assert.equal(result.profile.feedHappiness, 50);
    assert.deepEqual(result.profile.inventory, {
      candy: 1,
      apple: 2,
      biscuit: 1,
    });
    assert.deepEqual(result.profile.records, DEFAULT_RECORDS);
    assert.equal('_openid' in result.profile, false);

    assert.equal(repositories.users.rows.length, 1);
    assert.equal(repositories.userStats.rows.length, 1);
    assert.equal(repositories.inventoryItems.rows.length, 3);
    assert.equal(repositories.achievements.rows.length, DEFAULT_ACHIEVEMENTS.length);
    assert.equal(repositories.users.rows[0].lastLoginAt, '2026-06-10T10:00:00.000Z');
  });

  it('returns an existing user and refreshes the login timestamp', async () => {
    const repositories = createRepositories({
      users: [
        {
          _id: 'user_existing',
          _openid: 'openid_existing',
          nickname: 'Kid',
          avatarId: 'avatar_fox',
          status: 'active',
          createdAt: '2026-06-09T08:00:00.000Z',
          updatedAt: '2026-06-09T08:00:00.000Z',
          lastLoginAt: '2026-06-09T08:00:00.000Z',
        },
      ],
      userStats: [
        {
          _id: 'stats_existing',
          userId: 'user_existing',
          _openid: 'openid_existing',
          pointsBalance: 450,
          feedHappiness: 75,
          records: {
            ...DEFAULT_RECORDS,
            gomokuWins: 3,
          },
        },
      ],
      inventoryItems: [
        {
          _id: 'item_existing',
          userId: 'user_existing',
          _openid: 'openid_existing',
          itemName: 'candy',
          count: 2,
        },
      ],
      achievements: [
        {
          _id: 'ach_existing',
          userId: 'user_existing',
          _openid: 'openid_existing',
          achievementId: DEFAULT_ACHIEVEMENTS[0],
          unlocked: true,
        },
      ],
    });

    const result = await loginOrCreateUser({
      openid: 'openid_existing',
      repositories,
      now: '2026-06-10T11:30:00.000Z',
    });

    assert.equal(result.isNewUser, false);
    assert.equal(result.userId, 'user_existing');
    assert.equal(result.profile.nickname, 'Kid');
    assert.equal(result.profile.avatarId, 'avatar_fox');
    assert.equal(result.profile.points, 450);
    assert.equal(result.profile.feedHappiness, 75);
    assert.deepEqual(result.profile.inventory, { candy: 2 });
    assert.equal(result.profile.records.gomokuWins, 3);
    assert.equal(repositories.users.rows[0].lastLoginAt, '2026-06-10T11:30:00.000Z');
    assert.equal(repositories.users.rows[0].updatedAt, '2026-06-10T11:30:00.000Z');
    assert.equal(repositories.userStats.rows.length, 1);
    assert.equal(repositories.inventoryItems.rows.length, 1);
    assert.equal(repositories.achievements.rows.length, 1);
  });

  it('rejects calls without a trusted WeChat openid', async () => {
    await assert.rejects(
      () => loginOrCreateUser({
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
});
