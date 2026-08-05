import type { Gender } from '../db';

/** 性别标签：男（蓝）/ 女（粉）/ 未知（灰） */
export function GenderBadge({ gender }: { gender: Gender }) {
  const cls = gender === '男' ? 'badge badge-gender-m' : gender === '女' ? 'badge badge-gender-f' : 'badge badge-gender-u';
  return <span className={cls}>{gender}</span>;
}
