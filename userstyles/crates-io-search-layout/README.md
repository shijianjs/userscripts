# Better crates.io Search Layout

[![userstyles.world](https://img.shields.io/badge/userstyles.world-29222-1e90ff)](https://userstyles.world/style/29222/default-slug)

crates.io 的搜索 / 关键词 / 分类页宽屏化，以响应式卡片网格展示结果。

## 安装

1. 安装 [Stylus](https://github.com/openstyles/stylus)。
2. 二选一安装：
   - 从 [userstyles.world](https://userstyles.world/style/29222/default-slug) 安装，可跟随版本自动更新；
   - 或直接从仓库安装（不自动更新）：[crates-io-search-layout.user.css](https://raw.githubusercontent.com/shijianjs/userscripts/main/userstyles/crates-io-search-layout/crates-io-search-layout.user.css)。

## 说明

- 生效范围：
  - `https://crates.io/search`
  - `https://crates.io/keywords`
  - `https://crates.io/categories`
- 主内容区（`.width-limit`）扩展到 `calc(100vw - 100px)`，结果列表改为响应式卡片网格（每张卡片最小 `400px`），宽屏下排布更多结果。
- 卡片内统计项改为横向排布，悬停显示 `All-Time Downloads` / `Recent Downloads` / `Updated` 提示，并隐藏冗余的图标标签。
- 样式使用 CSS 嵌套语法（`&:hover`、`> li`），依赖浏览器原生 CSS nesting；Stylus 按默认预处理安装即可。

## 安全说明

- 纯 CSS 样式，不注入脚本、不发起网络请求、不读取或上传页面数据。
- `@-moz-document` 已把生效范围限定在 crates.io 的搜索、关键词与分类页，不影响其他站点。

## 运行时验证

`test/e2e.mjs` 通过 CDP 连接一个已开启调试端口的 Chrome，打开搜索结果页，把本样式按 `@-moz-document` 条件注入后断言效果（用例不属于分发内容）：

```powershell
node userstyles/crates-io-search-layout/test/e2e.mjs
```

前置条件与启动测试实例的步骤见仓库根目录 [AGENTS.md](../../AGENTS.md)，可用环境变量覆盖本机差异：

| 变量 | 默认值 | 说明 |
| --- | --- | --- |
| `CDP_URL` | `http://127.0.0.1:9222` | 调试端点 |
| `PLAYWRIGHT_CORE` | 自动从全局 npm 目录查找 | `playwright-core` 所在路径 |
| `OUT_DIR` | `<仓库>/target/userstyles-crates-io-search-layout` | 截图输出目录 |
| `STYLE_URL` | `https://crates.io/search?q=serde` | 覆盖目标页面 |

## 更新日志

### 1.1.1

- 整理嵌套缩进、删除空行里的尾随空格与重复声明，卡片内边距补 `!important`。
- 新增运行时验证用例 `test/e2e.mjs`。

### 1.1.0

- 收录进本仓库，统一 `@namespace` / `@author` / `@description`。
