// 官网本地代码审查：双视口加载、控制台/页面错误、横向溢出、导航、下载链接、reveal 动画
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const url = 'file:///' + path.resolve('site/\u5FC3\u6865_\u4EA7\u54C1\u5B98\u7F51.html').replace(/\\/g, '/');
const browser = await chromium.launch({ headless: true });

for (const vp of [{ name: 'mobile', width: 390, height: 844 }, { name: 'desktop', width: 1280, height: 800 }]) {
  const page = await browser.newPage({ viewport: { width: vp.width, height: vp.height } });
  const errors = [];
  page.on('console', (m) => { if (m.type() === 'error') errors.push(`console: ${m.text()}`); });
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
  await page.goto(url, { waitUntil: 'load' });
  await page.waitForSelector('.nav');
  await page.waitForTimeout(800);

  // 横向溢出
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  // 标题与描述
  const title = await page.title();
  const desc = await page.locator('meta[name="description"]').getAttribute('content');
  // 区块完整性
  const ids = ['hero', 'pain', 'value', 'scenarios', 'quickstart', 'features', 'tech', 'manual'];
  const missing = [];
  for (const id of ids) {
    if ((await page.locator(`#${id}`).count()) === 0) missing.push(id);
  }
  // reveal 可见性（首屏元素应被观察器标记）
  const visibleCount = await page.locator('.reveal.is-visible').count();

  if (vp.name === 'mobile') {
    // 汉堡菜单
    await page.locator('.nav-burger').click();
    const panelOpen = await page.locator('#mobile-nav.open').count();
    await page.locator('#mobile-nav a', { hasText: '核心价值' }).click();
    await page.waitForTimeout(200);
    const panelClosed = await page.locator('#mobile-nav.open').count();
    if (panelOpen !== 1 || panelClosed !== 0) errors.push('mobile nav toggle failed');
  }

  // 下载链接指向存在的文件
  const href = await page.locator('#manual a[download]').getAttribute('href');
  const pdfExists = fs.existsSync(path.resolve('site', decodeURIComponent(href.replace(/^\.\//, ''))));

  console.log(`[${vp.name}] overflow=${overflow} title="${title}" desc_ok=${!!desc && desc.includes('\u5FC3\u7684\u6865\u6881')} missing_sections=${missing.length ? missing.join(',') : 'none'} reveal_visible=${visibleCount} pdf_link_ok=${pdfExists}`);
  if (overflow > 0) errors.push(`horizontal overflow ${overflow}px`);
  if (missing.length) errors.push(`missing sections: ${missing.join(',')}`);
  if (!pdfExists) errors.push('pdf link target missing');
  if (errors.length) throw new Error(`${vp.name}:\n${errors.join('\n')}`);
  await page.close();
}

// 深滚动后更多 reveal 应被标记
{
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  page.on('pageerror', (e) => { throw new Error(`pageerror: ${e.message}`); });
  await page.goto(url, { waitUntil: 'load' });
  for (let y = 0; y <= 12000; y += 300) {
    await page.evaluate((v) => window.scrollTo(0, v), y);
    await page.waitForTimeout(70);
  }
  const total = await page.locator('.reveal').count();
  const visible = await page.locator('.reveal.is-visible').count();
  console.log(`[scroll] reveal total=${total} visible=${visible}`);
  if (visible < total) throw new Error(`not all reveals triggered: ${visible}/${total}`);
  await page.close();
}

await browser.close();
console.log('AUDIT_SITE_OK');
