import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const distRoot = join(projectRoot, 'dist');
const indexPath = join(distRoot, 'index.html');
const bgmPath = join(distRoot, 'audio', 'Sunlight_on_the_Sandbox.mp3');

function assertFileExists(path, message) {
  assert.ok(existsSync(path), `${message}: ${normalize(path)}`);
}

function collectAssetRefs(indexHtml) {
  return [...indexHtml.matchAll(/\b(?:src|href)="(\.\/assets\/[^"]+)"/g)]
    .map(match => match[1]);
}

assertFileExists(indexPath, 'Run npm run build before android package checks');

const indexHtml = readFileSync(indexPath, 'utf8');

assert.doesNotMatch(
  indexHtml,
  /\b(?:src|href)="\/(?:assets|audio)\//,
  'Android package must not use root-relative assets such as /assets or /audio'
);

const assetRefs = collectAssetRefs(indexHtml);
assert.ok(assetRefs.length > 0, 'dist/index.html should reference relative ./assets files');

for (const assetRef of assetRefs) {
  assertFileExists(join(distRoot, assetRef), `Referenced asset is missing: ${assetRef}`);
}

assertFileExists(bgmPath, 'Packaged BGM file is missing');

const builtJs = assetRefs
  .filter(assetRef => assetRef.endsWith('.js'))
  .map(assetRef => readFileSync(join(distRoot, assetRef), 'utf8'))
  .join('\n');

assert.match(
  builtJs,
  /\.\/audio\/Sunlight_on_the_Sandbox\.mp3/,
  'Built JavaScript should reference the BGM through a relative ./audio path'
);

assert.doesNotMatch(
  builtJs,
  /["']\/audio\/Sunlight_on_the_Sandbox\.mp3["']/,
  'Built JavaScript must not use root-relative /audio path'
);

console.log(JSON.stringify({
  androidPackageReady: true,
  checkedAssets: assetRefs.length,
  bgm: './audio/Sunlight_on_the_Sandbox.mp3',
}, null, 2));
