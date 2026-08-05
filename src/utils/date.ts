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

export interface BirthProfile {
  /** 生日是否包含出生年份 */
  hasYear: boolean;
  /** 周岁年龄（无年份时为 null） */
  age: number | null;
  /** 属相 */
  zodiac: string | null;
  /** 是否为今年本命年 */
  zodiacYear: boolean;
  /** 星座 */
  sign: string | null;
}

export const ZODIACS = ['鼠', '牛', '虎', '兔', '龙', '蛇', '马', '羊', '猴', '鸡', '狗', '猪'];
export const SIGNS = ['水瓶', '双鱼', '白羊', '金牛', '双子', '巨蟹', '狮子', '处女', '天秤', '天蝎', '射手', '摩羯'];

// 星座按“月*100+日”的起始边界排序，用于区间匹配
const SIGN_BOUNDS: Array<{ sign: string; from: number }> = [
  { sign: '摩羯', from: 101 },
  { sign: '水瓶', from: 120 },
  { sign: '双鱼', from: 219 },
  { sign: '白羊', from: 321 },
  { sign: '金牛', from: 420 },
  { sign: '双子', from: 521 },
  { sign: '巨蟹', from: 622 },
  { sign: '狮子', from: 723 },
  { sign: '处女', from: 823 },
  { sign: '天秤', from: 923 },
  { sign: '天蝎', from: 1024 },
  { sign: '射手', from: 1123 },
  { sign: '摩羯', from: 1222 },
];

function zodiacOf(year: number): string {
  return ZODIACS[(((year - 4) % 12) + 12) % 12];
}

function signOf(month: number, day: number): string | null {
  const md = month * 100 + day;
  for (let i = SIGN_BOUNDS.length - 1; i >= 0; i -= 1) {
    if (md >= SIGN_BOUNDS[i].from) return SIGN_BOUNDS[i].sign;
  }
  return null;
}

/** 生日的星座（仅按月日判断，无年份也可返回） */
export function birthdaySign(birthday: string): string | null {
  const parts = birthday.split('-').map(Number);
  if (parts.length < 2 || !Number.isInteger(parts[parts.length - 2]) || !Number.isInteger(parts[parts.length - 1])) {
    return null;
  }
  return signOf(parts[parts.length - 2], parts[parts.length - 1]);
}

/** 生日的属相（需包含出生年份；仅月日返回 null） */
export function birthdayZodiac(birthday: string): string | null {
  const parts = birthday.split('-');
  if (parts.length !== 3 || !/^\d{4}-/.test(birthday)) return null;
  const year = Number(parts[0]);
  if (!Number.isInteger(year)) return null;
  return zodiacOf(year);
}

/** 根据生日计算年龄、属相、本命年与星座；仅含年份的生日才返回标签信息 */
export function birthProfile(birthday: string, today = new Date()): BirthProfile {
  const parts = birthday.split('-').map(Number);
  if (parts.length < 2 || !Number.isInteger(parts[parts.length - 2]) || !Number.isInteger(parts[parts.length - 1])) {
    return { hasYear: false, age: null, zodiac: null, zodiacYear: false, sign: null };
  }
  const hasYear = parts.length === 3 && /^\d{4}-/.test(birthday);
  const month = parts[parts.length - 2];
  const day = parts[parts.length - 1];
  if (!hasYear) {
    return { hasYear: false, age: null, zodiac: null, zodiacYear: false, sign: null };
  }
  const year = parts[0];
  let age = today.getFullYear() - year;
  const thisYearBirthday = new Date(today.getFullYear(), month - 1, day);
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  if (thisYearBirthday.getTime() > todayStart.getTime()) age -= 1;
  const zodiac = zodiacOf(year);
  return {
    hasYear: true,
    age: Math.max(0, age),
    zodiac,
    zodiacYear: zodiacOf(today.getFullYear()) === zodiac,
    sign: signOf(month, day),
  };
}

export function formatTodayHeading(d = new Date()): string {
  const week = ['日', '一', '二', '三', '四', '五', '六'][d.getDay()];
  return `${d.getMonth() + 1}月${d.getDate()}日 星期${week}`;
}
