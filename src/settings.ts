export interface AppSettings {
  /** 当前用户名（用于 Header 问候与后续日报汇总） */
  userName: string;
  /** 所属团队 */
  team: string;
  /** 演示模式：开启后加载内置演示数据（与真实数据隔离） */
  demoMode: boolean;
}

const KEY = 'birthday-care.settings.v1';

const DEFAULTS: AppSettings = { userName: '', team: '', demoMode: false };

export function readSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { ...DEFAULTS };
    const parsed = JSON.parse(raw) as Partial<AppSettings>;
    return {
      userName: typeof parsed.userName === 'string' ? parsed.userName : DEFAULTS.userName,
      team: typeof parsed.team === 'string' ? parsed.team : DEFAULTS.team,
      demoMode: typeof parsed.demoMode === 'boolean' ? parsed.demoMode : DEFAULTS.demoMode,
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
