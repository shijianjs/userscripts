// 雪球组合收益率曲线变细 —— 运行时验证用例
//
// 连 CDP → 打开雪球组合页 → 把工作区里的 .user.css 按 @-moz-document 条件注入 →
// 断言收益率曲线（.chart svg path）的 stroke-width 变为 2。
//
//   node userstyles/xueqiu-pie-curve-thinner/test/e2e.mjs
//
// 组合页地址请用 STYLE_URL 指定一个真实存在的组合，例如：
//   $env:STYLE_URL='https://xueqiu.com/P/ZH000001'; node userstyles/xueqiu-pie-curve-thinner/test/e2e.mjs
// 环境变量：CDP_URL / PLAYWRIGHT_CORE / OUT_DIR / STYLE_URL

import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readUserStyle, matchBlocks, createChecks, connect, cleanup, finish } from '../../_lib/style-test.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const styleName = 'xueqiu-pie-curve-thinner';
const stylePath = resolve(here, `../${styleName}.user.css`);
const targetUrl = process.env.STYLE_URL || 'https://xueqiu.com/P/ZH3025080';
const { checks, check } = createChecks();

const { browser, page, outDir } = await connect(styleName);

await page.setViewportSize({ width: 1600, height: 900 });
await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 90000 });
await page.waitForTimeout(3000);

const { meta, blocks } = readUserStyle(stylePath);
console.log(`样式：${meta.name} v${meta.version}`);

const matched = matchBlocks(blocks, page.url());
check('@-moz-document 条件匹配当前页面', matched.length === 1, page.url());

const styleHandle = await page.addStyleTag({ content: matched.map(block => block.body).join('\n') });

const probe = await page.evaluate(() => {
  const path = document.querySelector('.chart svg path');
  if (!path) return { missing: true, title: document.title };
  return { missing: false, strokeWidth: getComputedStyle(path).strokeWidth, pathCount: document.querySelectorAll('.chart svg path').length };
});

if (probe.missing) {
  check.skip(`页面没有 .chart svg path（${probe.title}；可用 STYLE_URL 指定一个有效组合页）`, page.url());
} else {
  check('收益率曲线变细为 2px', probe.strokeWidth === '2px', `${probe.strokeWidth}（${probe.pathCount} 条曲线）`);
}

await page.screenshot({ path: join(outDir, '01-pie-curve.png') });
await cleanup(page, styleHandle);

await finish(checks, outDir, browser);
