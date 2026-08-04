import type { Customer } from '../db';

export type BlessingInput = Pick<Customer, 'displayName' | 'level' | 'industry' | 'remark'>;

const OPENINGS = [
  '{name}，生日快乐！',
  '{name}，生日快乐呀！',
  '生日快乐，{name}！',
];

const TRUST: Record<string, string[]> = {
  A: ['感谢您一直以来的支持和信任。', '很荣幸能与您长期同行。', '谢谢您多年来的信任与关照。'],
  B: ['谢谢您的信任，一直记挂着您的生日。', '谢谢您平时对我们的关照。'],
  C: ['祝您新的一岁顺心如意。', '愿您每一天都开开心心。'],
};

const INDUSTRY_LINES: Record<string, string[]> = {
  制造业: ['祝您事业稳步发展，再创佳绩。', '祝您订单满满，事业再上一层楼。'],
  建筑业: ['祝您工程顺利，宏图大展。', '祝您项目如期推进，生意兴隆。'],
  房地产: ['祝您事业兴旺，事事顺心。', '祝您楼盘大卖，资产步步增值。'],
  批发零售: ['祝您生意红火，客源广进。', '祝您门店客似云来，财源广进。'],
  信息技术: ['祝您事业步步高升，创新不断。', '祝您产品大卖，引领行业潮流。'],
  服务业: ['祝您生意兴隆，蒸蒸日上。', '祝您口碑越来越好，顾客盈门。'],
  金融业: ['祝您财源广进，投资顺利。', '祝您事业顺风顺水，财源滚滚。'],
  其他: ['祝您万事顺意。', '祝您心想事成，诸事顺遂。'],
};

/** 备注关键词 → 个性化话题（本地规则匹配，不联网） */
const INTENTS: Array<{ keys: string[]; lines: string[] }> = [
  { keys: ['茶'], lines: ['回头再一起喝茶。', '改天请您喝茶，好好聊聊。'] },
  { keys: ['授信'], lines: ['授信的事我们继续跟进，您放心。', '授信进展我会及时同步给您。'] },
  { keys: ['理财'], lines: ['最近有合适的理财机会，改天给您介绍。', '您的理财配置我会持续帮您打理。'] },
  { keys: ['对公', '结算'], lines: ['对公结算的事随时找我。', '企业结算有需要随时联系我。'] },
  { keys: ['私行'], lines: ['私人银行服务随时为您安排。'] },
  { keys: ['创业', '创始'], lines: ['祝您创业之路越走越宽。'] },
  { keys: ['连锁', '门店'], lines: ['祝您新店开张，生意兴隆。'] },
  { keys: ['家族'], lines: ['祝您家族事业兴旺，代代相传。'] },
  { keys: ['工程', '项目'], lines: ['祝您项目顺顺利利，早日落成。'] },
  { keys: ['公益'], lines: ['祝您的公益事业越做越好。'] },
  { keys: ['港澳', '跨境'], lines: ['跨境业务有需要随时找我。'] },
  { keys: ['采购'], lines: ['祝您采购渠道越走越顺。'] },
  { keys: ['收藏'], lines: ['祝您收藏之路越来越有眼光。'] },
  { keys: ['保险'], lines: ['保障规划随时为您服务。'] },
  { keys: ['同业'], lines: ['期待与您的同业合作更进一步。'] },
  { keys: ['外贸'], lines: ['祝您外贸订单源源不断。'] },
  { keys: ['民宿'], lines: ['祝您民宿口碑越来越好。'] },
  { keys: ['自媒体', '主播'], lines: ['祝您粉丝越来越多，事业长虹。'] },
  { keys: ['写字楼'], lines: ['祝您物业价值节节攀升。'] },
  { keys: ['商会'], lines: ['祝您事业在商界继续发光。'] },
  { keys: ['物业'], lines: ['祝您的物业管理蒸蒸日上。'] },
  { keys: ['合作'], lines: ['感谢多年合作，期待继续同行。', '这些年合作很愉快，继续一起加油。'] },
];

const CLOSINGS = [
  '祝您事业顺利，身体健康，家庭幸福。',
  '祝您身体健康，阖家幸福。',
  '愿您生活美满，万事胜意。',
  '祝您一切顺利，常联系！',
];

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

/** 根据备注智能提取个性化话题，返回候选句子 */
export function intentLines(remark: string): string[] {
  const lines: string[] = [];
  const trimmed = (remark ?? '').trim();
  if (!trimmed) return lines;
  const years = trimmed.match(/(\d+)\s*年/);
  if (years && trimmed.includes('合作')) lines.push(`您与我们合作已${years[1]}年，感谢一路相伴。`);
  for (const intent of INTENTS) {
    if (intent.keys.some((k) => trimmed.includes(k))) lines.push(...intent.lines);
  }
  if (lines.length === 0) lines.push(`记得您备注的“${trimmed.slice(0, 12)}”，有事随时找我。`);
  return lines;
}

/**
 * 离线随机生成个性化生日祝福（30-80 字，微信风格）：
 * 按客户等级选取信任话术、按行业选取事业祝愿、按备注关键词选取个性化话题，随机组合。
 */
export function generateBlessing(c: BlessingInput): string {
  for (let attempt = 0; attempt < 6; attempt += 1) {
    const opening = pick(OPENINGS).replace('{name}', c.displayName);
    const trust = pick(TRUST[c.level] ?? TRUST.C);
    const industry = pick(INDUSTRY_LINES[c.industry] ?? INDUSTRY_LINES['其他']);
    const intents = intentLines(c.remark);
    const intent = intents.length > 0 ? pick(intents) : '';

    let parts = [opening, trust, industry, intent, pick(CLOSINGS)].filter(Boolean);
    let text = parts.join('\n');
    if (text.length > 80) {
      parts = [opening, trust, industry, pick(CLOSINGS)].filter(Boolean);
      text = parts.join('\n');
    }
    if (text.length >= 30 && text.length <= 80) return text;
  }
  return `${c.displayName}，生日快乐！\n祝您事业顺利，身体健康，家庭幸福。\n常联系！`;
}
