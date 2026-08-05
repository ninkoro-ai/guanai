export interface AppSettings {
  advance7: boolean;
  todayA: boolean;
  /** 当前用户名（用于 Header 问候与后续日报汇总） */
  userName: string;
  /** 所属团队 */
  team: string;
}

const KEY = 'birthday-care.settings.v1';

const DEFAULTS: AppSettings = { advance7: true, todayA: true, userName: '', team: '' };

export function readSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { ...DEFAULTS };
    const parsed = JSON.parse(raw) as Partial<AppSettings>;
    return {
      advance7: typeof parsed.advance7 === 'boolean' ? parsed.advance7 : DEFAULTS.advance7,
      todayA: typeof parsed.todayA === 'boolean' ? parsed.todayA : DEFAULTS.todayA,
      userName: typeof parsed.userName === 'string' ? parsed.userName : DEFAULTS.userName,
      team: typeof parsed.team === 'string' ? parsed.team : DEFAULTS.team,
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
