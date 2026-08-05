import { afterEach, describe, expect, it } from 'vitest';
import { markExportReminderShown, shouldShowExportReminder } from './exportReminder';

const store = new Map<string, string>();

afterEach(() => {
  store.clear();
});

// vitest node 环境下没有 localStorage，这里注入最小实现
Object.defineProperty(globalThis, 'localStorage', {
  value: {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => { store.set(k, v); },
  },
  configurable: true,
});

describe('exportReminder', () => {
  const day1 = new Date(2026, 7, 5, 10, 0, 0);
  const day2 = new Date(2026, 7, 6, 10, 0, 0);

  it('shows reminder on first completion of the day', () => {
    expect(shouldShowExportReminder(day1)).toBe(true);
    markExportReminderShown(day1);
    expect(shouldShowExportReminder(day1)).toBe(false);
  });

  it('shows again on a new day', () => {
    markExportReminderShown(day1);
    expect(shouldShowExportReminder(day2)).toBe(true);
  });
});
