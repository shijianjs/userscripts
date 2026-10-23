// bilibili 添加到收藏夹弹窗加大 —— 运行时验证用例
//
// 连 CDP → 打开 bilibili 视频页 → 注入工作区 .user.css → 点开「添加到收藏夹」弹窗 →
// 断言弹窗加宽到 80vw、收藏夹列表变成卡片网格。
//
//   node userstyles/bilibili-fav-dialog-larger/test/e2e.mjs
//
// 需要测试实例已登录 bilibili，否则找不到收藏按钮 / 弹窗打不开，对应断言标记为 SKIP。
// 环境变量：CDP_URL / PLAYWRIGHT_CORE / OUT_DIR / STYLE_URL

import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readUserStyle, matchBlocks, createChecks, connect, cleanup, finish } from '../../_lib/style-test.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const styleName = 'bilibili-fav-dialog-larger';
const stylePath = resolve(here, `../${styleName}.user.css`);
const targetUrl = process.env.STYLE_URL || 'https://www.bilibili.com/video/BV1x7aJ6LE4W/';
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

const favButton = page.locator('.video-toolbar-left-item .video-fav, .toolbar-left-item .video-fav, .video-fav').first();
if ((await favButton.count()) === 0) {
  check.skip('页面上没有收藏按钮（可能未登录或页面结构变化）', page.url());
} else {
  await favButton.click().catch(() => {});
  const dialog = page.locator('.bili-dialog-m .collection-m-exp');
  const opened = await dialog.waitFor({ state: 'visible', timeout: 8000 }).then(() => true).catch(() => false);

  if (!opened) {
    check.skip('收藏弹窗未打开（通常需要登录 bilibili）', page.url());
  } else {
    const box = await dialog.evaluate(el => ({ width: el.getBoundingClientRect().width, viewport: window.innerWidth }));
    check(
      '弹窗宽度约 80vw',
      Math.abs(box.width - box.viewport * 0.8) <= 8,
      `${Math.round(box.width)} / ${box.viewport}`,
    );
    const listState = await page.locator('.collection-m-exp .group-list > ul').first()
      .evaluate(el => ({ display: getComputedStyle(el).display, columns: getComputedStyle(el).gridTemplateColumns.split(' ').length }))
      .catch(() => null);
    if (listState) {
      check('收藏夹列表为卡片网格', listState.display === 'grid' && listState.columns > 1, JSON.stringify(listState));
    } else {
      check.skip('弹窗内没有收藏夹列表（账号可能没有任何收藏夹）', page.url());
    }
    await page.screenshot({ path: join(outDir, '01-fav-dialog.png') });
  }
}

await cleanup(page, styleHandle);

await finish(checks, outDir, browser);
