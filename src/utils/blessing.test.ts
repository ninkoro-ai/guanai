import { describe, expect, it } from 'vitest';
import type { Customer } from '../db';
import { blessingVariants } from './blessing';

const base: Pick<Customer, 'displayName' | 'level' | 'industry' | 'remark'> = {
  displayName: '刘先生',
  level: 'A',
  industry: '制造业',
  remark: '合作5年以上，喜欢茶文化',
};

describe('blessingVariants', () => {
  it('returns two natural variants within 30-80 chars', () => {
    const variants = blessingVariants(base);
    expect(variants).toHaveLength(2);
    for (const text of variants) {
      expect(text.length).toBeGreaterThanOrEqual(30);
      expect(text.length).toBeLessThanOrEqual(80);
      expect(text).toContain('刘先生');
      expect(text).not.toContain('尊敬的');
      expect(text).not.toContain('在这个特殊日子');
      expect(text).not.toContain('衷心祝愿');
    }
  });

  it('handles C-level customers without remark', () => {
    const variants = blessingVariants({ displayName: '郑先生', level: 'C', industry: '其他', remark: '' });
    expect(variants[0].length).toBeGreaterThanOrEqual(30);
    expect(variants[0].length).toBeLessThanOrEqual(80);
  });
});
