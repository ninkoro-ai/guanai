export interface AppSettings {
  advance7: boolean;
  todayA: boolean;
}

const KEY = 'birthday-care.settings.v1';

const DEFAULTS: AppSettings = { advance7: true, todayA: true };

export function readSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { ...DEFAULTS };
    const parsed = JSON.parse(raw) as Partial<AppSettings>;
    return {
      advance7: typeof parsed.advance7 === 'boolean' ? parsed.advance7 : DEFAULTS.advance7,
      todayA: typeof parsed.todayA === 'boolean' ? parsed.todayA : DEFAULTS.todayA,
    };
  } catch {
    return { ...DEFAULTS };
  }
}

export function writeSettings(s: AppSettings): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    // 隐私模式等场景下忽略写入失败
  }
}
