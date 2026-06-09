import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const cloudFunctionDirs = [
  'loginOrCreateUser',
  'getHomeState',
  'getLeaderboard',
];

describe('cloudfunctions skeleton', () => {
  it('keeps the initial read-path cloud function directories documented', () => {
    for (const fnName of cloudFunctionDirs) {
      const readmePath = resolve('cloudfunctions', fnName, 'README.md');
      assert.ok(existsSync(readmePath), `${fnName} README.md should exist`);

      const source = readFileSync(readmePath, 'utf8');
      assert.match(source, new RegExp(`# ${fnName}`));
      assert.match(source, /Status: planning skeleton only/);
      assert.match(source, /Responsibility/);
      assert.match(source, /Safety Notes/);
    }
  });

  it('keeps cloud function names aligned with the frontend cloud port', () => {
    const portSource = readFileSync(resolve('src/utils/cloudGameDataPort.ts'), 'utf8');

    for (const fnName of cloudFunctionDirs) {
      assert.match(portSource, new RegExp(`${fnName}: '${fnName}'`));
    }
  });
});
