# cloudfunctions

This directory is a WeChat Cloud Functions planning skeleton.

Current status:

- The web/APK app is still using the local `GameDataPort`.
- No cloud environment has been created from this repository yet.
- These folders document the future server-side responsibilities and contracts.

Read before implementation:

1. `../src/utils/cloudGameDataPort.ts`
2. `../../AI知识库/儿童萌趣益智游戏乐园/云函数接口契约.md`
3. `../../AI知识库/儿童萌趣益智游戏乐园/微信云开发落地清单.md`

Initial read path:

- `loginOrCreateUser`
- `getHomeState`
- `getLeaderboard`

Write operations such as `claimDailyCheckin`, `submitGameResult`, `purchaseFood`, `feedCompanion`, and `claimAchievementReward` should be added only after the read path is proven in a real WeChat cloud environment.

## Real WeChat rollout entry

Before opening the cloud data switch, read:

1. `../../AI知识库/儿童萌趣益智游戏乐园/微信云开发真实接入操作闭环.md`
2. `../../AI知识库/儿童萌趣益智游戏乐园/云函数接口契约.md`
3. `../../AI知识库/儿童萌趣益智游戏乐园/微信云开发部署前清单.md`

Deploy `loginOrCreateUser` first and keep `VITE_USE_WECHAT_CLOUD=false` until all rollout checks pass.
