import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  createWechatCloudFunctionCaller,
  hasWechatCloud,
} from '../src/utils/wechatCloudAdapter.ts';

describe('wechat cloud adapter', () => {
  it('detects whether wx.cloud.callFunction exists', () => {
    assert.equal(hasWechatCloud({}), false);
    assert.equal(hasWechatCloud({ wx: {} }), false);
    assert.equal(hasWechatCloud({ wx: { cloud: {} } }), false);
    assert.equal(hasWechatCloud({
      wx: {
        cloud: {
          async callFunction() {
            return { result: undefined };
          },
        },
      },
    }), true);
  });

  it('wraps wx.cloud.callFunction and returns the result payload', async () => {
    const calls = [];
    const caller = createWechatCloudFunctionCaller({
      wx: {
        cloud: {
          async callFunction(request) {
            calls.push(request);
            return {
              result: {
                ok: true,
                name: request.name,
              },
            };
          },
        },
      },
    });

    assert.ok(caller);
    const result = await caller({
      name: 'getHomeState',
      data: {
        from: 'test',
      },
    });

    assert.deepEqual(calls, [
      {
        name: 'getHomeState',
        data: {
          from: 'test',
        },
      },
    ]);
    assert.deepEqual(result, {
      ok: true,
      name: 'getHomeState',
    });
  });

  it('returns null outside a WeChat cloud environment', () => {
    assert.equal(createWechatCloudFunctionCaller({}), null);
  });
});
