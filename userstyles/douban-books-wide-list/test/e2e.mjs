// 豆瓣读书列表宽屏优化 —— 运行时验证用例
//
// 连 CDP → 打开豆瓣读书列表页 → 把工作区里的 .user.css 按 @-moz-document 条件注入 →
// 断言列表变成网格、条目变成卡片。豆瓣可能要求登录，未登录时对应断言会标记为 SKIP。
//
//   node userstyles/douban-books-wide-list/test/e2e.mjs
//
// 环境变量：CDP_URL / PLAYWRIGHT_CORE / OUT_DIR / STYLE_URL

import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readUserStyle, matchBlocks, createChecks, connect, cleanup, finish } from '../../_lib/style-test.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const styleName = 'douban-books-wide-list';
const stylePath = resolve(here, `../${styleName}.user.css`);
const targetUrl = process.env.STYLE_URL || 'https://book.douban.com/tag/%E5%B0%8F%E8%AF%B4';
const { checks, check } = createChecks();

const { browser, page, outDir } = await connect(styleName);

await page.setViewportSize({ width: 1600, height: 900 });
await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 90000 });
await page.waitForTimeout(2500);

const { meta, blocks } = readUserStyle(stylePath);
console.log(`样式：${meta.name} v${meta.version}`);

const matched = matchBlocks(blocks, page.url());
check('@-moz-document 条件匹配当前页面', matched.length === 1, page.url());

const styleHandle = await page.addStyleTag({ content: matched.map(block => block.body).join('\n') });

const probe = await page.evaluate(() => {
  const list = document.querySelector('ul.subject-list') || document.querySelector('ul.interest-list');
  if (!list) {
    return { missing: true, title: document.title, needsLogin: /登录|sign in/i.test(document.body.innerText.slice(0, 500)) };
  }
  const item = list.querySelector('li.subject-item') || list.querySelector('li');
  const listStyle = getComputedStyle(list);
  const itemStyle = item ? getComputedStyle(item) : null;
  return {
    missing: false,
    display: listStyle.display,
    columns: listStyle.gridTemplateColumns.split(' ').length,
    itemRadius: itemStyle?.borderRadius ?? null,
    itemShadow: itemStyle?.boxShadow ?? null,
    itemCount: list.children.length,
  };
});

if (probe.missing) {
  check.skip(`页面没有书籍列表（${probe.needsLogin ? '可能未登录' : '结构不符'}）`, `${page.url()} / ${probe.title}`);
} else {
  check('书籍列表为 grid 布局', probe.display === 'grid', probe.display);
  check('网格按容器宽度自适应多列', probe.columns > 1, `${probe.columns} 列`);
  check('书籍条目为卡片（圆角 8px）', probe.itemRadius === '8px', probe.itemRadius);
  check('书籍条目带阴影', (probe.itemShadow ?? 'none') !== 'none', probe.itemShadow);
}

await page.screenshot({ path: join(outDir, '01-douban-books.png') });
await cleanup(page, styleHandle);

await finish(checks, outDir, browser);
