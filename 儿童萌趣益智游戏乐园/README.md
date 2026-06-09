# 小布智趣岛

儿童益智游戏合集 Web 原型，包含数字炸弹、数字华容道、舒尔特专注力训练、五子棋、每日打卡、宠物投喂、积分商店、排行榜和成就墙。

## 当前状态

- 技术栈：Vite + React + TypeScript + Tailwind CSS
- 当前形态：Web 原型，尚不是微信小程序工程
- 当前版本：安卓内测 v0.1.0
- 数据存储：浏览器 `localStorage`
- 音效：Web Audio API

## 本地运行

```powershell
npm install
npm run dev
```

默认地址：

```text
http://localhost:3000
```

## 验证命令

```powershell
npm run test:points
npm run test:browser:points
npm run lint
npm run build
npm run test:android-package
npm run test:browser:dist
npm run verify:android
```

`test:browser:points` 需要先启动本地服务：

```powershell
npm run dev
```

如需指定测试地址：

```powershell
$env:APP_URL="http://localhost:3000"
npm run test:browser:points
```

## HBuilder X 安卓 APK 打包

```powershell
npm.cmd run verify:android
```

检查通过后，在 HBuilder X 中使用构建后的 `dist` 目录作为打包入口。不要直接使用项目根目录。

如果真机仍然白屏，页面会在几秒后显示“启动诊断”面板，优先查看面板里的资源加载失败或运行时错误信息。

## 已知说明

- 当前没有接入 Gemini 或其他 AI API。
- 当前排行榜、用户档案、成就和打卡均为本地模拟数据。
- 如果要迁移到微信小程序，需要替换 `localStorage`、DOM、图片处理和 Web Audio API 等 Web 能力。
