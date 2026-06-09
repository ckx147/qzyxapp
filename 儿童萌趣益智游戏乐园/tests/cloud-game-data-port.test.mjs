import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { cloudFunctionNames, createCloudGameDataPort } from '../src/utils/cloudGameDataPort.ts';

const mockProfile = {
  id: 'user_xiaobu_001',
  nickname: '聪明小探险家',
  avatarId: 'avatar_dino',
  points: 370,
  feedHappiness: 82,
  inventory: {
    '糖果': 2,
  },
  records: {
    bombGuesses: 8,
    bombExplodes: 1,
    bombClears: 2,
    klotskiBestMoves3x3: 32,
    klotskiBestTime3x3: 58,
    klotskiBestMoves4x4: 9999,
    klotskiBestTime4x4: 9999,
    schulteBest3x3: 12.4,
    schulteBest4x4: 35.8,
    schulteBest5x5: 9999,
    gomokuWins: 3,
    gomokuLosses: 1,
    gomokuDraws: 0,
  },
};

const mockGameState = {
  profile: mockProfile,
  achievements: [],
  checkIn: {
    lastCheckInDate: '2026-06-10',
    streak: 4,
    checkedInToday: true,
    unlockedItems: ['糖果'],
  },
  leaderboard: [
    {
      id: 'user_xiaobu_001',
      nickname: '聪明小探险家',
      avatarId: 'avatar_dino',
      points: 370,
      isCurrentUser: true,
    },
  ],
};

describe('cloud game data port', () => {
  it('loads game state through loginOrCreateUser then getHomeState', async () => {
    const calls = [];
    const port = createCloudGameDataPort(async request => {
      calls.push(request);
      if (request.name === cloudFunctionNames.loginOrCreateUser) return undefined;
      if (request.name === cloudFunctionNames.getHomeState) return mockGameState;
      throw new Error(`Unexpected cloud function: ${request.name}`);
    });

    const state = await port.loadGameState();

    assert.deepEqual(calls.map(call => call.name), [
      cloudFunctionNames.loginOrCreateUser,
      cloudFunctionNames.getHomeState,
    ]);
    assert.deepEqual(state, mockGameState);
  });

  it('saves game state through saveGameState with the full state payload', async () => {
    const calls = [];
    const savedState = {
      ...mockGameState,
      profile: {
        ...mockProfile,
        points: 420,
      },
    };
    const port = createCloudGameDataPort(async request => {
      calls.push(request);
      assert.equal(request.name, cloudFunctionNames.saveGameState);
      return savedState;
    });

    const result = await port.saveGameState(savedState);

    assert.deepEqual(calls, [
      {
        name: cloudFunctionNames.saveGameState,
        data: {
          state: savedState,
        },
      },
    ]);
    assert.deepEqual(result, savedState);
  });

  it('syncs leaderboard from getLeaderboard instead of trusting local fallback', async () => {
    const localFallback = [
      {
        id: 'local_only',
        nickname: '本地榜单',
        avatarId: 'avatar_fox',
        points: 9999,
      },
    ];
    const cloudLeaderboard = [
      {
        id: 'cloud_rank_001',
        nickname: '云端榜首',
        avatarId: 'avatar_rabbit',
        points: 920,
      },
    ];
    const calls = [];
    const port = createCloudGameDataPort(async request => {
      calls.push(request);
      assert.equal(request.name, cloudFunctionNames.getLeaderboard);
      return { leaderboard: cloudLeaderboard };
    });

    const leaderboard = await port.syncLeaderboard(mockProfile, localFallback);

    assert.deepEqual(calls, [
      {
        name: cloudFunctionNames.getLeaderboard,
        data: {
          profile: mockProfile,
          localFallback,
        },
      },
    ]);
    assert.deepEqual(leaderboard, cloudLeaderboard);
  });
});
