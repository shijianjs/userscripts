# AGENTS.md

本仓库存放个人使用的油猴脚本（Tampermonkey / Violentmonkey）与 Stylus 用户样式。

## 代码风格（硬性要求）

面向对象、保留模式 UI。目标是**用原生 DOM API 对界面做面向对象封装**，不是 mini React / mini Lit。
本机 `../duckfn/duckfn-docs-kit/CONVENTIONS.md` 的「代码风格（硬性要求）」是完整版（TypeScript），
这里是落到本仓库（单个 IIFE + 原生 JS）的裁剪版；两者冲突时以措辞更严格的为准。

### 0. 设计目标：保留 DOM 节点，不重建

按优先级裁决（上面的赢）：

1. 保留 DOM 节点 —— 节点长期存在，不随状态重建
2. 类的字段持有 DOM 引用
3. 直接修改 DOM（property / attribute / text / class / 事件监听）
4. 局部更新
5. 必要时才替换**局部集合**
6. 禁止整组件 re-render
7. 禁止用响应式 state 驱动 render
8. 禁止引入 React / Vue / Lit 等 UI runtime 或其设计模式

### 1. 禁止拼 HTML 字符串

不许 `innerHTML = \`...\``、不许 `insertAdjacentHTML`、不许「模板字符串生成标记再塞进 DOM」。
`<style>` 和 `srcdoc` 里的 CSS / HTML 文本不在此列（那不是运行时拼结构）。

### 2. DOM 用对象操作，字段持有引用

- `document.createElement` 创建，**类的字段持有引用**，直接对字段调方法。
- **`querySelector` 不得当作组件内部的状态管理方式**。需要反复访问的节点一律存成字段；
  `querySelector` 只允许出现在「从外部文档找目标」（例如去找宿主页面里的
  `[data-component="PageLayout.Content"]`）这类不属于组件自身结构的地方。
- 纯结构节点用 `el()` 建，不必展开成 `createElement` + 逐行赋值。`class` / `text` 是
  `className` / `textContent` 的简写，`attrs` 兜底放 `aria-*` / `data-*` 与自定义元素属性：

  ```js
  this.#logo = el('img', { src: LOGO_URL, class: 'gmw-logo', alt: '' });
  ```

- `el()` 的第三个参数是可选的 `init` 回调，用来就地描述不会再被单独引用的结构；
  需要反复访问的节点仍然存成字段。
- `init` 里不要读**声明顺序在其后**的 `#字段`（字段初始化器按声明顺序求值，会踩 TDZ）。

### 3. 更新是局部、直接、明确的；不得有通用刷新机制

状态变化 = 改**相关的那几个**节点，用命名的领域 setter 表达，而不是把整个 UI 当成
`data` 的函数重新算一遍：

```js
setView(view, index) {
  this.#title.textContent = view.title;
  this.#frame.src = view.value;
}
```

改哪一处用**标准 DOM API** 直说：`textContent`、`setAttribute` / `removeAttribute`、
`classList.add/remove/toggle`、`hidden`、`disabled`、`value`、`href` / `src` 赋值。
除此之外不要再找第三种写法。

**必须避免**的形态：

```js
set data(value) { this.#data = value; this.render(); }        // 响应式 state 驱动 render
update(data) { this.replaceChildren(); this.render(data); }   // 用替换子树模拟更新
render(data) { /* 根据 data 重新构建整个 DOM */ }              // 通用刷新机制
rebuild() { this.replaceChildren(); this.build(); }           // 同上，换个名字而已
```

不允许实现 `render()` / `rebuild()` / `rerender()` 这类**通用**刷新机制；
不允许因为一个字段变化就重建整个子树；不允许通过「替换子树」模拟响应式更新。

多语言这类「一次影响多个组件」的变化，由各组件自己的 `retranslate()`（只重写自己的文本节点）
实现，由上层统一调用，而不是整体重建。

### 4. `replaceChildren()` 的分级用法

`replaceChildren()` 本身不是禁品，禁的是把它当**整组件的通用 render 机制**：

- 允许：确实需要整体更新的局部集合（一次给出全新条目、图标这种固定组合）。
- 禁止：清空组件自己的根子树再重建（即第 3 条的 `rebuild()`）。
- 变长集合能增量就增量：按数据长度**增删条目**、复用已有条目对象，只有条目语义整体失效时才整批替换。

### 5. 内容入口：命名的领域 setter

- 组件不接受整份 data blob，也没有通用的 `render` / `apply` / `update` 入口。
- 一个 setter 只碰它负责的那部分节点；因此**在节点尚未连接时调用也安全**。
- 不做 attribute reflection（内容不是可序列化的标记）：内容入口只有 setter。
  例外是图标这类「自有节点上的 `icon` 属性」。
- 新增字段就加一个对应的 setter，不要回头引入通用入口。

### 6. 生命周期与监听器

- 优先在 `constructor()` 里创建静态结构并组装完毕，`mount()` 之类只做**必要的一次性初始化**。
  不要把「挂载 → 重建 → 组装」当成标准渲染生命周期。
- 挂在**自有节点**上的监听器写在构造函数里，随节点同生命周期，不需要清理。
- 挂在**外部对象**（`document` / `window` / `matchMedia`）上的监听器要能说清注册时机，
  重复初始化时不要重复注册。

### 7. 尽量类化，但没有「组件基类」

一个关注点一个 class（设置、视图、单列、表单行、面板、图标……），各自持有自己的字段与
setter。不要做 `create()` / `apply()` 之类的模板方法抽象 —— 那会把「状态驱动刷新」重新引进来。
函数式导出只留给真正的纯工具（`el()`、`normalizeUrl()`、`detectLanguage()` 这类）。

### 8. 图标一律用 `<iconify-icon>` web component

- `document.createElement('iconify-icon')` + `setAttribute('icon', 'lucide:x')`，
  尺寸/颜色用 CSS 作用在元素上（字形自带 `currentColor`），**尺寸只认 `font-size`**。
- **不要**自己封装 SVG 去替代图标。唯一例外：`iconify-icon` 在宿主站点上确实渲染不出来时的
  **降级**（例如 github.com 自带一份不完整的 iconify 缓存，第三方组件取不到图标），
  且降级实现要作为一个独立类存在、只在检测到渲染失败后启用。

### 9. 默认用 Shadow DOM

- 面板类界面默认渲染进 `attachShadow({mode: 'open'})`，样式随结构注入，宿主页面的全局 CSS
  进不来、样式也漏不出去，不必靠类名前缀避免污染。
- CSS 自定义属性会继承穿过 shadow 边界，但 `box-sizing` **不是**继承属性，所以 shadow 内要
  自己重新声明 `* { box-sizing: border-box }`。
- 主题跟随宿主时，把宿主的状态读出来写到 shadow 宿主元素自己的 `data-*` 上，在 `:host([data-*])`
  里切换变量；不要在 shadow 内写依赖宿主 class 的选择器。
- 例外（万不得已才退回 light DOM）：必须直接复用宿主页面既有 DOM / CSS 时（例如给宿主页面的
  iframe 注入样式），这种代码要能说清「依赖了宿主的哪条规则」。

## 目录结构

```
userscripts/<脚本名>/   油猴脚本，<脚本名>.user.js + README.md
userscripts/<脚本名>/test/  可选，Playwright 运行时验证用例，不参与分发
userstyles/             Stylus 用户样式，*.user.css
```

## 核心约定

- 单文件、无构建步骤。仓库中的文件就是最终分发文件，任何修改必须可直接通过 raw 链接安装。
- 不引入打包器、依赖、生成产物或压缩版本。
- 文件名使用 kebab-case；油猴脚本一个脚本一个文件夹，文件夹名与 `.user.js` 文件同名。
- 新增或修改脚本时，保持文件顶部元数据块完整。
- `test/` 下的文件不属于分发内容，不得被 `.user.js` 引用、内联或提交到安装路径。

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

### 用 Playwright 连 Chrome 做运行时验证

临时脚本、配置副本、截图一律放 `target/`（已在 `.gitignore` 中），不提交、不放仓库其他位置。

Chrome 从 136 起对**默认用户目录**禁用远程调试，因此不能直接给日常使用的 Chrome 加 `--remote-debugging-port`。正确做法是复制一份配置再启动：

```powershell
# 0. 先完全退出 Chrome，避免复制到半写入的文件
Get-Process chrome -ErrorAction SilentlyContinue | Stop-Process
Start-Sleep 3

# 1. 复制配置到 target/，排除缓存目录（约 250 MB）
robocopy "$env:LOCALAPPDATA\Google\Chrome\User Data" "$PWD\target\profile" /E `
  /XD Cache "Code Cache" GPUCache DawnCache DawnGraphiteCache DawnWebGPUCache `
      ShaderCache GrShaderCache "Service Worker" Crashpad component_crx_cache extensions_crx_cache `
  /XF LOCK /NFL /NDL /NJH /NJS

# 2. 用复制出来的目录启动，扩展、登录态、油猴脚本都随配置一起带过来
& "C:\Program Files\Google\Chrome\Application\chrome.exe" `
  --remote-debugging-port=9222 --user-data-dir="$PWD\target\profile" `
  --proxy-server=http://127.0.0.1:7890 --no-first-run --no-default-browser-check
```

脚本侧：

```js
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
// 复用全局 @playwright/cli 自带的 playwright-core，无需 npm install：
// 先执行 `npm root -g` 拿到全局 node_modules 路径，替换下面占位符即可。
const { chromium } = require('<npm root -g>/@playwright/cli/node_modules/playwright-core');

const browser = await chromium.connectOverCDP('http://127.0.0.1:9222');
```

注意事项：

- **不要用目录联接（`mklink /J`）指向真实配置目录**。Chrome 会把通过链接加载的扩展判为损坏并卸载，实测会清掉 Tampermonkey、Stylus 等扩展目录（扩展数据仍在 `Local Extension Settings`，重装扩展即可恢复）。
- 不要用 `Stop-Process -Force` 杀默认配置的 Chrome；可能打断扩展自动更新并留下损坏状态。清理测试实例时只杀命令行里带自己 `--user-data-dir` 的进程。
- 国内网络必须给测试实例加 `--proxy-server`，否则 `page.goto()` 报 `ERR_CONNECTION_RESET`。
- 验证 iframe / 响应头相关行为时，**不要在页面里 `fetch()` 看响应头**：Header Ext 这类扩展同样会剥掉该请求的头，结果会误导（曾据此错判 GitHub 不再发 `X-Frame-Options`）。用 `curl --proxy ... -D -` 绕开浏览器核对。
- 复制配置时如果原 Chrome 未登录目标站点，复制品也没有登录态；需要先在测试实例里手动登录一次。
- Chrome 156 实测 `--load-extension` 不生效，不要再试图用临时扩展代替油猴管理器注入脚本。

## 文档

根目录 [README.md](README.md) 维护安装方式、元数据示例和脚本索引。

每个脚本文件夹包含自己的 `README.md`，说明用途、依赖、安装步骤、使用方式、安全注意事项和更新日志。新增脚本时同时更新这两处。
