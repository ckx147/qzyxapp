import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const distRoot = join(projectRoot, 'dist');
const indexPath = join(distRoot, 'index.html');
const bgmPath = join(distRoot, 'audio', 'Sunlight_on_the_Sandbox.mp3');
const brandingRoot = join(projectRoot, 'public', 'branding');

function assertFileExists(path, message) {
  assert.ok(existsSync(path), `${message}: ${normalize(path)}`);
}

function collectAssetRefs(indexHtml) {
  return [...indexHtml.matchAll(/\b(?:src|href)="(\.\/assets\/[^"]+)"/g)]
    .map(match => match[1]);
}

function readPngSize(path) {
  const buffer = readFileSync(path);
  assert.equal(buffer.toString('ascii', 1, 4), 'PNG', `Branding asset must be a PNG: ${normalize(path)}`);
  return {
    width: buffer.readUInt32BE(16),
    height: buffer.readUInt32BE(20),
  };
}

function assertPngSize(path, expectedWidth, expectedHeight) {
  assertFileExists(path, 'Branding asset is missing');
  const size = readPngSize(path);
  assert.deepEqual(
    size,
    { width: expectedWidth, height: expectedHeight },
    `Branding asset has wrong dimensions: ${normalize(path)}`
  );
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
assert.match(
  indexHtml,
  /__APP_BOOT_DIAGNOSTICS__/,
  'dist/index.html should include the inline boot diagnostics for APK white-screen debugging'
);

for (const assetRef of assetRefs) {
  assertFileExists(join(distRoot, assetRef), `Referenced asset is missing: ${assetRef}`);
}

assertFileExists(bgmPath, 'Packaged BGM file is missing');
assertFileExists(join(brandingRoot, 'splash-source.png'), 'Splash source image is missing');
assertFileExists(join(brandingRoot, 'app-icon-source.png'), 'App icon source image is missing');
assertPngSize(join(brandingRoot, 'splash-1080x1920.png'), 1080, 1920);
assertPngSize(join(brandingRoot, 'app-icon-1024.png'), 1024, 1024);
assertPngSize(join(brandingRoot, 'app-icon-512.png'), 512, 512);

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
  brandingAssetsReady: true,
}, null, 2));
