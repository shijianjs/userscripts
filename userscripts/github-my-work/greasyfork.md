## 功能

GitHub 页面右下角会多出一个「我的工作」按钮，点开后是可配置的多列工作台：每列用一个 iframe 展示一个 GitHub 页面，默认四列分别是我的 Issue、我参与的 Issue、我的 PR、我参与的 PR。

- 每列可选「搜索条件」或任意 `github.com` 页面地址，1–8 列可增删
- 搜索条件列会自动裁剪 iframe，只保留 issues / PR 列表内容区，隐藏重复的 GitHub 顶栏、侧栏与页脚
- 面板主题跟随 GitHub 的亮色 / 暗色模式，切换时 iframe 内同步
- 中英文界面，可自动检测，也可在设置里固定
- 设置只保存在本地 `localStorage`，不需要 GitHub token

## ⚠️ 必须先安装 Header Ext

各列是 GitHub 自己的页面，而 GitHub 通过 `X-Frame-Options` 与 `Content-Security-Policy` 禁止被 iframe 嵌入。脚本无法从页面内部绕过，需要在浏览器层面移除这两个响应头：

1. 安装 [Header Ext](https://github.com/binge6/header-ext)
2. 添加规则：对 `github.com` 移除 `X-Frame-Options` 和 `Content-Security-Policy`

不安装的话，面板与设置都能正常使用，但每一列都是空白（这是预期行为，面板顶部的提示条也会说明）。

移除这两个响应头会削弱 GitHub 的浏览器端防护，请把规则限定在 `github.com`，不用时关闭。

## 使用

- 右下角「我的工作」打开面板；右上角 `×` 图标按钮随时关闭，`Esc` 也可以
- 「设置」里可改每列标题、切换「搜索条件 / 页面地址」、增删列、切换界面语言
- 设置页的「保存并应用 / 恢复默认 / 取消」在顶部工具栏
- 每列的「打开 ↗」在新标签页打开对应页面，「全部刷新」刷新所有列
- `?` 图标可重新显示被关掉的提示条

## 默认列

| 列 | 内容 |
| --- | --- |
| 我的 Issue | `is:issue user:@me state:open sort:updated-desc` |
| 我参与的 Issue | `is:issue involves:@me state:open sort:updated-desc` |
| 我的 PR | `is:pr user:@me state:open sort:updated-desc` |
| 我参与的 PR | `is:pr involves:@me state:open archived:false sort:updated-desc` |

## 权限与隐私

- `@grant none`：不使用任何 GM API，不读取 cookie，不请求 GitHub token
- 图标组件（iconify-icon 3.0.4）通过脚本头部的 `@require` 由用户脚本管理器下载并缓存，图标字形再由它从 Iconify API 获取；断网时按钮照常工作，只是图标空白
- 设置保存在本地 `localStorage`，键为 `github-my-work.settings.v2`；1.0 的旧格式会自动迁移

## 更新日志

### 1.2.0

- 工具栏「设置」「全部刷新」与设置页「保存并应用」「恢复默认」「取消」按钮加图标；右下角「我的工作」按钮加 `briefcase` 图标，样式与「添加一列」一致。

### 1.1.2

- 图标改用 `@require` 引入 iconify-icon 3.0.4，下载与缓存交给用户脚本管理器
- 移除渲染失败时的内嵌图形降级

### 1.1.1

- 补充本地化元数据（中文名称与描述）以及首页、反馈地址

### 1.1.0

- 每列可选「搜索条件」或「页面地址」，列数 1–8 可增删
- 查询列裁剪 iframe，只保留列表内容区并同步明暗主题
- 提示条可关闭，工具栏 `?` 图标可重新显示
- 关闭按钮改为全局图标按钮，设置页操作按钮移到顶部工具栏
- 设置页列卡片改为两行布局并网格多列排布
- 支持中英文界面；设置格式升级为 v2 并兼容 v1
- 图标改用 iconify web component，失败时退回内嵌 lucide 图形

### 1.0.0

- 初始版本：可配置的四列 Issues / PR 工作台、主题跟随、窄屏横向滚动、设置持久化

## 源码

https://github.com/shijianjs/userscripts/tree/main/userscripts/github-my-work
