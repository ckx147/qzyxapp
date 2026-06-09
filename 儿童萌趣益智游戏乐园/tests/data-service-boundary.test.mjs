import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

describe('game data service boundary', () => {
  it('keeps persisted game state access in gameDataService', () => {
    const source = readFileSync(resolve('src/utils/gameDataService.ts'), 'utf8');

    assert.match(source, /\bexport interface GameDataPort\b/);
    assert.match(source, /\bcreateCloudGameDataPort\b/);
    assert.match(source, /const activeGameDataPort = localGameDataPort/);
    assert.match(source, /\bexport function loadGameState\b/);
    assert.match(source, /\bexport function saveGameState\b/);
    assert.match(source, /\bexport function syncLeaderboard\b/);
    assert.match(source, /\bPromise<GameState>/);
    assert.match(source, /\bPromise<LeaderboardItem\[\]>/);
  });

  it('keeps leaderboard persistence out of gameHelpers', () => {
    const helperSource = readFileSync(resolve('src/utils/gameHelpers.ts'), 'utf8');

    assert.doesNotMatch(helperSource, /\bINITIAL_LEADERBOARD\b/);
    assert.doesNotMatch(helperSource, /\breadStorageJson\b|\bwriteStorageJson\b/);
    assert.doesNotMatch(helperSource, /\bstorageKeys\.leaderboard\b/);
  });

  it('keeps the future cloud port explicit and inactive by default', () => {
    const cloudSource = readFileSync(resolve('src/utils/cloudGameDataPort.ts'), 'utf8');

    assert.match(cloudSource, /\bexport function createCloudGameDataPort\b/);
    assert.match(cloudSource, /loginOrCreateUser/);
    assert.match(cloudSource, /getHomeState/);
    assert.match(cloudSource, /saveGameState/);
    assert.match(cloudSource, /getLeaderboard/);
    assert.doesNotMatch(cloudSource, /\bwx\.cloud\b/);
  });
});
