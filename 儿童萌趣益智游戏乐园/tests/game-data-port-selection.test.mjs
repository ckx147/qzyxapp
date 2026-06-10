import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { resolveGameDataPort } from '../src/utils/gameDataService.ts';

const mockProfile = {
  id: 'user_current',
  nickname: 'Kid',
  avatarId: 'avatar_dino',
  points: 100,
  feedHappiness: 50,
  inventory: {},
  records: {
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
  },
};

const mockGameState = {
  profile: mockProfile,
  achievements: [],
  checkIn: {
    lastCheckInDate: null,
    streak: 0,
    checkedInToday: false,
    unlockedItems: [],
  },
  leaderboard: [],
};

describe('game data port selection', () => {
  it('uses the local port by default even when wx.cloud exists', async () => {
    const calls = [];
    const port = resolveGameDataPort({
      wxLike: {
        wx: {
          cloud: {
            async callFunction(request) {
              calls.push(request);
              return { result: mockGameState };
            },
          },
        },
      },
    });

    const leaderboard = await port.syncLeaderboard(mockProfile, []);

    assert.deepEqual(calls, []);
    assert.deepEqual(leaderboard, [
      {
        id: 'user_current',
        nickname: 'Kid',
        avatarId: 'avatar_dino',
        points: 100,
        isCurrentUser: true,
      },
    ]);
  });

  it('falls back to the local port when the cloud switch is on but wx.cloud is unavailable', async () => {
    const port = resolveGameDataPort({
      useWechatCloud: true,
      wxLike: {},
    });

    const leaderboard = await port.syncLeaderboard(mockProfile, []);

    assert.deepEqual(leaderboard, [
      {
        id: 'user_current',
        nickname: 'Kid',
        avatarId: 'avatar_dino',
        points: 100,
        isCurrentUser: true,
      },
    ]);
  });

  it('uses the WeChat cloud port only when explicitly enabled and available', async () => {
    const calls = [];
    const port = resolveGameDataPort({
      useWechatCloud: true,
      wxLike: {
        wx: {
          cloud: {
            async callFunction(request) {
              calls.push(request);
              if (request.name === 'loginOrCreateUser') return { result: undefined };
              if (request.name === 'getHomeState') return { result: mockGameState };
              throw new Error(`Unexpected cloud function ${request.name}`);
            },
          },
        },
      },
    });

    const state = await port.loadGameState();

    assert.deepEqual(calls.map(call => call.name), [
      'loginOrCreateUser',
      'getHomeState',
    ]);
    assert.deepEqual(state, mockGameState);
  });
});
