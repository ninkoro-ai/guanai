import { spawn } from 'node:child_process';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as XLSX from 'xlsx';
import { chromium } from 'playwright';

const PORT = 4173;
const BASE = `http://localhost:${PORT}`;
const SHOT_DIR = path.resolve('screenshots');
const FIXTURE = path.join(SHOT_DIR, 'fixture.xlsx');

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
      setTimeout(tick, 400);
    };
    void tick();
  });
}

function buildFixture() {
  const ws = XLSX.utils.aoa_to_sheet([
    ['客户编号', '客户简称', '生日', '性别', '行业', '客户等级', '备注'],
    ['C003', '张先生', '1988-08-20', '男', '制造业', 'A类', ''],
    ['C004', '周女士', '08-15', '女', '服务业', 'B类', ''],
    ['', '错误客户', '2020-01-01', '男', '其他', 'C类', ''],
    ['C005', '郑先生', '1990年8月5日', '男', '其他', 'C类', ''],
    ['C006', '错误日期', '2026-02-30', '男', '其他', 'C类', ''],
    ['C20260001', '刘先生改', '1988-08-04', '男', '制造业', 'A类', '覆盖测试'],
  ]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, '客户');
  const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
  fs.writeFileSync(FIXTURE, buf);
}

async function launch() {
  try {
    return await chromium.launch({ channel: 'msedge', headless: true });
  } catch {
    return chromium.launch({ headless: true });
  }
}

fs.mkdirSync(SHOT_DIR, { recursive: true });
buildFixture();

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
    const FIXED = new RealDate(2026, 7, 4, 10, 0, 0).getTime();
    class MockDate extends RealDate {
      constructor(...args) {
        super(...(args.length ? args : [FIXED]));
      }
      static now() {
        return FIXED;
      }
    }
    window.Date = MockDate;
  });

  const errors = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(`console: ${msg.text()}`);
  });
  page.on('pageerror', (err) => errors.push(`pageerror: ${err.message}`));
  page.on('dialog', (d) => d.accept());

  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.waitForSelector('.app');

  // 新增三个客户（一个今日生日、两个未来 7 天）
  await page.getByRole('button', { name: '客户' }).click();
  await page.waitForSelector('.toolbar');

  async function addCustomer(no, name, birthday, gender, level, industry, remark, company, position) {
    await page.getByRole('button', { name: /新增客户/ }).click();
    await page.locator('#add-no').fill(no);
    await page.locator('#add-name').fill(name);
    await page.locator('#add-birthday').fill(birthday);
    await page.locator('#add-gender').selectOption(gender);
    await page.locator('#add-level').selectOption(level);
    await page.locator('#add-industry').selectOption(industry);
    if (remark) await page.locator('#add-remark').fill(remark);
    if (company) await page.locator('#add-company').fill(company);
    if (position) await page.locator('#add-position').fill(position);
    await page.getByRole('button', { name: '保存客户' }).click();
    await page.waitForSelector('.toast-show');
    await page.waitForSelector('.toast-show', { state: 'hidden' }).catch(() => {});
  }

  await addCustomer('C20260001', '刘先生', '1988-08-04', '男', 'A', '制造业', '合作5年以上，喜欢茶文化', '华兴制造集团', '总经理');
  await addCustomer('C20260004', '王先生', '08-10', '男', 'A', '批发零售', '合作多年');
  await addCustomer('C20260005', '李女士', '1993-08-11', '女', 'B', '信息技术', '关注理财');

  await page.screenshot({ path: path.join(SHOT_DIR, 'customers.png') });

  // 编辑客户
  await page.getByRole('button', { name: '编辑 刘先生' }).click();
  await page.waitForSelector('dialog.modal[open]');
  await page.locator('#add-remark').fill('喜欢茶文化，重视服务');
  await page.screenshot({ path: path.join(SHOT_DIR, 'edit-modal.png') });
  await page.getByRole('button', { name: '保存修改' }).click();
  await page.waitForSelector('.toast-show');
  await page.waitForSelector('.toast-show', { state: 'hidden' }).catch(() => {});

  // 首页
  await page.getByRole('button', { name: '首页' }).click();
  await page.waitForSelector('.stats');
  await page.screenshot({ path: path.join(SHOT_DIR, 'home.png') });
  const remarkText = await page.locator('.card .remark').first().innerText();
  if (!remarkText.includes('重视服务')) throw new Error('客户编辑未生效');

  const statsText = await page.locator('.stats').innerText();
  if (!statsText.includes('今日生日') || !statsText.includes('未来7天')) throw new Error('首页统计缺失');

  // 生成祝福
  await page.getByRole('button', { name: '生成祝福' }).first().click();
  await page.waitForSelector('dialog.modal[open]');
  await page.screenshot({ path: path.join(SHOT_DIR, 'blessing.png') });
  const bubble = await page.locator('.bubble').innerText();
  if (!bubble.includes('刘先生')) throw new Error('祝福语未包含客户名');
  await page.getByRole('button', { name: '关闭' }).click();

  // 完成维护
  await page.getByRole('button', { name: '完成维护' }).first().click();
  await page.locator('#record-remark').fill('客户表示感谢');
  await page.getByRole('button', { name: '保存记录' }).click();
  await page.waitForSelector('.done-tag');
  await page.screenshot({ path: path.join(SHOT_DIR, 'home-done.png') });

  // 提醒页
  await page.getByRole('button', { name: '提醒' }).click();
  await page.waitForSelector('.timeline');
  await page.screenshot({ path: path.join(SHOT_DIR, 'reminders.png') });

  // 提前 7 天提醒卡片可点击进入客户详情
  await page.locator('.card-link').first().click();
  await page.waitForSelector('.detail-view');
  const detailText = await page.locator('.detail-view').innerText();
  if (!detailText.includes('历史维护记录')) throw new Error('客户详情缺少历史维护记录');
  await page.screenshot({ path: path.join(SHOT_DIR, 'reminder-detail.png') });
  await page.getByRole('button', { name: '返回' }).click();
  await page.waitForSelector('.timeline');

  // 设置页 + 导出
  await page.getByRole('button', { name: '设置' }).click();
  await page.screenshot({ path: path.join(SHOT_DIR, 'settings.png') });
  const dlPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: '导出', exact: true }).click();
  const download = await dlPromise;
  if (!download.suggestedFilename().includes('导出')) throw new Error('导出文件名不正确');

  // 客户页搜索
  await page.getByRole('button', { name: '客户' }).click();
  await page.locator('.search input').fill('C20260001');
  await page.waitForFunction(() => (document.querySelector('.count')?.textContent ?? '').includes('1 位客户'));
  const countAfterSearch = await page.locator('.count').innerText();
  if (!countAfterSearch.includes('1 位客户')) throw new Error(`搜索计数异常: ${countAfterSearch}`);
  await page.locator('.search input').fill('');

  // 本月生日筛选应包含仅月日生日客户（王先生 08-10）
  await page.getByRole('group', { name: '按时间筛选' }).getByRole('button', { name: '本月生日', exact: true }).click();
  await page.waitForFunction(() => (document.querySelector('.count')?.textContent ?? '').includes('3 位客户'));
  await page.getByRole('group', { name: '按时间筛选' }).getByRole('button', { name: '全部', exact: true }).click();

  // 表单拒绝不存在的日期（02-31）
  await page.getByRole('button', { name: '新增客户', exact: true }).click();
  await page.waitForSelector('dialog.modal[open]');
  await page.locator('#add-no').fill('C20260099');
  await page.locator('#add-name').fill('测试客户');
  await page.locator('#add-birthday').fill('02-31');
  await page.getByRole('button', { name: '保存客户', exact: true }).click();
  await page.waitForSelector('.form-error');
  await page.getByRole('button', { name: '取消', exact: true }).click();

  // 客户详情页：历史维护记录 + 二次编辑
  await page.getByRole('button', { name: '查看 刘先生 详情' }).click();
  await page.waitForSelector('.detail-view');
  await page.waitForSelector('.detail-view .record');
  const detailInfo = await page.locator('.detail-view').innerText();
  if (!detailInfo.includes('华兴制造集团') || !detailInfo.includes('总经理')) throw new Error('公司/职位未展示');
  const historyBody = await page.locator('.detail-view .record-body').first().innerText();
  if (!historyBody.includes('客户表示感谢')) throw new Error('详情页历史维护记录缺失');
  await page.screenshot({ path: path.join(SHOT_DIR, 'detail.png') });
  await page.getByRole('button', { name: '编辑维护记录' }).click();
  await page.waitForSelector('dialog.modal[open]');
  await page.locator('#record-remark').fill('客户表示感谢，已确认后续服务');
  await page.getByRole('button', { name: '保存修改' }).click();
  await page.waitForFunction(() => (document.querySelector('.detail-view .record-body')?.textContent ?? '').includes('已确认后续服务'));

  // 家属关系：搜索添加（编号/姓名）、双向自动同步、编辑、删除
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
  await page.locator('#fm-search').fill('李女士');
  await page.locator('.search-result', { hasText: '李女士' }).first().click();
  await page.locator('#fm-remark').fill('在海外读书');
  await page.getByRole('button', { name: '保存', exact: true }).click();
  await page.waitForSelector('dialog.modal[open]', { state: 'hidden' });
  await page.waitForFunction(() => (document.querySelector('.detail-view')?.textContent ?? '').includes('李女士'));
  await page.locator('.detail-view .record', { hasText: '王先生' }).getByRole('button', { name: '编辑家属关系', exact: true }).click();
  await page.waitForSelector('dialog.modal[open]');
  await page.waitForFunction(() => (document.querySelector('#fm-remark')?.value ?? '').includes('共同经营批发零售'));
  await page.locator('#fm-remark').fill('共同经营批发零售，夫妻档');
  await page.getByRole('button', { name: '保存修改', exact: true }).click();
  await page.waitForSelector('dialog.modal[open]', { state: 'hidden' });
  await page.waitForFunction(() => (document.querySelector('.detail-view')?.textContent ?? '').includes('夫妻档'));
  // 反向同步：王先生详情应显示“刘先生（夫妻）”
  await page.getByRole('button', { name: '王先生', exact: true }).click();
  await page.waitForFunction(() => (document.querySelector('.detail-view .card .name')?.textContent ?? '').includes('王先生'));
  const wangFamily = await page.locator('.detail-view').innerText();
  if (!wangFamily.includes('刘先生') || !wangFamily.includes('夫妻')) throw new Error('反向夫妻关系未同步');
  await page.getByRole('button', { name: '返回', exact: true }).click();
  await page.waitForSelector('.toolbar');
  // 反向同步：李女士详情应显示“刘先生（父母）”
  await page.getByRole('button', { name: '查看 刘先生 详情', exact: true }).click();
  await page.waitForSelector('.detail-view');
  await page.getByRole('button', { name: '李女士', exact: true }).click();
  await page.waitForFunction(() => (document.querySelector('.detail-view .card .name')?.textContent ?? '').includes('李女士'));
  const liFamily = await page.locator('.detail-view').innerText();
  if (!liFamily.includes('刘先生') || !liFamily.includes('父母')) throw new Error('反向子女-父母关系未同步');
  await page.getByRole('button', { name: '返回', exact: true }).click();
  await page.waitForSelector('.toolbar');
  // 删除李女士关系后，双方都应移除
  await page.getByRole('button', { name: '查看 刘先生 详情', exact: true }).click();
  await page.waitForSelector('.detail-view');
  await page.locator('.detail-view .record', { hasText: '李女士' }).getByRole('button', { name: '删除家属关系', exact: true }).click();
  await page.waitForFunction(() => !(document.querySelector('.detail-view')?.textContent ?? '').includes('李女士'));
  await page.getByRole('button', { name: '返回', exact: true }).click();
  await page.waitForSelector('.toolbar');
  await page.getByRole('button', { name: '查看 李女士 详情', exact: true }).click();
  await page.waitForSelector('.detail-view');
  const liAfterDelete = await page.locator('.detail-view').innerText();
  if (liAfterDelete.includes('刘先生')) throw new Error('删除后反向关系未清除');
  await page.getByRole('button', { name: '返回', exact: true }).click();
  await page.waitForSelector('.toolbar');

  // 批量导入（含校验、重复、错误报告）
  await page.getByRole('button', { name: '批量导入' }).click();
  await page.waitForSelector('dialog.modal[open]');
  await page.locator('input[type="file"]').setInputFiles(FIXTURE);
  await page.waitForSelector('.result-nums');
  const checkText = await page.locator('dialog.modal[open]').innerText();
  if (!checkText.includes('C20260001')) throw new Error('未识别重复客户');
  if (!checkText.includes('客户编号不能为空')) throw new Error('未展示校验错误');
  if (!checkText.includes('生日日期不存在')) throw new Error('未展示非法日期错误');
  await page.screenshot({ path: path.join(SHOT_DIR, 'import-check.png') });
  await page.getByRole('button', { name: '跳过' }).click();
  await page.waitForSelector('.result-done');
  await page.screenshot({ path: path.join(SHOT_DIR, 'import-result.png') });
  await page.getByRole('button', { name: '撤销导入' }).click();
  await page.waitForSelector('.toast-show');
  await page.waitForFunction(() => (document.querySelector('.count')?.textContent ?? '').includes('3 位客户'));
  const totalCount = await page.locator('.count').innerText();
  if (!totalCount.includes('3 位客户')) throw new Error(`撤销导入后客户数异常: ${totalCount}`);
  await page.waitForSelector('.toast-show', { state: 'hidden' }).catch(() => {});

  // 设置页：创作者标识 + 清空所有数据（三次确认）
  await page.getByRole('button', { name: '设置' }).click();
  const creator = await page.locator('.creator-mark').innerText();
  if (!creator.includes('Powered by Ninkoro.com')) throw new Error('创作者标识缺失');
  await page.getByRole('button', { name: '清空数据' }).click();
  await page.waitForSelector('dialog.modal[open]');
  await page.getByRole('button', { name: '继续' }).click();
  await page.waitForFunction(() => (document.querySelector('.confirm-title')?.textContent ?? '').includes('再次确认'));
  await page.getByRole('button', { name: '再次确认' }).click();
  await page.waitForFunction(() => (document.querySelector('.confirm-title')?.textContent ?? '').includes('最后确认'));
  await page.screenshot({ path: path.join(SHOT_DIR, 'clear-data.png') });
  await page.getByRole('button', { name: '确认清空' }).click();
  await page.waitForSelector('.toast-show');
  await page.waitForFunction(() => !document.querySelector('dialog.modal[open]'));
  await page.getByRole('button', { name: '客户' }).click();
  await page.waitForFunction(() => (document.querySelector('.empty')?.textContent ?? '').includes('没有符合条件的客户'));
  console.log('CLEAR_OK');

  // PWA：manifest 与服务工作者
  const manifestCount = await page.locator('link[rel="manifest"]').count();
  if (manifestCount === 0) throw new Error('未注入 manifest');
  await page.waitForFunction(() => !!navigator.serviceWorker && !!navigator.serviceWorker.controller, null, { timeout: 20000 });
  console.log('PWA_OK');

  // 离线可用
  const ctx = page.context();
  await ctx.setOffline(true);
  try {
    await page.reload({ waitUntil: 'domcontentloaded', timeout: 20000 });
    await page.waitForSelector('.app', { timeout: 20000 });
    await page.waitForSelector('.stats', { timeout: 20000 });
    await page.screenshot({ path: path.join(SHOT_DIR, 'offline.png') });
    console.log('OFFLINE_OK');
  } finally {
    await ctx.setOffline(false);
  }

  // 直接双击 dist/index.html（file://）也能正常使用
  const filePage = await browser.newPage({ viewport: { width: 420, height: 880 } });
  const fileErrors = [];
  filePage.on('pageerror', (e) => fileErrors.push(e.message));
  filePage.on('console', (msg) => {
    if (msg.type() === 'error') fileErrors.push(`console: ${msg.text()}`);
  });
  const fileUrl = 'file:///' + path.resolve('dist/index.html').replace(/\\/g, '/');
  await filePage.goto(fileUrl, { waitUntil: 'load', timeout: 20000 });
  await filePage.waitForSelector('.app', { timeout: 15000 });
  await filePage.waitForSelector('.stats', { timeout: 15000 });
  await filePage.screenshot({ path: path.join(SHOT_DIR, 'file-mode.png') });
  if (fileErrors.length > 0) throw new Error(`file:// 模式报错：\n${fileErrors.join('\n')}`);
  await filePage.close();
  console.log('FILE_MODE_OK');

  if (errors.length > 0) {
    throw new Error(`浏览器报错：\n${errors.join('\n')}`);
  }

  console.log('SMOKE_OK');
  console.log('screenshots:', fs.readdirSync(SHOT_DIR).filter((f) => f.endsWith('.png')).join(', '));
} finally {
  if (browser) await browser.close();
  server.kill();
}
