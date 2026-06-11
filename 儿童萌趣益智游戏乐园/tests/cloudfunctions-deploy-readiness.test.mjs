import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

describe('cloud function deploy readiness docs', () => {
  it('keeps loginOrCreateUser deployment steps explicit before real WeChat rollout', () => {
    const readme = readFileSync(resolve('cloudfunctions/loginOrCreateUser/README.md'), 'utf8');
    const rootReadme = readFileSync(resolve('cloudfunctions/README.md'), 'utf8');

    assert.match(readme, /## WeChat Deploy Checklist/);
    assert.match(readme, /cloudfunctions\/loginOrCreateUser/);
    assert.match(readme, /index\.js/);
    assert.match(readme, /wx-server-sdk/);
    assert.match(readme, /users/);
    assert.match(readme, /user_stats/);
    assert.match(readme, /achievements/);
    assert.match(readme, /inventory_items/);
    assert.match(readme, /OPENID/);
    assert.match(readme, /UNAUTHENTICATED/);
    assert.match(readme, /VITE_USE_WECHAT_CLOUD=false/);
    assert.match(readme, /VITE_USE_WECHAT_CLOUD=true/);
    assert.match(rootReadme, /微信云开发真实接入操作闭环/);

    const manifest = JSON.parse(
      readFileSync(resolve('cloudfunctions/loginOrCreateUser/package.json'), 'utf8'),
    );
    const entrySource = readFileSync(
      resolve('cloudfunctions/loginOrCreateUser/index.js'),
      'utf8',
    );

    assert.equal(manifest.main, 'index.js');
    assert.match(entrySource, /require\('\.\/index\.cjs'\)/);
  });
});
