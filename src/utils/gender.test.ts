import { describe, expect, it } from 'vitest';
import { inferGenderFromName } from './gender';

describe('inferGenderFromName', () => {
  it('detects male from 先生/哥/男士/男生 etc', () => {
    expect(inferGenderFromName('刘先生')).toBe('男');
    expect(inferGenderFromName('王哥')).toBe('男');
    expect(inferGenderFromName('李男士')).toBe('男');
    expect(inferGenderFromName('张男生')).toBe('男');
  });

  it('detects female from 女士/姐/妹/女生 etc', () => {
    expect(inferGenderFromName('王女士')).toBe('女');
    expect(inferGenderFromName('李姐')).toBe('女');
    expect(inferGenderFromName('张妹')).toBe('女');
    expect(inferGenderFromName('赵女生')).toBe('女');
  });

  it('returns null for ambiguous or empty names', () => {
    expect(inferGenderFromName('小刘')).toBeNull();
    expect(inferGenderFromName('')).toBeNull();
    expect(inferGenderFromName('   ')).toBeNull();
  });
});
