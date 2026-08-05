// 心桥 - Cloudflare Pages 部署脚本
// 前置：已构建 dist/，npm install 完成（依赖 wrangler）
// 用法：
//   $env:CF_API_TOKEN='<token>'
//   node scripts/deploy-cloudflare.mjs
//
// 说明：
// 1) 项目/DNS/自定义域名通过 Cloudflare REST API 管理（已验证可用）
// 2) 文件上传改用官方 Wrangler CLI（wrangler pages deploy），
//    其内部走 upload-token/JWT 流程，是 Pages Direct Upload 的官方可靠路径
import * as fs from 'node:fs';
import * as path from 'node:path';
import { execSync } from 'node:child_process';

const TOKEN = process.env.CF_API_TOKEN;
const DIST = path.resolve('dist');
const PROJECT_NAME = 'xinqiao';
const DOMAIN = 'xinqiao.ninkoro.com';
const API = 'https://api.cloudflare.com/client/v4';

if (!TOKEN) {
  console.error('缺少 CF_API_TOKEN 环境变量');
  process.exit(1);
}
if (!fs.existsSync(DIST)) {
  console.error(`构建产物不存在：${DIST}，请先执行 npm run build`);
  process.exit(1);
}

async function cf(method, urlPath, body, extraHeaders = {}) {
  const headers = { Authorization: `Bearer ${TOKEN}`, ...extraHeaders };
  const res = await fetch(`${API}${urlPath}`, {
    method,
    headers,
    body: body !== undefined ? body : undefined,
  });
  const text = await res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    json = { raw: text.slice(0, 600) };
  }
  return { status: res.status, json };
}

function log(step, ok, detail = '') {
  console.log(`${ok ? '[OK]' : '[!!]'} ${step}${detail ? ' - ' + detail : ''}`);
}

// 1) 校验令牌
const verify = await cf('GET', '/user/tokens/verify');
if (verify.status !== 200 || !verify.json.success) {
  log('令牌校验', false, JSON.stringify(verify.json.errors ?? verify.json));
  process.exit(1);
}
log('令牌校验', true, 'valid');

// 2) 获取账号 ID（优先 /accounts，其次从域名信息反查）
let ACCOUNT_ID = process.env.CF_ACCOUNT_ID;
if (!ACCOUNT_ID) {
  const accounts = await cf('GET', '/accounts');
  const account = accounts.json?.result?.[0];
  if (account) ACCOUNT_ID = account.id;
}

// 3) 查找 ninkoro.com 域名
const zones = await cf('GET', `/zones?name=ninkoro.com`);
const zone = zones.json?.result?.[0];
if (!zone) {
  log('查找域名', false, '未找到 ninkoro.com（需先在 Cloudflare 托管该域名）');
  process.exit(1);
}
if (!ACCOUNT_ID) ACCOUNT_ID = zone.account?.id;
log('查找域名', true, `${zone.name} (${zone.status})，账号 ${zone.account?.name ?? ACCOUNT_ID}`);
if (!ACCOUNT_ID) {
  log('获取账号', false, '无法确定账号 ID');
  process.exit(1);
}
log('获取账号', true, zone.account?.name ?? ACCOUNT_ID);

// 4) 查询子域名 DNS 现状（用于替换已有页面指向）
const dnsRes = await cf('GET', `/zones/${zone.id}/dns_records?name=${DOMAIN}`);
const dnsRecords = dnsRes.json?.result ?? [];
log('DNS 现状', true, dnsRecords.map((r) => `${r.type} ${r.name} -> ${r.content}${r.proxied ? ' (代理)' : ''}`).join('，') || '无记录');

// 5) 查找/创建 Pages 项目
const projectsRes = await cf('GET', `/accounts/${ACCOUNT_ID}/pages/projects`);
const projects = projectsRes.json?.result ?? [];
let project = projects.find((p) => p.name === PROJECT_NAME);
const projectWithDomain = projects.find((p) => (p.domains ?? []).includes(DOMAIN));
if (!project && projectWithDomain) project = projectWithDomain;

if (!project) {
  const created = await cf('POST', `/accounts/${ACCOUNT_ID}/pages/projects`, JSON.stringify({
    name: PROJECT_NAME,
    production_branch: 'main',
  }), { 'Content-Type': 'application/json' });
  if (!created.json?.success) {
    log('创建 Pages 项目', false, JSON.stringify(created.json.errors ?? created.json));
    process.exit(1);
  }
  project = created.json.result;
  log('创建 Pages 项目', true, project.name);
} else {
  log('查找 Pages 项目', true, project.name);
}

// 6) 绑定自定义域名
const domainsRes = await cf('GET', `/accounts/${ACCOUNT_ID}/pages/projects/${project.name}/domains`);
const hasDomain = (domainsRes.json?.result ?? []).some((d) => d.name === DOMAIN);
if (!hasDomain) {
  const added = await cf('POST', `/accounts/${ACCOUNT_ID}/pages/projects/${project.name}/domains`, JSON.stringify({ name: DOMAIN }), { 'Content-Type': 'application/json' });
  if (!added.json?.success) {
    log('绑定自定义域名', false, JSON.stringify(added.json.errors ?? added.json));
    process.exit(1);
  }
  log('绑定自定义域名', true, DOMAIN);
} else {
  log('绑定自定义域名', true, `${DOMAIN}（已绑定）`);
}

// 7) 确保 DNS CNAME 指向 Pages 项目（替换旧页面指向）
const cnameTarget = `${project.name}.pages.dev`;
const cname = dnsRecords.find((r) => r.type === 'CNAME');
if (cname && cname.content !== cnameTarget) {
  const upd = await cf('PUT', `/zones/${zone.id}/dns_records/${cname.id}`, JSON.stringify({ type: 'CNAME', name: DOMAIN, content: cnameTarget, proxied: true, ttl: 1 }), { 'Content-Type': 'application/json' });
  log('更新 DNS CNAME', !!upd.json?.success, JSON.stringify(upd.json.errors ?? '') || `${DOMAIN} -> ${cnameTarget}`);
} else if (!cname) {
  for (const r of dnsRecords.filter((x) => x.type === 'A' || x.type === 'AAAA')) {
    await cf('DELETE', `/zones/${zone.id}/dns_records/${r.id}`);
    log('移除旧 DNS 记录', true, `${r.type} ${r.name}`);
  }
  const created = await cf('POST', `/zones/${zone.id}/dns_records`, JSON.stringify({ type: 'CNAME', name: DOMAIN, content: cnameTarget, proxied: true, ttl: 1 }), { 'Content-Type': 'application/json' });
  log('创建 DNS CNAME', !!created.json?.success, JSON.stringify(created.json.errors ?? '') || `${DOMAIN} -> ${cnameTarget}`);
} else {
  log('DNS CNAME', true, `${DOMAIN} -> ${cnameTarget}`);
}

// 8) 官方 Wrangler 上传部署（Direct Upload 的可靠路径）
const commitHash = execSync('git rev-parse --short HEAD', { encoding: 'utf8' }).trim();
console.log(`[RUN] wrangler pages deploy ${DIST} --project-name=${PROJECT_NAME} --branch=main`);
const wranglerCmd = `npx.cmd wrangler pages deploy "${DIST}" --project-name=${PROJECT_NAME} --branch=main --commit-dirty=true --commit-hash=${commitHash}`;
try {
  execSync(wranglerCmd, {
    cwd: process.cwd(),
    stdio: 'inherit',
    env: {
      ...process.env,
      CLOUDFLARE_API_TOKEN: TOKEN,
      CLOUDFLARE_ACCOUNT_ID: ACCOUNT_ID,
      WRANGLER_LOG_PATH: path.resolve('.wrangler-logs/wrangler.log'),
    },
  });
} catch (e) {
  log('Wrangler 上传部署', false, String(e.message ?? e).slice(0, 500));
  process.exit(1);
}
log('Wrangler 上传部署', true, `${DIST} -> ${PROJECT_NAME}`);

// 9) 轮询部署状态并验证线上可访问
const latest = await cf('GET', `/accounts/${ACCOUNT_ID}/pages/projects/${project.name}/deployments?per_page=1`);
const latestDep = latest.json?.result?.[0];
if (!latestDep) {
  log('查询最新部署', false, '未找到部署记录');
  process.exit(1);
}
log('查询最新部署', true, `${latestDep.short_id} ${latestDep.url}${latestDep.aliases?.length ? ` -> ${latestDep.aliases.join(',')}` : ''}`);

for (let i = 0; i < 15; i += 1) {
  await new Promise((r) => setTimeout(r, 3000));
  try {
    const res = await fetch(`https://${DOMAIN}/`);
    const html = await res.text();
    if (res.ok && html.includes('心桥')) {
      log('线上验证', true, `https://${DOMAIN} 返回 200，页面包含“心桥”`);
      console.log('部署地址：https://' + DOMAIN);
      console.log('项目地址：https://' + cnameTarget);
      process.exit(0);
    }
  } catch {
    // 等待边缘生效
  }
}
log('线上验证', false, '超时未就绪，请稍后访问 https://xinqiao.ninkoro.com');
process.exit(1);
