import { spawn } from 'node:child_process';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { chromium } from 'playwright';

const PORT = 4185;
const BASE = `http://localhost:${PORT}`;
const SHOT_DIR = path.resolve('screenshots/manual');
const DEMO_FILE = path.resolve('demo/客户生日关怀助手_产品展示数据.xlsx');

function waitForServer(url, timeoutMs = 30000) {
  const started = Date.now();
  return new Promise((resolve, reject) => {
    const tick = async () => {
      try {
        const res = await fetch(url);
        if (res.ok) return resolve();
      } catch {
        // 尚未就绪
      }
      if (Date.now() - started > timeoutMs) return reject(new Error('preview server timeout'));
      setTimeout(tick, 300);
    };
    void tick();
  });
}

async function launch() {
  try {
    return await chromium.launch({ channel: 'msedge', headless: true });
  } catch {
    return chromium.launch({ headless: true });
  }
}

fs.mkdirSync(SHOT_DIR, { recursive: true });

const server = spawn(process.execPath, ['node_modules/vite/bin/vite.js', 'preview', '--port', String(PORT), '--strictPort'], {
  stdio: 'ignore',
});

let browser;
try {
  await waitForServer(BASE);
  browser = await launch();
  const page = await browser.newPage({ viewport: { width: 420, height: 880 } });

  await page.addInitScript(() => {
    const RealDate = Date;
    const FIXED = new RealDate(2026, 7, 5, 10, 0, 0).getTime();
    class MockDate extends RealDate {
      constructor(...args) {
        super(...(args.length ? args : [FIXED]));
      }
      static now() {
        return FIXED;
      }
    }
    window.Date = MockDate;
    localStorage.setItem(
      'birthday-care.settings.v1',
      JSON.stringify({ advance7: true, todayA: true, userName: '张经理', team: '财富中心一部' }),
    );
  });

  const errors = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  page.on('pageerror', (err) => errors.push(err.message));
  page.on('dialog', (d) => d.accept());

  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.waitForSelector('.app');

  // 1) 批量导入演示数据
  await page.getByRole('button', { name: '客户', exact: true }).click();
  await page.waitForSelector('.toolbar');
  await page.getByRole('button', { name: '批量导入' }).click();
  await page.waitForSelector('dialog.modal[open]');
  await page.locator('input[type="file"]').setInputFiles(DEMO_FILE);
  await page.waitForSelector('.result-nums');
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(SHOT_DIR, '07-import-check.png') });
  await page.getByRole('button', { name: '跳过' }).click();
  await page.waitForSelector('.result-done');
  await page.screenshot({ path: path.join(SHOT_DIR, '08-import-result.png') });
  await page.getByRole('button', { name: '完成' }).click();
  await page.waitForFunction(() => (document.querySelector('.count')?.textContent ?? '').includes('48 位客户'));
  await page.waitForSelector('.toast-show', { state: 'hidden' }).catch(() => {});

  // 2) 首页
  await page.getByRole('button', { name: '首页', exact: true }).click();
  await page.waitForSelector('.stats');
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(SHOT_DIR, '01-home.png') });

  // 3) 客户列表（A类筛选）
  await page.getByRole('button', { name: '客户', exact: true }).click();
  await page.locator('#filter-level').selectOption('A');
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(SHOT_DIR, '02-customers.png') });
  await page.locator('#filter-level').selectOption('all');

  // 3.5) 星标筛选（星标客户置顶显示）
  await page.locator('#filter-star').selectOption('starred');
  await page.waitForFunction(() => (document.querySelector('.count')?.textContent ?? '').includes('6 位客户'));
  await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(SHOT_DIR, '14-star-customers.png') });
  await page.locator('#filter-star').selectOption('all');
  await page.waitForFunction(() => (document.querySelector('.count')?.textContent ?? '').includes('48 位客户'));

  // 4) 搜索
  await page.locator('.search input').fill('王');
  await page.waitForFunction(() => (document.querySelector('.count')?.textContent ?? '').includes('1 位客户'));
  await page.screenshot({ path: path.join(SHOT_DIR, '03-customer-search.png') });
  await page.locator('.search input').fill('');
  await page.waitForTimeout(300);

  // 5) 完成维护（刘先生，今日生日）
  await page.getByRole('button', { name: '首页', exact: true }).click();
  await page.getByRole('button', { name: '完成维护', exact: true }).first().click();
  await page.waitForSelector('dialog.modal[open]');
  await page.locator('#record-remark').fill('客户表示感谢，已预约回访');
  await page.getByRole('button', { name: '保存记录', exact: true }).click();
  // 完成关怀后弹出“数据备份提醒”（每日一次）
  await page.locator('dialog.modal[open]', { hasText: '数据备份提醒' }).waitFor({ state: 'visible' });
  await page.screenshot({ path: path.join(SHOT_DIR, '13-export-reminder.png') });
  await page.getByRole('button', { name: '稍后再说', exact: true }).click();
  await page.waitForSelector('dialog.modal[open]', { state: 'hidden' });
  await page.waitForSelector('.done-tag');
  await page.waitForSelector('.toast-show', { state: 'hidden' }).catch(() => {});

  // 6) 客户详情 + 历史维护记录
  await page.getByRole('button', { name: '客户', exact: true }).click();
  await page.getByRole('button', { name: '查看 刘先生 详情', exact: true }).click();
  await page.waitForSelector('.detail-view .record');
  // 家属关系演示数据（关联已有客户 + 自由登记）
  await page.getByRole('button', { name: '新增家属', exact: true }).click();
  await page.waitForSelector('dialog.modal[open]');
  await page.locator('#fm-relation').selectOption('夫妻');
  await page.locator('#fm-search').fill('王');
  await page.locator('.search-result', { hasText: '王先生' }).first().click();
  await page.locator('#fm-remark').fill('共同经营批发零售');
  await page.getByRole('button', { name: '保存', exact: true }).click();
  await page.waitForSelector('dialog.modal[open]', { state: 'hidden' });
  await page.waitForFunction(() => (document.querySelector('.detail-view')?.textContent ?? '').includes('夫妻'));
  await page.getByRole('button', { name: '新增家属', exact: true }).click();
  await page.locator('#fm-relation').selectOption('子女');
  await page.locator('#fm-name').fill('小刘');
  await page.locator('#fm-remark').fill('在海外读书');
  await page.getByRole('button', { name: '保存', exact: true }).click();
  await page.waitForSelector('dialog.modal[open]', { state: 'hidden' });
  await page.waitForFunction(() => (document.querySelector('.detail-view')?.textContent ?? '').includes('小刘'));
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(SHOT_DIR, '04-customer-detail.png') });
  await page.getByRole('button', { name: '返回', exact: true }).click();
  await page.waitForSelector('.toolbar');

  // 7) 祝福弹窗
  await page.getByRole('button', { name: '首页', exact: true }).click();
  await page.getByRole('button', { name: '生成祝福', exact: true }).first().click();
  await page.waitForSelector('dialog.modal[open]');
  await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(SHOT_DIR, '05-blessing.png') });
  await page.getByRole('button', { name: '关闭', exact: true }).click();

  // 8) 提醒页
  await page.getByRole('button', { name: '提醒', exact: true }).click();
  await page.waitForSelector('.timeline');
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(SHOT_DIR, '06-reminders.png') });

  // 9) 维护记录二次编辑
  await page.getByRole('button', { name: '编辑维护记录', exact: true }).first().click();
  await page.waitForSelector('dialog.modal[open]');
  await page.screenshot({ path: path.join(SHOT_DIR, '11-record-edit.png') });
  await page.locator('#record-remark').fill('客户表示感谢，已预约回访，保持联系');
  await page.getByRole('button', { name: '保存修改', exact: true }).click();
  await page.waitForSelector('.toast-show');
  await page.waitForSelector('.toast-show', { state: 'hidden' }).catch(() => {});

  // 10) 新增客户表单
  await page.getByRole('button', { name: '客户', exact: true }).click();
  await page.getByRole('button', { name: '新增客户', exact: true }).click();
  await page.waitForSelector('dialog.modal[open]');
  await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(SHOT_DIR, '12-add-customer.png') });
  await page.getByRole('button', { name: '取消', exact: true }).click();

  // 11) 设置页
  await page.getByRole('button', { name: '设置', exact: true }).click();
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(SHOT_DIR, '09-settings.png') });

  // 12) 清空数据三次确认
  await page.getByRole('button', { name: '清空数据', exact: true }).click();
  await page.waitForSelector('dialog.modal[open]');
  await page.getByRole('button', { name: '继续', exact: true }).click();
  await page.getByRole('button', { name: '再次确认', exact: true }).click();
  await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(SHOT_DIR, '10-clear-data.png') });
  await page.getByRole('button', { name: '取消', exact: true }).click();

  if (errors.length > 0) throw new Error(`浏览器报错：\n${errors.join('\n')}`);
  console.log('MANUAL_SCREENSHOTS_OK');
  console.log('files:', fs.readdirSync(SHOT_DIR).filter((f) => f.endsWith('.png')).join(', '));
} finally {
  if (browser) await browser.close();
  server.kill();
}
