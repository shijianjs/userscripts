# bangumi 宽屏列表页优化

[![userstyles.world](https://img.shields.io/badge/userstyles.world-25327-1e90ff)](https://userstyles.world/style/25327/default-slug)

用卡片样式展示 bangumi 的信息最全的那个列表页，尽量铺满屏幕。

## 安装

1. 安装 [Stylus](https://github.com/openstyles/stylus)。
2. 二选一安装：
   - 从 [userstyles.world](https://userstyles.world/style/25327/default-slug) 安装，可跟随版本自动更新；
   - 或直接从仓库安装（不自动更新）：[bangumi-wide-list.user.css](https://raw.githubusercontent.com/shijianjs/userscripts/main/userstyles/bangumi-wide-list/bangumi-wide-list.user.css)。

## 说明

- 生效范围：
  - `https://(bgm|bangumi).tv/` 下的 `browser` / `list` / `tag` 列表页；
  - `https://(bgm|bangumi).tv/subject_search/` 搜索页。
- 页面主体加宽到 `calc(100vw - 100px)`，条目列表（`#browserItemList.browserFull`）改为卡片网格，尽量铺满宽屏。
- 调整排名角标、收藏按钮的位置，以贴合卡片圆角。
- 只调整外层布局与卡片外观，不改内部结构。

## 安全说明

- 纯 CSS 样式，不注入脚本、不发起网络请求、不读取或上传页面数据。
- `@-moz-document` 已把生效范围限定在 bangumi 列表页与搜索页，不影响其他站点。

## 运行时验证

`test/e2e.mjs` 通过 CDP 连接一个已开启调试端口的 Chrome，打开目标页，把本样式按 `@-moz-document` 条件注入后断言效果（用例不属于分发内容）：

```powershell
node userstyles/bangumi-wide-list/test/e2e.mjs
```

bgm.tv 偶发 Cloudflare 安全验证，用例会等待并自动通过，仍被拦截时标为 SKIP。前置条件与启动测试实例的步骤见仓库根目录 [AGENTS.md](../../AGENTS.md)，可用环境变量覆盖本机差异：

| 变量 | 默认值 | 说明 |
| --- | --- | --- |
| `CDP_URL` | `http://127.0.0.1:9222` | 调试端点 |
| `PLAYWRIGHT_CORE` | 自动从全局 npm 目录查找 | `playwright-core` 所在路径 |
| `OUT_DIR` | `<仓库>/target/userstyles-bangumi-wide-list` | 截图输出目录 |
| `STYLE_URL` | `https://bgm.tv/anime/browser/` | 覆盖目标页面 |

## 更新日志

### 1.1.1

- 把搜索页专用规则合并进同一个 `@-moz-document`，减少重复条件；统一卡片外观写法、清理冗余注释。
- 新增运行时验证用例 `test/e2e.mjs`。

### 1.1.0

- 收录进本仓库，统一 `@namespace` / `@author` / `@description`。
