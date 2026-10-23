# userscripts

个人使用的油猴脚本与 Stylus 用户样式。

## 目录结构

```
userscripts/              油猴脚本（Tampermonkey / Violentmonkey）
└── <脚本名>/            每个脚本一个文件夹
    └── <脚本名>.user.js
styles/                   Stylus 用户样式，*.user.css
```

每个脚本都是独立的单文件，没有构建步骤，仓库中的文件即为最终分发文件，可直接通过 raw 链接安装。

## 安装

### 油猴脚本

1. 安装 [Tampermonkey](https://www.tampermonkey.net/) 或 [Violentmonkey](https://violentmonkey.github.io/)。
2. 打开对应脚本的 raw 链接，扩展会自动弹出安装页：

   ```
   https://raw.githubusercontent.com/shijianjs/userscripts/main/userscripts/<脚本名>/<脚本名>.user.js
   ```

### Stylus 样式

1. 安装 [Stylus](https://github.com/openstyles/stylus)。
2. 在 Stylus 管理面板中导入对应的 `.user.css` 文件，或访问 raw 链接后按提示安装。

## 脚本列表

| 脚本 | 说明 | 安装 |
| --- | --- | --- |
| [GitHub My Work — 4-Column Dashboard](userscripts/github-my-work/README.md) | 可配置的四列 GitHub Issues / PR 工作台，需要 Header Ext 配合解除 iframe 限制 | [安装](https://raw.githubusercontent.com/shijianjs/userscripts/main/userscripts/github-my-work/github-my-work.user.js) |

## 约定

- 一个脚本一个文件，文件名使用 kebab-case。
- 油猴脚本使用 `.user.js` 后缀，文件顶部包含 `// ==UserScript==` 元数据块。
- Stylus 样式使用 `.user.css` 后缀，建议包含 `/* ==UserStyle== */` 元数据块。
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
