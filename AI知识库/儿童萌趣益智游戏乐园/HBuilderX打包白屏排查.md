# 儿童萌趣益智游戏乐园 - HBuilder X 打包白屏排查

标签：#HBuilderX #APK #白屏 #Vite #安卓

更新时间：2026-06-09

## 本次结论

HBuilder X 打包安卓 APK 后白屏，优先怀疑 Vite 产物资源路径。

本项目之前使用 Vite 默认 `base: '/'`，构建后的 `dist/index.html` 会生成：

- `/assets/index-xxx.js`
- `/assets/index-xxx.css`
- `/audio/Sunlight_on_the_Sandbox.mp3`

在安卓 WebView / HBuilder 打包环境里，页面通常不是从站点根路径加载，而是从本地包路径加载。根路径 `/assets/...` 可能指向设备或容器根目录，资源加载失败后 React 不执行，就会白屏。

## 已修复

- `vite.config.ts` 已设置 `base: './'`。
- `src/utils/audio.ts` 的 BGM 路径已改为基于 `import.meta.env.BASE_URL` 生成。
- 新增 `src/vite-env.d.ts`，让 TypeScript 识别 Vite 的 `import.meta.env`。
- `index.html` 已加入内联启动诊断脚本；如果主 JS 未加载、React 未挂载、资源加载失败或运行时报错，真机页面会显示 `app-boot-diagnostics` 面板。
- `src/main.tsx` 在 React 挂载后会设置 `data-app-mounted="true"`，正常启动时诊断面板不会出现。

当前 `dist/index.html` 应生成相对路径：

- `./assets/index-xxx.js`
- `./assets/index-xxx.css`

当前 BGM 构建后应为：

- `./audio/Sunlight_on_the_Sandbox.mp3`

## 打包前检查

每次给 HBuilder X 打包前先运行：

```powershell
npm.cmd run build
npm.cmd run test:android-package
npm.cmd run test:browser:dist
```

`test:android-package` 会自动检查 `dist/index.html`：

- 不应出现 `src="/assets/..."`
- 不应出现 `href="/assets/..."`
- 应出现 `src="./assets/..."`
- 应出现 `href="./assets/..."`
- `dist/audio/Sunlight_on_the_Sandbox.mp3` 必须存在。
- 构建后的 JS 必须引用 `./audio/Sunlight_on_the_Sandbox.mp3`。

检查通过后，在 HBuilder X 中使用构建后的 `dist` 目录作为打包入口。不要直接使用项目根目录。

`test:browser:dist` 会启动一个只服务 `dist` 的本地静态服务器，并用 Playwright 检查生产产物是否能挂载、是否出现启动诊断、是否有 404 资源和页面运行时错误。

## 如果仍然白屏

继续查这几项：

- 先看页面是否出现“启动诊断”面板；如果出现，优先按面板里的错误信息处理。
- 安卓 WebView 是否过旧，不支持 ES module。
- HBuilder X 是否选择了错误的入口目录，应指向构建后的 `dist`。
- 真机调试控制台是否有 `Failed to load resource`、`MIME type` 或 `CORS` 报错。
- 如果是音频问题，只会影响 BGM，不应导致首屏白屏；首屏白屏优先看 JS/CSS 是否加载。
