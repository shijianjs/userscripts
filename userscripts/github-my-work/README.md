# GitHub My Work — 4-Column Dashboard

GitHub Issues / PR 四列工作台。安装后 GitHub 页面右下角会出现 `My Work` 按钮，打开后在四列 iframe 中分别展示个人 Issue、参与的 Issue、个人 PR 和参与的 PR。

## 安装

1. 安装 Tampermonkey、Violentmonkey 或兼容的用户脚本管理器。
2. 安装脚本：[github-my-work.user.js](https://raw.githubusercontent.com/shijianjs/userscripts/main/userscripts/github-my-work/github-my-work.user.js)
3. 安装并配置 [Header Ext](https://github.com/binge6/header-ext)，移除 `github.com` 的 `X-Frame-Options` 与 `Content-Security-Policy` 响应头。否则各列为空白，这是 GitHub 的 iframe 限制，脚本无法绕过。

## 使用

- 点击右下角 `My Work` 打开面板，`Close` 或 `Esc` 关闭。
- `Settings` 中可以修改四列的标题与 GitHub 搜索语法，保存后立即生效；设置保存在当前浏览器的 `localStorage`（键为 `github-my-work.settings.v1`）。
- 每列的 `Open ↗` 在新标签页打开对应的原生 GitHub 搜索页；`Reload all` 一次刷新全部列。
- 面板主题跟随 GitHub 的亮色、暗色或自动模式，并会在主题切换后更新。
- 四列是四个独立的 GitHub 页面，各自保留 GitHub 自己的筛选、分页和滚动行为，不是 API 聚合的数据列表。

## 默认查询

| 列 | 查询 |
| --- | --- |
| My Issues | `is:issue user:@me state:open sort:updated-desc` |
| Involved Issues | `is:issue involves:@me state:open sort:updated-desc` |
| My PRs | `is:pr user:@me state:open sort:updated-desc` |
| Involved PRs | `is:pr involves:@me state:open archived:false sort:updated-desc` |

## 安全说明

移除上述响应头会削弱 GitHub 的浏览器端防护。请把 Header Ext 规则限定在 `github.com`，不再使用时关闭。

脚本不需要 GitHub token，也不会把查询发送到外部服务；自定义设置只保存在本地浏览器。

## 更新日志

### 1.0.0

- 初始版本：可配置的四列 Issues / PR 工作台、主题跟随、窄屏横向滚动、设置持久化。
