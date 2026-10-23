// Better crates.io Search Layout —— 运行时验证用例
//
// 连 CDP → 打开 crates.io 搜索结果页 → 把工作区里的 .user.css 按 @-moz-document 条件注入 →
// 断言内容区加宽、结果列表变成卡片网格。
//
//   node userstyles/crates-io-search-layout/test/e2e.mjs
//
// 环境变量：CDP_URL / PLAYWRIGHT_CORE / OUT_DIR / STYLE_URL

import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readUserStyle, matchBlocks, createChecks, connect, cleanup, finish } from '../../_lib/style-test.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const styleName = 'crates-io-search-layout';
const stylePath = resolve(here, `../${styleName}.user.css`);
const targetUrl = process.env.STYLE_URL || 'https://crates.io/search?q=serde';
const { checks, check } = createChecks();

const { browser, page, outDir } = await connect(styleName);

await page.setViewportSize({ width: 1600, height: 900 });
await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 90000 });
await page.locator('ol.list').first().waitFor({ timeout: 30000 }).catch(() => {});

const { meta, blocks } = readUserStyle(stylePath);
console.log(`样式：${meta.name} v${meta.version}`);

const matched = matchBlocks(blocks, page.url());
check('@-moz-document 条件匹配当前页面', matched.length === 1, page.url());

const styleHandle = await page.addStyleTag({ content: matched.map(block => block.body).join('\n') });

const probe = await page.evaluate(() => {
  const list = document.querySelector('ol.list');
  const limit = document.querySelector('.width-limit');
  if (!list) return { missing: true, title: document.title };
  const item = list.querySelector(':scope > li');
  const listStyle = getComputedStyle(list);
  const itemStyle = item ? getComputedStyle(item) : null;
  return {
    missing: false,
    display: listStyle.display,
    columns: listStyle.gridTemplateColumns.split(' ').length,
    itemRadius: itemStyle?.borderRadius ?? null,
    limitWidth: limit ? limit.getBoundingClientRect().width : null,
    viewport: window.innerWidth,
    itemCount: list.children.length,
  };
});

if (probe.missing) {
  check.skip(`页面没有结果列表（${probe.title}）`, page.url());
} else {
  check('结果列表为 grid 布局', probe.display === 'grid', probe.display);
  check('网格按容器宽度自适应多列', probe.columns > 1, `${probe.columns} 列 / ${probe.itemCount} 条`);
  check('结果条目为卡片（圆角 8px）', probe.itemRadius === '8px', probe.itemRadius);
  check(
    '内容区按 100vw - 100px 加宽',
    probe.limitWidth !== null && Math.abs(probe.limitWidth - (probe.viewport - 100)) <= 2,
    `${probe.limitWidth} / ${probe.viewport}`,
  );
}

await page.screenshot({ path: join(outDir, '01-crates-search.png') });
await cleanup(page, styleHandle);

await finish(checks, outDir, browser);
