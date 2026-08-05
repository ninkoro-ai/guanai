import type { Gender } from '../db';

const MALE_KEYS = ['先生', '男士', '男生', '哥', '兄', '爸', '叔', '伯', '舅', '爷', '仔', '少'];
const FEMALE_KEYS = ['女士', '女生', '姐', '妹', '妈', '娘', '姨', '嫂', '姑', '婆', '奶'];

/** 根据客户简称智能推断性别：先生/哥/男士/男生 → 男；女士/姐/妹/女生 → 女；无法判断返回 null */
export function inferGenderFromName(name: string): Gender | null {
  const s = (name ?? '').trim();
  if (!s) return null;
  if (FEMALE_KEYS.some((k) => s.includes(k))) return '女';
  if (MALE_KEYS.some((k) => s.includes(k))) return '男';
  return null;
}
