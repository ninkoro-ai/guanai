import type { Level } from './db';

export const INDUSTRIES = ['制造业', '建筑业', '房地产', '批发零售', '信息技术', '服务业', '金融业', '其他'] as const;

export const GENDERS = ['男', '女', '未知'] as const;

export const LEVELS: Level[] = ['A', 'B', 'C'];

export const LEVEL_LABELS: Record<Level, string> = {
  A: 'A类重点客户',
  B: 'B类重要客户',
  C: 'C类普通客户',
};

export const LEVEL_SHORT: Record<Level, string> = {
  A: 'A类',
  B: 'B类',
  C: 'C类',
};

export function levelOrder(level: Level): number {
  return level === 'A' ? 0 : level === 'B' ? 1 : 2;
}
