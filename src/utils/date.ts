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

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

function isValidYMD(y: number, m: number, d: number): boolean {
  if (!Number.isInteger(y) || !Number.isInteger(m) || !Number.isInteger(d)) return false;
  if (y < 1900 || y > 2100 || m < 1 || m > 12 || d < 1) return false;
  const maxDay = new Date(Date.UTC(y, m, 0)).getUTCDate();
  return d <= maxDay;
}

function isValidMD(m: number, d: number): boolean {
  if (!Number.isInteger(m) || !Number.isInteger(d)) return false;
  if (m < 1 || m > 12 || d < 1) return false;
  // 无年份时按闰年判断，允许 02-29
  const maxDay = new Date(Date.UTC(2000, m, 0)).getUTCDate();
  return d <= maxDay;
}

function formatYMD(y: number, m: number, d: number): string {
  return `${y}-${pad2(m)}-${pad2(d)}`;
}

function formatMD(m: number, d: number): string {
  return `${pad2(m)}-${pad2(d)}`;
}

/**
 * 智能解析生日：兼容常见输入格式，统一转换为 YYYY-MM-DD 或 MM-DD。
 * 支持：1990-08-05、08-05、1990/08/05、1990.08.05、1990年8月5日、8月5日、8-5、
 * 无分隔符 19900805 / 0805 以及 Date 对象等。无法解析或日期不存在时返回 null。
 */
export function parseFlexibleBirthday(v: unknown): string | null {
  if (v === null || v === undefined || v === '') return null;

  if (v instanceof Date && !Number.isNaN(v.getTime())) {
    return formatYMD(v.getFullYear(), v.getMonth() + 1, v.getDate());
  }

  if (typeof v === 'number') {
    if (Number.isInteger(v) && v >= 19000101 && v <= 21001231) {
      const y = Math.floor(v / 10000);
      const m = Math.floor(v / 100) % 100;
      const d = v % 100;
      if (isValidYMD(y, m, d)) return formatYMD(y, m, d);
    }
    if (Number.isInteger(v) && v >= 101 && v <= 1231) {
      const m = Math.floor(v / 100);
      const d = v % 100;
      if (isValidMD(m, d)) return formatMD(m, d);
    }
    return null;
  }

  if (typeof v !== 'string') return null;

  const s = String(v)
    .trim()
    .replace(/(上午|下午|时|点).*$/, '')
    .replace(/\s+\d{1,2}:\d{2}(:\d{2})?.*$/, '')
    .replace(/[．。]/g, '.')
    .replace(/[／]/g, '/')
    .replace(/[－–—]/g, '-')
    .replace(/年/g, '-')
    .replace(/月/g, '-')
    .replace(/日/g, '')
    .replace(/\s+/g, '')
    .trim();
  if (!s) return null;

  const parts = s.split(/[^0-9]+/).filter(Boolean).map(Number);
  if (parts.length === 3) {
    const [y, m, d] = parts;
    if (isValidYMD(y, m, d)) return formatYMD(y, m, d);
    return null;
  }
  if (parts.length === 2) {
    const [m, d] = parts;
    if (isValidMD(m, d)) return formatMD(m, d);
    return null;
  }
  if (parts.length === 1) {
    const n = parts[0];
    if (n >= 19000101 && n <= 21001231) {
      const y = Math.floor(n / 10000);
      const m = Math.floor(n / 100) % 100;
      const d = n % 100;
      if (isValidYMD(y, m, d)) return formatYMD(y, m, d);
    }
    if (n >= 101 && n <= 1231) {
      const m = Math.floor(n / 100);
      const d = n % 100;
      if (isValidMD(m, d)) return formatMD(m, d);
    }
  }
  return null;
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
