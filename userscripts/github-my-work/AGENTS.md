# GitHub My Work — 开发笔记

## 运行时验证

`test/e2e.mjs` 通过 CDP 连接一个已开启调试端口的 Chrome，验证 launcher、面板、动态列、
URL 列校验、增删列、提示条、语言切换、iframe 裁剪、主题同步、Esc 关闭和窄屏布局。
用例不属于分发内容，不需要也无法通过 raw 链接安装。

前置条件：测试实例里已安装配置好 Header Ext（否则 iframe 会被 `X-Frame-Options` 拦截），
且已登录 GitHub。

### 启动测试 Chrome 实例

```powershell
& "C:\Program Files\Google\Chrome\Application\chrome.exe" `
  --remote-debugging-port=9222 `
  --user-data-dir="S:\workspace\github\shijianjs\userscripts\target\p2" `
  --no-first-run --no-default-browser-check
```

该 profile（`target/p2`）已预装好所需插件、登录了 GitHub、配好了 Header Ext，可直接复用。
实例已在运行时不需要重复启动。

### 运行测试

```powershell
node userscripts/github-my-work/test/e2e.mjs
```

用例默认把仓库里的 `.user.js` 直接注入页面，验证当前工作区的代码；想验证 Tampermonkey
里已安装的版本时设置 `INJECT=0`。

可用环境变量覆盖本机差异（无需写入仓库）：

| 变量 | 默认值 | 说明 |
| --- | --- | --- |
| `CDP_URL` | `http://127.0.0.1:9222` | 调试端点 |
| `PLAYWRIGHT_CORE` | 自动从全局 npm 目录查找 | `playwright-core` 所在路径 |
| `OUT_DIR` | `<仓库>/target/gmw-screenshots` | 截图输出目录 |
| `INJECT` | `1` | `0` 表示使用 Tampermonkey 已安装的版本 |
