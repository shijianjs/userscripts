// Stylus 样式运行时验证公共库（不参与分发）
//
// 各 userstyles/<样式名>/test/e2e.mjs 复用本模块：连接一个已开启调试端口的 Chrome，
// 打开目标页面，把工作区里的 .user.css 按 @-moz-document 条件注入当前页面，再交回给
// 用例断言。
//
// 环境变量：
//   CDP_URL          调试端点，默认 http://127.0.0.1:9222
//   PLAYWRIGHT_CORE  playwright-core 所在路径，默认自动从全局 npm 目录查找
//   OUT_DIR          截图输出目录，默认 <仓库>/target/userstyles-<样式名>

import { createRequire } from 'node:module';
import { execSync } from 'node:child_process';
import { mkdirSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const here = dirname(fileURLToPath(import.meta.url));

export const repoRoot = resolve(here, '../..');

export function loadPlaywrightCore() {
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
  candidates.push(join(repoRoot, 'node_modules', 'playwright-core'));
  candidates.push(join(repoRoot, 'node_modules', 'playwright'));
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

export function fatal(message) {
  console.error(`\n无法开始测试：${message}`);
  process.exit(2);
}

// 连接已开启调试端口的 Chrome，并为本次用例新开一个标签页（跑完自行关闭，不动用户已有标签）
export async function connect(styleName) {
  const cdpUrl = process.env.CDP_URL || 'http://127.0.0.1:9222';
  const { chromium } = loadPlaywrightCore();
  const browser = await chromium.connectOverCDP(cdpUrl).catch((error) => {
    fatal(`连不上 ${cdpUrl}（${error.message}）。请确认调试实例已启动、端口正确。`);
  });
  const context = browser.contexts()[0];
  if (!context) fatal('CDP 连接成功但没有可用的浏览器上下文。');
  const page = await context.newPage();
  const outDir = process.env.OUT_DIR || join(repoRoot, 'target', `userstyles-${styleName}`);
  mkdirSync(outDir, { recursive: true });
  return { browser, context, page, outDir };
}

// ---- UserCSS 解析 ---------------------------------------------------------

export function readUserStyle(stylePath) {
  return parseUserStyle(readFileSync(stylePath, 'utf8'));
}

export function parseUserStyle(css) {
  const meta = {};
  const metaMatch = css.match(/\/\*\s*==UserStyle==([\s\S]*?)==\/UserStyle==\s*\*\//);
  if (metaMatch) {
    for (const line of metaMatch[1].split('\n')) {
      const field = line.match(/^\s*@([\w-]+)\s+(.*?)\s*$/);
      if (field) meta[field[1]] = field[2];
    }
  }

  const blocks = [];
  const marker = /@-moz-document\s+/g;
  let match;
  while ((match = marker.exec(css))) {
    const conditionStart = match.index + match[0].length;
    const open = css.indexOf('{', conditionStart);
    if (open === -1) break;
    const close = findBlockEnd(css, open);
    if (close === -1) break;
    blocks.push({
      conditions: css.slice(conditionStart, open).trim(),
      body: css.slice(open + 1, close).trim(),
    });
    marker.lastIndex = close + 1;
  }
  return { meta, blocks };
}

function findBlockEnd(css, openIndex) {
  let depth = 0;
  let inString = null;
  let inComment = false;
  for (let i = openIndex; i < css.length; i++) {
    const ch = css[i];
    const next = css[i + 1];
    if (inComment) {
      if (ch === '*' && next === '/') { inComment = false; i++; }
      continue;
    }
    if (inString) {
      if (ch === '\\') { i++; continue; }
      if (ch === inString) inString = null;
      continue;
    }
    if (ch === '/' && next === '*') { inComment = true; i++; continue; }
    if (ch === '"' || ch === "'") { inString = ch; continue; }
    if (ch === '{') depth++;
    else if (ch === '}' && --depth === 0) return i;
  }
  return -1;
}

// ---- @-moz-document 条件匹配 ----------------------------------------------

export function matchBlocks(blocks, url) {
  return blocks.filter(block => splitConditions(block.conditions).some(condition => matchCondition(condition, url)));
}

export function splitConditions(text) {
  const parts = [];
  let current = '';
  let quote = null;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quote) {
      current += ch;
      if (ch === '\\') { current += text[++i] ?? ''; continue; }
      if (ch === quote) quote = null;
      continue;
    }
    if (ch === '"' || ch === "'") { quote = ch; current += ch; continue; }
    if (ch === ',') { parts.push(current.trim()); current = ''; continue; }
    current += ch;
  }
  if (current.trim()) parts.push(current.trim());
  return parts;
}

export function matchCondition(condition, url) {
  const parsed = condition.match(/^([\w-]+)\s*\(\s*(?:(["'])([\s\S]*?)\2|([^)]*))\s*\)$/);
  if (!parsed) return false;
  const fn = parsed[1].toLowerCase();
  const value = (parsed[3] ?? parsed[4] ?? '').trim();
  let target = null;
  try { target = new URL(url); } catch { target = null; }

  switch (fn) {
    case 'url-prefix':
      return url.startsWith(value);
    case 'url':
      return url === value;
    case 'domain': {
      if (!target) return false;
      const host = target.hostname;
      const base = value.replace(/^\./, '');
      return host === base || host.endsWith(`.${base}`);
    }
    case 'regexp':
      try { return new RegExp(value).test(url); } catch { return false; }
    default:
      return false;
  }
}

// ---- 断言与汇总 ------------------------------------------------------------

export function createChecks() {
  const checks = [];
  const check = (name, ok, detail = '') => {
    const state = ok ? 'PASS' : 'FAIL';
    checks.push({ name, state, detail: String(detail).slice(0, 400) });
    console.log(`${state}  ${name}${detail ? ` :: ${String(detail).slice(0, 260)}` : ''}`);
    return ok;
  };
  check.skip = (name, detail = '') => {
    checks.push({ name, state: 'SKIP', detail: String(detail).slice(0, 400) });
    console.log(`SKIP  ${name}${detail ? ` :: ${String(detail).slice(0, 260)}` : ''}`);
    return false;
  };
  return { checks, check };
}

// 用例结束时的收尾：默认移除注入的样式并关闭用例自己开的标签页（页面可能已导航，失败时忽略）。
// 设置 KEEP=1 时改为保留页面与注入样式，方便人工查看效果。
export async function cleanup(page, styleHandle) {
  if (process.env.KEEP === '1') {
    console.log('KEEP=1：保留测试页面与注入样式，供人工查看');
    return;
  }
  await styleHandle?.evaluate(node => node.remove()).catch(() => {});
  await page.close().catch(() => {});
}

export async function finish(checks, outDir, browser) {
  const failed = checks.filter(item => item.state === 'FAIL');
  const skipped = checks.filter(item => item.state === 'SKIP');
  const passed = checks.length - failed.length - skipped.length;
  console.log(`\n总结：${passed}/${checks.length} 通过，${skipped.length} 跳过，截图在 ${outDir}`);
  if (failed.length) {
    console.log(`失败项：${failed.map(item => `${item.name}（${item.detail}）`).join('；')}`);
  }
  await browser.close().catch(() => {});
  process.exit(failed.length ? 1 : 0);
}
