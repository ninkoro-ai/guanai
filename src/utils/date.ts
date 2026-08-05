const DAY = 86400000;

export interface BirthdayInfo {
  /** 距离下一次生日的天数，0 表示今天 */
  days: number;
  label: string;
  md: string;
  isToday: boolean;
}

/** 校验真实日历日期（含闰年）；无年份时按闰年处理，允许 02-29 */
export function isRealDate(month: number, day: number, year?: number): boolean {
  if (!Number.isInteger(month) || !Number.isInteger(day)) return false;
  if (month < 1 || month > 12 || day < 1) return false;
  const y = year ?? 2000;
  const maxDay = new Date(Date.UTC(y, month, 0)).getUTCDate();
  return day <= maxDay;
}

export function parseBirthday(v: string): string | null {
  const s = String(v ?? '').trim();
  const m = s.match(/^(\d{4}-)?(\d{2})-(\d{2})$/);
  if (!m) return null;
  const year = m[1] ? Number(m[1].slice(0, 4)) : undefined;
  const month = Number(m[2]);
  const day = Number(m[3]);
  if (!isRealDate(month, day, year)) return null;
  return s;
}

/** 取生日的月份段（兼容 YYYY-MM-DD 与 MM-DD） */
export function birthdayMonth(birthday: string): string {
  return birthday.slice(-5, -3);
}

export function birthdayInfo(birthday: string, today = new Date()): BirthdayInfo {
  const parts = birthday.split('-').map(Number);
  const month = parts[parts.length - 2];
  const day = parts[parts.length - 1];
  const t = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const tNum = Date.UTC(t.getFullYear(), t.getMonth(), t.getDate()) / DAY;
  let num = Date.UTC(t.getFullYear(), month - 1, day) / DAY;
  if (num < tNum) num = Date.UTC(t.getFullYear() + 1, month - 1, day) / DAY;
  const days = num - tNum;
  const label = days === 0 ? '今天' : days === 1 ? '明天' : `${days} 天后`;
  return { days, label, md: `${month}月${day}日`, isToday: days === 0 };
}

export function todayKey(d = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function currentMonth(d = new Date()): string {
  return String(d.getMonth() + 1).padStart(2, '0');
}

export function formatTodayHeading(d = new Date()): string {
  const week = ['日', '一', '二', '三', '四', '五', '六'][d.getDay()];
  return `${d.getMonth() + 1}月${d.getDate()}日 星期${week}`;
}
