# userscripts

个人使用的油猴脚本与 Stylus 用户样式。

## 目录结构

```
userscripts/              油猴脚本（Tampermonkey / Violentmonkey）
└── <脚本名>/            每个脚本一个文件夹
    ├── <脚本名>.user.js
    └── test/            可选，Playwright 运行时验证用例
userstyles/               Stylus 用户样式
└── <样式名>/            每个样式一个文件夹
    ├── <样式名>.user.css
    ├── README.md
    └── test/            可选，Playwright 运行时验证用例
```

`test/` 与 `userstyles/_lib/` 不参与分发。

每个脚本都是独立的单文件，没有构建步骤，仓库中的文件即为最终分发文件，可直接通过 raw 链接安装。

## 安装

### 油猴脚本

1. 安装 [Tampermonkey](https://www.tampermonkey.net/) 或 [Violentmonkey](https://violentmonkey.github.io/)。
2. 优先从 GreasyFork 安装（见下方脚本列表），可跟随版本自动更新。
3. 没有发布到 GreasyFork 的脚本，打开对应脚本的 raw 链接安装，扩展会自动弹出安装页：

   ```
   https://raw.githubusercontent.com/shijianjs/userscripts/main/userscripts/<脚本名>/<脚本名>.user.js
   ```

### Stylus 样式

1. 安装 [Stylus](https://github.com/openstyles/stylus)。
2. 优先从 userstyles.world 安装（见下方样式列表），可跟随版本自动更新。
3. 没有发布到 userstyles.world 的样式，打开对应样式文件夹里的 raw 链接安装：

   ```
   https://raw.githubusercontent.com/shijianjs/userscripts/main/userstyles/<样式名>/<样式名>.user.css
   ```

## 脚本列表

| 脚本 | 说明 | 安装 |
| --- | --- | --- |
| [GitHub My Work — 可配置工作台](userscripts/github-my-work/README.md) | 可配置的多列 GitHub Issues / PR 工作台，每列可用搜索条件或页面地址，需要 Header Ext 配合解除 iframe 限制 | [![GreasyFork](https://img.shields.io/badge/GreasyFork-v1.1.2-670000?logo=greasyfork&logoColor=white)](https://greasyfork.org/zh-CN/scripts/601775-github-my-work-configurable-dashboard) |

## 样式列表

| 样式 | 说明 | 安装 |
| --- | --- | --- |
| [bilibili 播放列表加长](userstyles/bilibili-playlist-longer/README.md) | 加长 bilibili 播放页右侧的播放列表 | [![userstyles.world](https://img.shields.io/badge/userstyles.world-16708-1e90ff)](https://userstyles.world/style/16708/bilibili) |
| [豆瓣读书列表宽屏优化](userstyles/douban-books-wide-list/README.md) | 用卡片网格展示豆瓣读书列表，适配大屏 | [![userstyles.world](https://img.shields.io/badge/userstyles.world-25313-1e90ff)](https://userstyles.world/style/25313/default-slug) |
| [bangumi 宽屏列表页优化](userstyles/bangumi-wide-list/README.md) | 用卡片网格展示 bangumi 列表页并铺满宽屏 | [![userstyles.world](https://img.shields.io/badge/userstyles.world-25327-1e90ff)](https://userstyles.world/style/25327/default-slug) |
| [bilibili 添加到收藏夹弹窗加大](userstyles/bilibili-fav-dialog-larger/README.md) | 放大收藏夹弹窗并把收藏夹列表改为卡片网格 | [![userstyles.world](https://img.shields.io/badge/userstyles.world-25895-1e90ff)](https://userstyles.world/style/25895/default-slug) |
| [雪球组合收益率曲线变细](userstyles/xueqiu-pie-curve-thinner/README.md) | 调细雪球组合页的收益率曲线 | [![userstyles.world](https://img.shields.io/badge/userstyles.world-26403-1e90ff)](https://userstyles.world/style/26403/default-slug) |
| [Better crates.io Search Layout](userstyles/crates-io-search-layout/README.md) | crates.io 搜索页宽屏化，响应式卡片网格 | [![userstyles.world](https://img.shields.io/badge/userstyles.world-29222-1e90ff)](https://userstyles.world/style/29222/default-slug) |

## 约定

- 油猴脚本一个脚本一个文件夹，Stylus 样式一个样式一个文件夹；文件夹名与主文件同名，使用 kebab-case。
- 油猴脚本使用 `.user.js` 后缀，文件顶部包含 `// ==UserScript==` 元数据块。
- Stylus 样式使用 `.user.css` 后缀，包含 `/* ==UserStyle== */` 元数据块。
- 每个脚本 / 样式文件夹都附一份 README.md。
- 可选的 `test/` 目录放 Playwright 运行时验证用例，不参与分发。
- 不引入构建步骤。

元数据示例：

```javascript
// ==UserScript==
// @name         示例脚本
// @namespace    https://github.com/shijianjs/userscripts
// @version      0.1.0
// @description  一句话说明
// @match        https://example.com/*
// @grant        none
// ==/UserScript==
```

```css
/* ==UserStyle==
@name         示例样式
@namespace    https://github.com/shijianjs/userscripts
@version      0.1.0
@description  一句话说明
@preprocessor default
==/UserStyle== */
```

## License

[MIT](LICENSE)
