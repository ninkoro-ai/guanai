import { LEVEL_SHORT } from '../constants';
import type { Level } from '../db';

export function LevelBadge({ level }: { level: Level }) {
  const suffix = level === 'A' ? '重点客户' : level === 'B' ? '重要客户' : '普通客户';
  return <span className={`badge badge-${level.toLowerCase()}`}>{LEVEL_SHORT[level]}{suffix}</span>;
}
