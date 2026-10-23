// bangumi 宽屏列表页优化 —— 运行时验证用例
//
// 连 CDP → 打开 bgm.tv 列表页 → 把工作区里的 .user.css 按 @-moz-document 条件注入 →
// 断言主容器加宽、条目列表变成卡片网格。
//
//   node userstyles/bangumi-wide-list/test/e2e.mjs
//
// 环境变量：CDP_URL / PLAYWRIGHT_CORE / OUT_DIR / STYLE_URL

import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readUserStyle, matchBlocks, createChecks, connect, cleanup, finish } from '../../_lib/style-test.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const styleName = 'bangumi-wide-list';
const stylePath = resolve(here, `../${styleName}.user.css`);
const targetUrl = process.env.STYLE_URL || 'https://bgm.tv/anime/browser/';
const { checks, check } = createChecks();

const { browser, page, outDir } = await connect(styleName);

await page.setViewportSize({ width: 1600, height: 900 });
await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 90000 });
await page.waitForSelector('#browserItemList.browserFull', { timeout: 25000 }).catch(() => {});

const { meta, blocks } = readUserStyle(stylePath);
console.log(`样式：${meta.name} v${meta.version}`);

const matched = matchBlocks(blocks, page.url());
check('@-moz-document 条件匹配当前页面', matched.length === 1, page.url());

const styleHandle = await page.addStyleTag({ content: matched.map(block => block.body).join('\n') });

const probe = await page.evaluate(() => {
  const list = document.querySelector('#browserItemList.browserFull');
  if (!list) return { missing: true, title: document.title };
  const item = list.querySelector('li.item');
  const listStyle = getComputedStyle(list);
  const itemStyle = item ? getComputedStyle(item) : null;
  const wrapper = document.querySelector('.mainWrapper');
  return {
    missing: false,
    display: listStyle.display,
    columns: listStyle.gridTemplateColumns.split(' ').length,
    itemRadius: itemStyle?.borderRadius ?? null,
    wrapperWidth: wrapper ? wrapper.getBoundingClientRect().width : null,
    viewport: window.innerWidth,
    itemCount: list.children.length,
  };
});

if (probe.missing) {
  const bodyText = await page.evaluate(() => document.body.innerText.slice(0, 200)).catch(() => '');
  const blocked = /安全验证|Cloudflare|Just a moment/i.test(bodyText);
  check.skip(blocked ? 'Cloudflare 安全验证拦截（请在测试实例中通过后重跑）' : `页面没有 #browserItemList.browserFull（${probe.title}）`, page.url());
} else {
  check('条目列表为 grid 布局', probe.display === 'grid', probe.display);
  check('网格按容器宽度自适应多列', probe.columns > 1, `${probe.columns} 列`);
  check('条目为卡片（圆角 8px）', probe.itemRadius === '8px', probe.itemRadius);
  check(
    '主容器按 100vw - 100px 加宽',
    probe.wrapperWidth !== null && Math.abs(probe.wrapperWidth - (probe.viewport - 100)) <= 2,
    `${probe.wrapperWidth} / ${probe.viewport}`,
  );
}

await page.screenshot({ path: join(outDir, '01-bangumi-list.png') });
await cleanup(page, styleHandle);

await finish(checks, outDir, browser);
