import type { Customer } from '../db';

const INDUSTRY_LINES: Record<string, string> = {
  制造业: '祝您事业稳步发展，再创佳绩。',
  建筑业: '祝您工程顺利，宏图大展。',
  房地产: '祝您事业兴旺，事事顺心。',
  批发零售: '祝您生意红火，客源广进。',
  信息技术: '祝您事业步步高升，创新不断。',
  服务业: '祝您生意兴隆，蒸蒸日上。',
  金融业: '祝您财源广进，投资顺利。',
  其他: '祝您万事顺意。',
};

export function industryLine(industry: string): string {
  return INDUSTRY_LINES[industry] ?? '祝您万事顺意。';
}

export function remarkLine(remark: string): string {
  if (remark.includes('茶')) return '回头再一起喝茶。';
  if (remark.includes('合作')) return '感谢多年合作，期待继续同行。';
  if (remark.includes('授信')) return '授信的事我们继续跟进，您放心。';
  return '';
}

export function blessingVariants(c: Pick<Customer, 'displayName' | 'level' | 'industry' | 'remark'>): string[] {
  const trust = c.level === 'A' ? '感谢您一直以来的支持和信任。' : c.level === 'B' ? '谢谢您一直以来的信任。' : '';
  const rem = remarkLine(c.remark);
  const v1 = [c.displayName + '，生日快乐！', trust, industryLine(c.industry), rem, '祝您事业顺利，身体健康，家庭幸福。']
    .filter(Boolean)
    .join('\n');
  const v2 = [
    c.displayName + '，生日快乐！',
    c.level === 'A' ? '和您合作非常愉快，每年都盼着这一天。' : '新的一岁，愿您每天都顺心。',
    c.level === 'A' ? industryLine(c.industry) : '万事顺意，步步高升。',
    rem,
    '常联系！',
  ].filter(Boolean).join('\n');
  return [v1, v2];
}
