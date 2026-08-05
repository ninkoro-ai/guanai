import { describe, expect, it } from 'vitest';
import { birthdayInfo, birthdayMonth, currentMonth, isRealDate, parseFlexibleBirthday, todayKey } from './date';

describe('isRealDate', () => {
  it('validates real calendar dates including leap days', () => {
    expect(isRealDate(2, 29, 2024)).toBe(true);
    expect(isRealDate(2, 29, 2026)).toBe(false);
    expect(isRealDate(4, 31)).toBe(false);
    expect(isRealDate(13, 1)).toBe(false);
    expect(isRealDate(0, 1)).toBe(false);
  });
});

describe('parseFlexibleBirthday', () => {
  it('accepts standard formats', () => {
    expect(parseFlexibleBirthday('1990-08-05')).toBe('1990-08-05');
    expect(parseFlexibleBirthday('08-05')).toBe('08-05');
  });

  it('accepts common user input formats and normalizes', () => {
    expect(parseFlexibleBirthday('1990/08/05')).toBe('1990-08-05');
    expect(parseFlexibleBirthday('1990.08.05')).toBe('1990-08-05');
    expect(parseFlexibleBirthday('1990年8月5日')).toBe('1990-08-05');
    expect(parseFlexibleBirthday('1990年08月05日')).toBe('1990-08-05');
    expect(parseFlexibleBirthday('8月5日')).toBe('08-05');
    expect(parseFlexibleBirthday('8-5')).toBe('08-05');
    expect(parseFlexibleBirthday('8/5')).toBe('08-05');
    expect(parseFlexibleBirthday('8.5')).toBe('08-05');
  });

  it('accepts separatorless and Date values', () => {
    expect(parseFlexibleBirthday('19900805')).toBe('1990-08-05');
    expect(parseFlexibleBirthday('0805')).toBe('08-05');
    expect(parseFlexibleBirthday(new Date(2026, 7, 5))).toBe('2026-08-05');
  });

  it('rejects empty, impossible and unrecognizable values', () => {
    expect(parseFlexibleBirthday('')).toBeNull();
    expect(parseFlexibleBirthday(null)).toBeNull();
    expect(parseFlexibleBirthday(undefined)).toBeNull();
    expect(parseFlexibleBirthday('bad')).toBeNull();
    expect(parseFlexibleBirthday('2026-02-30')).toBeNull();
    expect(parseFlexibleBirthday('13月40日')).toBeNull();
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

  it('extracts month from full and yearless birthdays', () => {
    expect(birthdayMonth('1988-08-05')).toBe('08');
    expect(birthdayMonth('08-05')).toBe('08');
    expect(birthdayMonth('1990-12-31')).toBe('12');
  });
});
