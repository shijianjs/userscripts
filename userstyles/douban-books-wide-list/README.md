# 豆瓣读书列表宽屏优化

[![userstyles.world](https://img.shields.io/badge/userstyles.world-25313-1e90ff)](https://userstyles.world/style/25313/default-slug)

用卡片网格展示豆瓣读书的列表，解决官方样式在大屏下只能竖排展示 4 本书的问题。

## 安装

1. 安装 [Stylus](https://github.com/openstyles/stylus)。
2. 二选一安装：
   - 从 [userstyles.world](https://userstyles.world/style/25313/default-slug) 安装，可跟随版本自动更新；
   - 或直接从仓库安装（不自动更新）：[douban-books-wide-list.user.css](https://raw.githubusercontent.com/shijianjs/userscripts/main/userstyles/douban-books-wide-list/douban-books-wide-list.user.css)。

## 说明

- 生效范围：
  - `https://book.douban.com/people/`
  - `https://book.douban.com/tag/`
  - `https://book.douban.com/subject_search`
  - `https://search.douban.com/book/`
- 把列表容器（`ul.interest-list`、`ul.subject-list` 等）从默认布局改为 `grid` 自适应列，每个条目以卡片（圆角、边框、阴影）呈现，宽屏下能铺开更多书。
- 只调整外层布局与卡片外观，不改 `.pic` / `.info` 等内部结构。

## 安全说明

- 纯 CSS 样式，不注入脚本、不发起网络请求、不读取或上传页面数据。
- `@-moz-document` 已把生效范围限定在豆瓣读书相关路径，不影响其他站点。

## 运行时验证

`test/e2e.mjs` 通过 CDP 连接一个已开启调试端口的 Chrome，打开目标页，把本样式按 `@-moz-document` 条件注入后断言效果（用例不属于分发内容）：

```powershell
node userstyles/douban-books-wide-list/test/e2e.mjs
```

豆瓣可能要求登录，未登录时会标为 SKIP（请在测试实例里登录豆瓣后重跑）。前置条件与启动测试实例的步骤见仓库根目录 [AGENTS.md](../../AGENTS.md)，可用环境变量覆盖本机差异：

| 变量 | 默认值 | 说明 |
| --- | --- | --- |
| `CDP_URL` | `http://127.0.0.1:9222` | 调试端点 |
| `PLAYWRIGHT_CORE` | 自动从全局 npm 目录查找 | `playwright-core` 所在路径 |
| `OUT_DIR` | `<仓库>/target/userstyles-douban-books-wide-list` | 截图输出目录 |
| `STYLE_URL` | `https://book.douban.com/tag/小说` | 覆盖目标页面 |

## 更新日志

### 1.0.1

- 合并重复注释、统一卡片外观的写法，补齐条目 `padding` / `box-shadow` 等声明的 `!important`。
- 新增运行时验证用例 `test/e2e.mjs`。

### 1.0.0

- 收录进本仓库，统一 `@namespace` / `@author` / `@description`。
