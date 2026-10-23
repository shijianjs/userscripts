// bilibili 播放列表加长 —— 运行时验证用例
//
// 连 CDP → 打开 bilibili 视频页 → 把工作区里的 .user.css 按 @-moz-document 条件注入 →
// 断言播放列表容器的高度限制生效。
//
//   node userstyles/bilibili-playlist-longer/test/e2e.mjs
//
// 环境变量：CDP_URL / PLAYWRIGHT_CORE / OUT_DIR / STYLE_URL
//   默认目标页是单视频页，可能没有播放列表；可把 STYLE_URL 指向一个合集 / 多 P 视频。

import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readUserStyle, matchBlocks, createChecks, connect, cleanup, finish } from '../../_lib/style-test.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const styleName = 'bilibili-playlist-longer';
const stylePath = resolve(here, `../${styleName}.user.css`);
const targetUrl = process.env.STYLE_URL || 'https://www.bilibili.com/video/BV1x7aJ6LE4W/';
const { checks, check } = createChecks();

const { browser, page, outDir } = await connect(styleName);

await page.setViewportSize({ width: 1600, height: 900 });
await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 90000 });
// 播放列表组件初始化较晚，等它就位并稳定后再注入，否则会被站点随后插入的样式覆盖
await page.waitForSelector('.video-pod .video-pod__body', { timeout: 25000 }).catch(() => {});
await page.waitForTimeout(2000);

const { meta, blocks } = readUserStyle(stylePath);
console.log(`样式：${meta.name} v${meta.version}`);

const matched = matchBlocks(blocks, page.url());
check('@-moz-document 条件匹配当前页面', matched.length === 1, page.url());

const styleHandle = await page.addStyleTag({ content: matched.map(block => block.body).join('\n') });
await page.waitForTimeout(800);

const probe = await page.evaluate(() => {
  const el = document.querySelector('.video-pod .video-pod__body');
  if (!el) return { missing: true };
  const style = getComputedStyle(el);
  return { missing: false, maxHeight: style.maxHeight, height: style.height, viewport: window.innerHeight };
});

if (probe.missing) {
  // 真实视频页未必带播放列表（需要合集 / 多 P 且已展开）。退化为合成节点：
  // 用同名结构验证注入的 CSS 规则本身是否生效。
  const synthesized = await page.evaluate(() => {
    const pod = document.createElement('div');
    pod.className = 'video-pod';
    const body = document.createElement('div');
    body.className = 'video-pod__body';
    body.style.height = '5000px';
    pod.appendChild(body);
    document.body.appendChild(pod);
    const style = getComputedStyle(body);
    const result = { maxHeight: style.maxHeight, viewport: window.innerHeight };
    pod.remove();
    return result;
  });
  check(
    '（合成节点）播放列表高度受 max-height 限制',
    synthesized.maxHeight.endsWith('px') && Math.abs(parseFloat(synthesized.maxHeight) - (synthesized.viewport - 350)) <= 2,
    JSON.stringify(synthesized),
  );
  check.skip('真实视频页未展开播放列表（可用 STYLE_URL 指定合集 / 多 P 视频）', page.url());
} else {
  const maxHeight = parseFloat(probe.maxHeight);
  check(
    '播放列表高度受 max-height 限制',
    probe.maxHeight.endsWith('px') && maxHeight > 0 && Math.abs(maxHeight - (probe.viewport - 350)) <= 2,
    JSON.stringify(probe),
  );
  check('height 被放开为内容高度', parseFloat(probe.height) > 0, probe.height);
}

await page.screenshot({ path: join(outDir, '01-playlist.png') });
await cleanup(page, styleHandle);

await finish(checks, outDir, browser);
