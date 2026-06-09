import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const cloudFunctionDirs = [];

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

  it('keeps loginOrCreateUser as a tested implementation draft', () => {
    const readmePath = resolve('cloudfunctions', 'loginOrCreateUser', 'README.md');
    const sourcePath = resolve('cloudfunctions', 'loginOrCreateUser', 'index.cjs');
    assert.ok(existsSync(readmePath), 'loginOrCreateUser README.md should exist');
    assert.ok(existsSync(sourcePath), 'loginOrCreateUser index.cjs should exist');

    const readme = readFileSync(readmePath, 'utf8');
    const source = readFileSync(sourcePath, 'utf8');
    assert.match(readme, /Status: implementation draft/);
    assert.match(source, /exports\.loginOrCreateUser = loginOrCreateUser/);
    assert.match(source, /exports\.main = async function main/);
  });

  it('keeps getHomeState as a tested implementation draft', () => {
    const readmePath = resolve('cloudfunctions', 'getHomeState', 'README.md');
    const sourcePath = resolve('cloudfunctions', 'getHomeState', 'index.cjs');
    assert.ok(existsSync(readmePath), 'getHomeState README.md should exist');
    assert.ok(existsSync(sourcePath), 'getHomeState index.cjs should exist');

    const readme = readFileSync(readmePath, 'utf8');
    const source = readFileSync(sourcePath, 'utf8');
    assert.match(readme, /Status: implementation draft/);
    assert.match(source, /exports\.getHomeState = getHomeState/);
    assert.match(source, /exports\.main = async function main/);
  });

  it('keeps getLeaderboard as a tested implementation draft', () => {
    const readmePath = resolve('cloudfunctions', 'getLeaderboard', 'README.md');
    const sourcePath = resolve('cloudfunctions', 'getLeaderboard', 'index.cjs');
    assert.ok(existsSync(readmePath), 'getLeaderboard README.md should exist');
    assert.ok(existsSync(sourcePath), 'getLeaderboard index.cjs should exist');

    const readme = readFileSync(readmePath, 'utf8');
    const source = readFileSync(sourcePath, 'utf8');
    assert.match(readme, /Status: implementation draft/);
    assert.match(source, /exports\.getLeaderboard = getLeaderboard/);
    assert.match(source, /exports\.main = async function main/);
  });

  it('keeps cloud function names aligned with the frontend cloud port', () => {
    const portSource = readFileSync(resolve('src/utils/cloudGameDataPort.ts'), 'utf8');

    for (const fnName of ['loginOrCreateUser', 'getHomeState', 'getLeaderboard', ...cloudFunctionDirs]) {
      assert.match(portSource, new RegExp(`${fnName}: '${fnName}'`));
    }
  });
});
