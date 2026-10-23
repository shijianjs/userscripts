# bilibili 播放列表加长

[![userstyles.world](https://img.shields.io/badge/userstyles.world-16708-1e90ff)](https://userstyles.world/style/16708/bilibili)

加长 bilibili 视频播放页右侧的播放列表，避免列表被高度截断。

## 安装

1. 安装 [Stylus](https://github.com/openstyles/stylus)。
2. 二选一安装：
   - 从 [userstyles.world](https://userstyles.world/style/16708/bilibili) 安装，可跟随版本自动更新；
   - 或直接从仓库安装（不自动更新）：[bilibili-playlist-longer.user.css](https://raw.githubusercontent.com/shijianjs/userscripts/main/userstyles/bilibili-playlist-longer/bilibili-playlist-longer.user.css)。

## 说明

- 仅作用于 `https://www.bilibili.com/video/` 下的播放页。
- 把播放列表容器（`.video-pod__body`）的高度上限改为 `calc(100vh - 350px)`，并解除原有的固定高度限制，让列表随窗口高度一起变长。

## 安全说明

- 纯 CSS 样式，不注入脚本、不发起网络请求、不读取或上传页面数据。
- `@-moz-document` 已把生效范围限定在 bilibili 播放页，不影响其他站点。

## 运行时验证

`test/e2e.mjs` 通过 CDP 连接一个已开启调试端口的 Chrome，打开目标页，把本样式按 `@-moz-document` 条件注入后断言效果（用例不属于分发内容）：

```powershell
node userstyles/bilibili-playlist-longer/test/e2e.mjs
```

目标页默认是单视频页；若未展开播放列表，用例会退化为合成同名节点验证规则本身，用 `STYLE_URL` 指向一个合集 / 多 P 视频可获得真实断言。前置条件与启动测试实例的步骤见仓库根目录 [AGENTS.md](../../AGENTS.md)，可用环境变量覆盖本机差异：

| 变量 | 默认值 | 说明 |
| --- | --- | --- |
| `CDP_URL` | `http://127.0.0.1:9222` | 调试端点 |
| `PLAYWRIGHT_CORE` | 自动从全局 npm 目录查找 | `playwright-core` 所在路径 |
| `OUT_DIR` | `<仓库>/target/userstyles-bilibili-playlist-longer` | 截图输出目录 |
| `STYLE_URL` | `https://www.bilibili.com/video/BV1x7aJ6LE4W/` | 覆盖目标页面（该示例视频带播放列表） |

## 更新日志

### 1.0.2

- 清理模板残留注释与冗余空行；`height: unset` 改为语义更明确的 `auto`。
- 新增运行时验证用例 `test/e2e.mjs`。

### 1.0.1

- 收录进本仓库，统一 `@namespace` / `@author` / `@description`。
