# AGENTS.md

本仓库存放个人使用的油猴脚本（Tampermonkey / Violentmonkey）与 Stylus 用户样式。

## 目录结构

```
userscripts/   油猴脚本，*.user.js
styles/        Stylus 用户样式，*.user.css
```

## 核心约定

- 单文件、无构建步骤。仓库中的文件就是最终分发文件，任何修改必须可直接通过 raw 链接安装。
- 不引入打包器、依赖、生成产物或压缩版本。
- 文件名使用 kebab-case，一个脚本一个文件。
- 新增或修改脚本时，保持文件顶部元数据块完整。

### 油猴脚本

- 必须包含 `// ==UserScript==` ... `// ==/UserScript==` 元数据块。
- `@namespace` 固定为 `https://github.com/shijianjs/userscripts`。
- `@version` 使用 semver，分发内容变化时递增。
- `@match` 尽量精确，避免 `*://*/*`；需要多个站点时逐条列出。
- `@grant` 遵循最小权限：不需要 GM API 时用 `none`，需要时逐项声明。
- `@run-at` 默认不写（即 `document-idle`），确有需要再显式指定。

### Stylus 样式

- 使用 `.user.css` 后缀，建议包含 `/* ==UserStyle== */` 元数据块。
- 域名限定使用 `@-moz-document domain(...)` / `url-prefix(...)`，范围尽量窄。
- 需要用户可调参数时使用 Stylus 的 `@var` 定义，而不是硬编码。

## 验证

- 修改 `.user.js` 后至少执行 `node --check <文件>` 确认语法正确。
- 样式与运行时行为无法自动验证；涉及页面行为的变化需在浏览器中手动安装确认，交付时如实说明未验证部分。

## 文档

安装方式、元数据示例见 [README.md](README.md)。新增脚本后在 README 中补一行索引即可，不必生成额外文档。
