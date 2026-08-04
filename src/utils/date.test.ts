import { describe, expect, it } from 'vitest';
import { birthdayInfo, currentMonth, parseBirthday, todayKey } from './date';

describe('parseBirthday', () => {
  it('accepts full date and month-day', () => {
    expect(parseBirthday('1988-08-20')).toBe('1988-08-20');
    expect(parseBirthday('08-20')).toBe('08-20');
  });

  it('rejects invalid values', () => {
    expect(parseBirthday('')).toBeNull();
    expect(parseBirthday('bad')).toBeNull();
    expect(parseBirthday('13-20')).toBeNull();
    expect(parseBirthday('08-32')).toBeNull();
    expect(parseBirthday('2026/08/20')).toBeNull();
  });
});

describe('birthdayInfo', () => {
  const today = new Date(2026, 7, 4);

  it('marks today', () => {
    expect(birthdayInfo('08-04', today).isToday).toBe(true);
    expect(birthdayInfo('08-04', today).label).toBe('今天');
  });

  it('counts upcoming days excluding today', () => {
    expect(birthdayInfo('08-10', today).days).toBe(6);
    expect(birthdayInfo('1988-08-10', today).days).toBe(6);
  });

  it('rolls past birthdays to next year', () => {
    expect(birthdayInfo('07-28', today).days).toBe(358);
  });
});

describe('keys', () => {
  it('formats today key and month', () => {
    expect(todayKey(new Date(2026, 7, 4))).toBe('2026-08-04');
    expect(currentMonth(new Date(2026, 7, 4))).toBe('08');
  });
});
