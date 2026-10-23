# 雪球组合收益率曲线变细

[![userstyles.world](https://img.shields.io/badge/userstyles.world-26403-1e90ff)](https://userstyles.world/style/26403/default-slug)

调细雪球组合页的收益率曲线，减少视觉干扰。

## 安装

1. 安装 [Stylus](https://github.com/openstyles/stylus)。
2. 二选一安装：
   - 从 [userstyles.world](https://userstyles.world/style/26403/default-slug) 安装，可跟随版本自动更新；
   - 或直接从仓库安装（不自动更新）：[xueqiu-pie-curve-thinner.user.css](https://raw.githubusercontent.com/shijianjs/userscripts/main/userstyles/xueqiu-pie-curve-thinner/xueqiu-pie-curve-thinner.user.css)。

## 说明

- 仅作用于 `https://www.xueqiu.com/P/` 下的组合页。
- 把收益率曲线（`.chart svg path`）的 `stroke-width` 调为 `2`，让曲线更细、画面更清爽。

## 安全说明

- 纯 CSS 样式，不注入脚本、不发起网络请求、不读取或上传页面数据。
- `@-moz-document` 已把生效范围限定在雪球组合页，不影响其他站点。

## 运行时验证

`test/e2e.mjs` 通过 CDP 连接一个已开启调试端口的 Chrome，打开组合页，把本样式按 `@-moz-document` 条件注入后断言效果（用例不属于分发内容）：

```powershell
node userstyles/xueqiu-pie-curve-thinner/test/e2e.mjs
```

默认目标页是一个公开组合；若组合不存在，用 `STYLE_URL` 指定一个有效组合页。前置条件与启动测试实例的步骤见仓库根目录 [AGENTS.md](../../AGENTS.md)，可用环境变量覆盖本机差异：

| 变量 | 默认值 | 说明 |
| --- | --- | --- |
| `CDP_URL` | `http://127.0.0.1:9222` | 调试端点 |
| `PLAYWRIGHT_CORE` | 自动从全局 npm 目录查找 | `playwright-core` 所在路径 |
| `OUT_DIR` | `<仓库>/target/userstyles-xueqiu-pie-curve-thinner` | 截图输出目录 |
| `STYLE_URL` | `https://xueqiu.com/P/ZH3025080` | 覆盖目标页面 |

## 更新日志

### 1.0.1

- 补充无 `www` 的 `https://xueqiu.com/P/` 匹配，`stroke-width` 补 `!important`，清理模板注释。
- 新增运行时验证用例 `test/e2e.mjs`。

### 1.0.0

- 收录进本仓库，统一 `@namespace` / `@author` / `@description`。
