// GitHub My Work 运行时验证用例
//
// 通过 CDP 连到一个已开启调试端口的 Chrome（配置里需已装好 Header Ext 并登录 GitHub），
// 逐项验证 launcher、面板、动态列、URL 列、增删列、提示条、语言、iframe 裁剪、
// 主题、Esc 关闭和窄屏布局。
//
// 用例默认把仓库里的 .user.js 直接注入页面，从而验证当前工作区的代码，而不是
// Tampermonkey 里可能过期的副本；已存在的旧实例会先被移除。若想验证 TM 安装版本，
// 设置 INJECT=0。
//
// 运行前请按根目录 AGENTS.md「用 Playwright 连 Chrome 做运行时验证」准备实例：
//
//   node userscripts/github-my-work/test/e2e.mjs
//
// 可通过环境变量覆盖本机差异，不写入仓库：
//
//   CDP_URL         调试端点，默认 http://127.0.0.1:9222
//   PLAYWRIGHT_CORE playwright-core 所在路径，默认自动从全局 npm 目录查找
//   OUT_DIR         截图输出目录，默认 <仓库>/target/gmw-screenshots
//   INJECT          1（默认）注入仓库里的脚本；0 使用 Tampermonkey 已安装版本

import { createRequire } from 'node:module';
import { execSync } from 'node:child_process';
import { mkdirSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, '../../..');
const scriptPath = resolve(here, '../github-my-work.user.js');

const CDP_URL = process.env.CDP_URL || 'http://127.0.0.1:9222';
const OUT_DIR = process.env.OUT_DIR || join(repoRoot, 'target', 'gmw-screenshots');
const INJECT = process.env.INJECT !== '0';
const STORAGE_KEY = 'github-my-work.settings.v2';
const ICON_ICONIFY = 'https://cdn.jsdelivr.net/npm/iconify-icon@2.1.0/dist/iconify-icon.min.js';

const DEFAULT_QUERIES = [
  'is:issue user:@me state:open sort:updated-desc',
  'is:issue involves:@me state:open sort:updated-desc',
  'is:pr user:@me state:open sort:updated-desc',
  'is:pr involves:@me state:open archived:false sort:updated-desc',
];

function loadPlaywrightCore() {
  const candidates = [];
  if (process.env.PLAYWRIGHT_CORE) candidates.push(process.env.PLAYWRIGHT_CORE);
  try {
    const globalRoot = execSync('npm root -g', { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
    candidates.push(join(globalRoot, '@playwright', 'cli', 'node_modules', 'playwright-core'));
    candidates.push(join(globalRoot, 'playwright-core'));
    candidates.push(join(globalRoot, 'playwright'));
  } catch {
    // 没有 npm 时只依赖显式配置或本地安装
  }
  candidates.push('playwright-core', 'playwright');

  for (const candidate of candidates) {
    try {
      return require(candidate);
    } catch {
      // 换下一个候选路径
    }
  }
  throw new Error(
    '找不到 playwright-core。请执行 npm i -D playwright-core，或设置 PLAYWRIGHT_CORE=<playwright-core 目录>。',
  );
}

const { chromium } = loadPlaywrightCore();
const scriptSource = readFileSync(scriptPath, 'utf8');
mkdirSync(OUT_DIR, { recursive: true });

const checks = [];
const pageErrors = [];

function check(name, ok, detail = '') {
  checks.push({ name, ok: Boolean(ok), detail: String(detail).slice(0, 400) });
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ` :: ${String(detail).slice(0, 260)}` : ''}`);
}

function ownErrors() {
  return pageErrors.filter(item => item.stack.includes('github-my-work.user.js') || item.message.includes('[GitHub My Work]'));
}

function fatal(message) {
  console.error(`\n无法开始测试：${message}`);
  process.exit(2);
}

const browser = await chromium.connectOverCDP(CDP_URL).catch((error) => {
  fatal(`连不上 ${CDP_URL}（${error.message}）。请确认调试实例已启动、端口正确。`);
});

const context = browser.contexts()[0];
if (!context) fatal('CDP 连接成功但没有可用的浏览器上下文。');

let page = context.pages().find(p => p.url().startsWith('about:')) ?? context.pages()[0];
if (!page) page = await context.newPage();
page.on('pageerror', error => pageErrors.push({ message: error.message, stack: error.stack ?? '' }));
page.on('console', message => {
  if (message.type() === 'error' && message.text().includes('[GitHub My Work]')) {
    pageErrors.push(message.text());
  }
});

const launcher = page.locator('#gmw-launcher');
const panel = page.locator('#gmw-panel');
const notices = page.locator('.gmw-notice');
const columnTitles = page.locator('.gmw-column .gmw-heading strong');
const columnFrames = page.locator('.gmw-column iframe');

// 移除 Tampermonkey 可能注入的旧版本，再注入工作区里的脚本
async function injectCurrentScript() {
  if (!INJECT) {
    await launcher.waitFor({ state: 'visible', timeout: 20000 });
    return;
  }
  await page.evaluate(() => {
    document.getElementById('gmw-launcher')?.remove();
    document.getElementById('gmw-panel')?.remove();
    document.querySelector('gmw-app')?.remove();
  });
  // sourceURL 让运行时异常带上脚本名，便于区分是不是本脚本的错
  await page.addScriptTag({ content: scriptSource + '\n//# sourceURL=github-my-work.user.js' });
  await launcher.waitFor({ state: 'visible', timeout: 20000 });
}

async function loadPage(url = 'https://github.com/') {
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 90000 });
  await page.waitForTimeout(800);
  await injectCurrentScript();
}

async function openPanel() {
  if (!(await panel.evaluate(el => el.classList.contains('gmw-open')))) {
    await launcher.click();
  }
  await panel.waitFor({ state: 'visible' });
  await page.waitForTimeout(300);
}

async function openSettings() {
  await page.locator('.gmw-toolbar .gmw-spacer + button + button').click();
  await page.locator('.gmw-settings.gmw-visible').waitFor({ state: 'visible' });
}

async function saveSettings() {
  await page.getByRole('button', { name: /Save and apply|保存并应用/ }).click();
  await page.waitForTimeout(400);
}

await page.setViewportSize({ width: 1440, height: 900 });
await page.bringToFront();
await page.goto('https://github.com/', { waitUntil: 'domcontentloaded', timeout: 90000 });
await page.evaluate(() => {
  localStorage.removeItem('github-my-work.settings.v2');
  localStorage.removeItem('github-my-work.settings.v1');
});
await loadPage();

const login = await page.locator('meta[name="user-login"]').getAttribute('content').catch(() => '');
if (!login) fatal('当前 Chrome 配置未登录 GitHub。请在测试实例里登录后再运行本用例。');
check('已登录 GitHub', true, login);

// launcher：亮色模式下可见、文字与背景对比正常
const launcherStyle = await launcher.evaluate(el => {
  const style = getComputedStyle(el);
  return { color: style.color, background: style.backgroundColor, text: el.textContent.trim() };
});
check(
  'launcher 亮色模式可见且对比正常',
  launcherStyle.text.length > 0 &&
    launcherStyle.background !== 'rgba(0, 0, 0, 0)' &&
    launcherStyle.color !== launcherStyle.background,
  JSON.stringify(launcherStyle),
);
await page.screenshot({ path: join(OUT_DIR, '01-launcher.png') });

await openPanel();
check('面板打开', await panel.evaluate(el => getComputedStyle(el).display === 'flex'));
check('launcher 打开后隐藏', !(await launcher.isVisible()));

// 默认四列
const titles = await columnTitles.allTextContents();
check('默认四列', titles.length === 4, JSON.stringify(titles));

const links = await page.locator('.gmw-column .gmw-heading a').evaluateAll(anchors =>
  anchors.map(anchor => anchor.getAttribute('href')),
);
check('打开链接指向 GitHub 搜索页', links.length === 4 && links.every(href => href.startsWith('/issues?q=')), JSON.stringify(links));

const srcs = await columnFrames.evaluateAll(nodes => nodes.map(node => decodeURIComponent(node.getAttribute('src') ?? '')));
check(
  '默认搜索条件写入 iframe',
  DEFAULT_QUERIES.every((query, index) => srcs[index]?.endsWith(query)),
  JSON.stringify(srcs.map(src => src.slice(0, 30))),
);

// 图标：iconify web component 已加载；渲染不出来时用内嵌 svg 兜底，两者都必须是 svg
await page.waitForFunction(() => Boolean(window.customElements.get('iconify-icon')), null, { timeout: 15000 }).catch(() => {});
await page.waitForFunction(() => {
  const hasSvg = node => Boolean(node.querySelector('svg'))
    || Boolean(node.querySelector('iconify-icon')?.shadowRoot?.querySelector('svg'));
  const nodes = [...document.querySelector('gmw-app').shadowRoot.querySelectorAll('.gmw-icon')];
  return nodes.length >= 3 && nodes.every(hasSvg);
}, null, { timeout: 20000 }).catch(() => {});
const icons = await page.locator('.gmw-icon').evaluateAll(nodes => nodes.map(node => ({
  icon: node.querySelector('iconify-icon')?.getAttribute('icon') ?? 'inline-svg',
  svg: Boolean(node.querySelector('svg')) || Boolean(node.querySelector('iconify-icon')?.shadowRoot?.querySelector('svg')),
})));
check('iconify-icon 已定义', await page.evaluate(() => Boolean(window.customElements.get('iconify-icon'))));
check('图标渲染为 svg', icons.length >= 3 && icons.every(icon => icon.svg), JSON.stringify(icons));
await page.screenshot({ path: join(OUT_DIR, '02-panel.png') });

// 提示条：关闭 / 帮助按钮开关 / 持久化
check('提示条默认显示', await notices.isVisible());
await page.locator('.gmw-notice .gmw-icon-button').click();
await page.waitForTimeout(200);
check('关闭按钮隐藏提示条', !(await notices.isVisible()));
await page.reload({ waitUntil: 'domcontentloaded' });
await page.waitForTimeout(600);
await injectCurrentScript();
await openPanel();
check('提示条关闭状态被记住', !(await notices.isVisible()));
await page.locator('.gmw-toolbar .gmw-icon-button').first().click();
await page.waitForTimeout(200);
check('帮助按钮重新显示提示条', await notices.isVisible());
await page.reload({ waitUntil: 'domcontentloaded' });
await page.waitForTimeout(600);
await injectCurrentScript();
await openPanel();
check('提示条显示状态被记住', await notices.isVisible());

// iframe 裁剪：只剩 PageLayout.Content，页头/页脚被隐藏
const frameReports = [];
for (const handle of await columnFrames.elementHandles()) {
  const frame = await handle.contentFrame();
  if (!frame) {
    frameReports.push({ missing: true });
    continue;
  }
  await frame.waitForLoadState('domcontentloaded', { timeout: 30000 }).catch(() => {});
  await page.waitForTimeout(1200);
  frameReports.push(await frame.evaluate(() => {
    const content = document.querySelector('[data-component="PageLayout.Content"]');
    const header = document.querySelector('[data-component="PageLayout.Header"]');
    const footer = document.querySelector('footer');
    const isHidden = node => !node || getComputedStyle(node).display === 'none' || node.offsetHeight === 0;
    return {
      bodyText: document.body ? document.body.innerText.trim().length : -1,
      blocked: /refused to connect/i.test(document.title),      hasContent: Boolean(content),
      headerHidden: isHidden(header),
      footerHidden: isHidden(footer),
      styleInjected: Boolean(document.getElementById('gmw-frame-style')),
      searchInput: Boolean(document.querySelector('input[name^="issues-"], react-app, a[href*="/issues/new"]')),
      contentVisible: Boolean(content) && content.getBoundingClientRect().width > 0,
    };
  }).catch(error => ({ error: String(error) })));
}
for (const report of frameReports) console.log('  frame:', JSON.stringify(report));
check('iframe 未被拦截', frameReports.every(report => !report.blocked && report.bodyText > 20), JSON.stringify(frameReports.map(r => r.bodyText)));
check('iframe 内是 Issues 页面', frameReports.every(report => report.searchInput));
check(
  'iframe 注入裁剪样式并保留内容区',
  frameReports.every(report => report.styleInjected && report.hasContent && report.contentVisible),
  JSON.stringify(frameReports.map(r => ({ s: r.styleInjected, c: r.hasContent }))),
);
check('iframe 内页头与页脚被隐藏', frameReports.every(report => report.headerHidden && report.footerHidden));
await page.screenshot({ path: join(OUT_DIR, '03-panel-trimmed.png') });

// 主题跟随
await page.evaluate(() => document.documentElement.setAttribute('data-color-mode', 'dark'));
await page.waitForTimeout(400);
const darkState = await page.evaluate(() => {
  const host = document.querySelector('gmw-app');
  const panelEl = host.shadowRoot.getElementById('gmw-panel');
  return { hostTheme: host.getAttribute('data-theme'), panelTheme: panelEl.getAttribute('data-theme'), bg: getComputedStyle(panelEl).backgroundColor };
});
check('主题跟随 GitHub 切到暗色', darkState.hostTheme === 'dark' && darkState.panelTheme === 'dark' && darkState.bg === 'rgb(13, 17, 23)', JSON.stringify(darkState));
await page.waitForTimeout(1500);
const darkFrames = [];
for (const handle of await columnFrames.elementHandles()) {
  const frame = await handle.contentFrame();
  darkFrames.push(await frame.evaluate(() => ({
    mode: document.documentElement.getAttribute('data-color-mode'),
    bg: getComputedStyle(document.body).backgroundColor,
  })).catch(() => null));
}
check('iframe 内容跟随暗色主题', darkFrames.every(frame => frame && frame.mode === 'dark'), JSON.stringify(darkFrames));
await page.screenshot({ path: join(OUT_DIR, '04-dark.png') });
await page.evaluate(() => document.documentElement.setAttribute('data-color-mode', 'light'));
await page.waitForTimeout(300);

// 设置页
await openSettings();
const visibleLabels = await page.evaluate(() => {
  const root = document.querySelector('gmw-app').shadowRoot;
  return [...root.querySelectorAll('.gmw-toolbar button')]
    .filter(button => button.getClientRects().length > 0)
    .map(button => button.getAttribute('aria-label') || button.textContent.trim());
});
check(
  '设置页把保存等按钮放到工具栏',
  visibleLabels.length === 4 && !visibleLabels.some(label => /Reload all|全部刷新|^(Settings|设置)$/.test(label)),
  JSON.stringify(visibleLabels),
);
const closeButton = page.locator('.gmw-toolbar .gmw-icon-button').last();
const closeLabel = await closeButton.getAttribute('aria-label');
check(
  '关闭按钮是图标按钮且全局可用',
  /Close|关闭/.test(closeLabel ?? '') && (await closeButton.locator('.gmw-icon svg').count()) === 1,
  closeLabel,
);
const rowCount = await page.locator('.gmw-view-row').count();
check('设置页列出四列', rowCount === 4, rowCount);
const storedQueries = await page.locator('.gmw-view-row textarea').evaluateAll(nodes => nodes.map(node => node.value));
check('默认搜索条件与文档一致', JSON.stringify(storedQueries) === JSON.stringify(DEFAULT_QUERIES), storedQueries[0]);
await page.screenshot({ path: join(OUT_DIR, '05-settings.png') });

// 空值校验
await page.locator('#gmw-query-0').fill('');
await saveSettings();
const emptyStatus = await page.locator('.gmw-settings-status').textContent();
check('空值被拦截', /1/.test(emptyStatus ?? '') && emptyStatus.length > 0, emptyStatus);

// 新增一列 URL 模式，并校验非法地址
await page.locator('#gmw-title-0').fill('My closed issues');
await page.locator('#gmw-query-0').fill('is:issue user:@me state:closed sort:updated-desc');
await page.getByRole('button', { name: /Add column|添加一列/ }).click();
check('新增一列后表单有五列', (await page.locator('.gmw-view-row').count()) === 5);

const lastRow = page.locator('.gmw-view-row').last();
await lastRow.locator('input[type="text"]').fill('Repo issues');
await lastRow.locator('select').selectOption('url');
await lastRow.locator('textarea').fill('https://example.com/not-github');
await saveSettings();
const urlStatus = await page.locator('.gmw-settings-status').textContent();
check('非 github.com 地址被拦截', /github\.com/.test(urlStatus ?? ''), urlStatus);

await lastRow.locator('textarea').fill('github.com/shijianjs/userscripts/issues');
await saveSettings();
check('保存后设置页关闭', !(await page.locator('.gmw-settings.gmw-visible').count()));
check('保存后五列', (await columnTitles.count()) === 5, await columnTitles.allTextContents());
check('URL 列标题生效', (await columnTitles.last().textContent()) === 'Repo issues');

const lastSrc = await columnFrames.last().getAttribute('src');
check('URL 列补全 https 并直连页面', lastSrc === 'https://github.com/shijianjs/userscripts/issues', lastSrc);
const stored = await page.evaluate(key => localStorage.getItem(key), STORAGE_KEY);
check('设置写入 localStorage', Boolean(stored) && stored.includes('Repo issues'), stored ? stored.slice(0, 100) : '(空)');

// URL 列不裁剪
await page.waitForTimeout(2500);
const urlFrame = await (await columnFrames.last().elementHandle()).contentFrame();
const urlFrameState = await urlFrame?.evaluate(() => ({
  hasHeader: Boolean(document.querySelector('header')),
  bodyText: document.body.innerText.trim().length,
  trimStyle: Boolean(document.getElementById('gmw-frame-style')),
})).catch(() => null);
check(
  'URL 列保留完整页面（不裁剪）',
  Boolean(urlFrameState) && urlFrameState.hasHeader && urlFrameState.bodyText > 200 && !urlFrameState.trimStyle,
  JSON.stringify(urlFrameState),
);
await page.screenshot({ path: join(OUT_DIR, '06-url-column.png') });

// 删除一列
await openSettings();
await page.locator('.gmw-view-row').last().locator('.gmw-row-remove').click();
check('删除后表单剩四列', (await page.locator('.gmw-view-row').count()) === 4);
await saveSettings();
check('删除后面板剩四列', (await columnTitles.count()) === 4);

// 语言切换
await openSettings();
await page.locator('.gmw-language-row select').selectOption('en');
await saveSettings();
check('切换英文后工具栏文案', (await page.locator('.gmw-toolbar button').nth(1).textContent()) === 'Settings');
check('切换英文后列打开链接文案', (await page.locator('.gmw-column-open').first().textContent()) === 'Open ↗');
await page.screenshot({ path: join(OUT_DIR, '07-english.png') });

// 刷新后仍生效
await page.reload({ waitUntil: 'domcontentloaded' });
await page.waitForTimeout(600);
await injectCurrentScript();
await openPanel();
check('刷新后自定义标题保持', (await columnTitles.first().textContent()) === 'My closed issues');
check('刷新后语言保持英文', (await page.locator('#gmw-launcher').textContent()) === 'My Work');

// 其它交互
const errorsBeforeReload = ownErrors().length;
await page.getByRole('button', { name: 'Reload all' }).click();
await page.waitForTimeout(500);
check('全部刷新无报错', ownErrors().length === errorsBeforeReload, JSON.stringify(ownErrors()));

await page.keyboard.press('Escape');
await page.waitForTimeout(300);
check('Esc 关闭面板', !(await panel.evaluate(el => el.classList.contains('gmw-open'))));

// 窄屏布局
await page.setViewportSize({ width: 390, height: 844 });
await launcher.click();
await page.waitForTimeout(500);
const gridColumns = await page.locator('#gmw-columns').evaluate(el => getComputedStyle(el).gridTemplateColumns);
check('窄屏保持四列并可横向滚动', gridColumns.split(' ').length === 4, gridColumns);
await page.screenshot({ path: join(OUT_DIR, '08-mobile.png') });

// 恢复默认，避免污染测试实例
await page.setViewportSize({ width: 1440, height: 900 });
await openSettings();
await page.locator('.gmw-language-row select').selectOption('auto');
await page.getByRole('button', { name: /Restore defaults|恢复默认/ }).click();
await saveSettings();
check('恢复默认后四列', (await columnTitles.count()) === 4, await columnTitles.allTextContents());

// 二次加载不重复注入
await page.goto('https://github.com/settings/profile', { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(600);
await injectCurrentScript();
await page.waitForTimeout(1200);
check('二次加载不重复注入', (await launcher.count()) === 1);
check('无页面 JS 报错', ownErrors().length === 0, JSON.stringify(ownErrors()));
console.log('  其它页面报错（不参与断言）:', JSON.stringify(pageErrors.filter(item => !item.stack.includes('github-my-work.user.js')).map(item => item.message)));

const failed = checks.filter(item => !item.ok);
console.log(`\n总结：${checks.length - failed.length}/${checks.length} 通过，截图在 ${OUT_DIR}`);
if (failed.length) {
  console.log('失败项：' + failed.map(item => `${item.name}（${item.detail}）`).join('；'));
}

await browser.close();
process.exit(failed.length ? 1 : 0);
