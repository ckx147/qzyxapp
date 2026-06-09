import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { relative, resolve } from 'node:path';
import { readdirSync, statSync } from 'node:fs';

const srcRoot = resolve('src');
const allowedStorageFile = resolve('src/utils/gameStorage.ts');

function collectSourceFiles(dir) {
  const files = [];
  for (const entry of readdirSync(dir)) {
    const fullPath = resolve(dir, entry);
    const stat = statSync(fullPath);
    if (stat.isDirectory()) {
      files.push(...collectSourceFiles(fullPath));
    } else if (/\.(ts|tsx)$/.test(entry)) {
      files.push(fullPath);
    }
  }
  return files;
}

describe('storage adapter boundary', () => {
  it('keeps browser storage access behind utils/gameStorage.ts', () => {
    const offenders = [];

    for (const file of collectSourceFiles(srcRoot)) {
      if (file === allowedStorageFile) continue;
      const source = readFileSync(file, 'utf8');
      if (/\blocalStorage\b|\bsessionStorage\b/.test(source)) {
        offenders.push(relative(resolve('.'), file));
      }
    }

    assert.deepEqual(offenders, []);
  });
});
