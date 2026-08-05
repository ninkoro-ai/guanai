import { todayKey } from './utils/date';

const KEY = 'birthday-care.export-reminder.v1';

/** 每日最多提醒一次：当天已提醒过则不再弹出 */
export function shouldShowExportReminder(now = new Date()): boolean {
  try {
    return localStorage.getItem(KEY) !== todayKey(now);
  } catch {
    return true;
  }
}

/** 记录“今日已提醒” */
export function markExportReminderShown(now = new Date()): void {
  try {
    localStorage.setItem(KEY, todayKey(now));
  } catch {
    // 隐私模式等场景下忽略写入失败
  }
}
