import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

describe('game data service boundary', () => {
  it('keeps persisted game state access in gameDataService', () => {
    const source = readFileSync(resolve('src/utils/gameDataService.ts'), 'utf8');

    assert.match(source, /\bexport function loadGameState\b/);
    assert.match(source, /\bexport function saveGameState\b/);
    assert.match(source, /\bexport \{ syncLeaderboard \}/);
  });

  it('keeps leaderboard persistence out of gameHelpers', () => {
    const helperSource = readFileSync(resolve('src/utils/gameHelpers.ts'), 'utf8');

    assert.doesNotMatch(helperSource, /\bINITIAL_LEADERBOARD\b/);
    assert.doesNotMatch(helperSource, /\breadStorageJson\b|\bwriteStorageJson\b/);
    assert.doesNotMatch(helperSource, /\bstorageKeys\.leaderboard\b/);
  });
});
