# bilibili 添加到收藏夹弹窗加大

[![userstyles.world](https://img.shields.io/badge/userstyles.world-25895-1e90ff)](https://userstyles.world/style/25895/default-slug)

放大 bilibili「添加到收藏夹」弹窗，并把收藏夹列表改为卡片网格。

## 安装

1. 安装 [Stylus](https://github.com/openstyles/stylus)。
2. 二选一安装：
   - 从 [userstyles.world](https://userstyles.world/style/25895/default-slug) 安装，可跟随版本自动更新；
   - 或直接从仓库安装（不自动更新）：[bilibili-fav-dialog-larger.user.css](https://raw.githubusercontent.com/shijianjs/userscripts/main/userstyles/bilibili-fav-dialog-larger/bilibili-fav-dialog-larger.user.css)。

## 说明

- 作用于 `bilibili.com`。
- 把「添加到收藏夹」弹窗加宽到 `80vw`，高度上限 `80vh`，内容区可滚动。
- 弹窗里的收藏夹列表（`.group-list > ul`）改为卡片网格，每个收藏夹以卡片呈现。
- 收藏夹分组管理区域（`.fav-collapse-wrap`）高度放大到 `90vh`。

## 安全说明

- 纯 CSS 样式，不注入脚本、不发起网络请求、不读取或上传页面数据。
- `@-moz-document` 已把生效范围限定在 `bilibili.com`，不影响其他站点。

## 运行时验证

`test/e2e.mjs` 通过 CDP 连接一个已开启调试端口的 Chrome，打开视频页、注入本样式并点开「添加到收藏夹」弹窗后断言效果（用例不属于分发内容）：

```powershell
node userstyles/bilibili-fav-dialog-larger/test/e2e.mjs
```

需要测试实例已登录 bilibili，否则找不到收藏按钮 / 弹窗打不开，会标为 SKIP。前置条件与启动测试实例的步骤见仓库根目录 [AGENTS.md](../../AGENTS.md)，可用环境变量覆盖本机差异：

| 变量 | 默认值 | 说明 |
| --- | --- | --- |
| `CDP_URL` | `http://127.0.0.1:9222` | 调试端点 |
| `PLAYWRIGHT_CORE` | 自动从全局 npm 目录查找 | `playwright-core` 所在路径 |
| `OUT_DIR` | `<仓库>/target/userstyles-bilibili-fav-dialog-larger` | 截图输出目录 |
| `STYLE_URL` | `https://www.bilibili.com/video/BV1x7aJ6LE4W/` | 覆盖目标页面 |

## 更新日志

### 1.0.1

- 补齐 `padding` 的 `!important`，`unset` 改为语义更明确的 `auto` / `none`，清理模板注释。
- 新增运行时验证用例 `test/e2e.mjs`。

### 1.0.0

- 收录进本仓库，统一 `@namespace` / `@author` / `@description`。
