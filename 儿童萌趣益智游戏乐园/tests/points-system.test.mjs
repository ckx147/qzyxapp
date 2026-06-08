import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const gameplayComponents = [
  'src/components/BombGame.tsx',
  'src/components/KlotskiGame.tsx',
  'src/components/SchulteGame.tsx',
  'src/components/GomokuGame.tsx',
];

describe('points system', () => {
  it('keeps gameplay rewards flowing through the shared onPointsChange handler', () => {
    const offenders = [];

    for (const relativePath of gameplayComponents) {
      const source = readFileSync(resolve(relativePath), 'utf8');
      const forbiddenPatterns = [
        /points\s*:\s*prev\.points\s*[+-]/,
        /points\s*:\s*updatedPoints\b/,
        /\bupdatedPoints\s*[+\-]=/,
      ];

      for (const pattern of forbiddenPatterns) {
        if (pattern.test(source)) {
          offenders.push(`${relativePath} matches ${pattern}`);
        }
      }
    }

    assert.deepEqual(offenders, []);
  });
});
