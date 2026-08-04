const DAY = 86400000;

export interface BirthdayInfo {
  /** 距离下一次生日的天数，0 表示今天 */
  days: number;
  label: string;
  md: string;
  isToday: boolean;
}

export function parseBirthday(v: string): string | null {
  const s = String(v ?? '').trim();
  const m = s.match(/^(\d{4}-)?(\d{2})-(\d{2})$/);
  if (!m) return null;
  const month = Number(m[2]);
  const day = Number(m[3]);
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  return s;
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
