import { describe, expect, it } from 'vitest';
import type { Customer } from '../db';
import { generateBlessing, intentLines } from './blessing';

const samples: Array<Pick<Customer, 'displayName' | 'level' | 'industry' | 'remark'>> = [
  { displayName: '刘先生', level: 'A', industry: '制造业', remark: '合作5年以上，喜欢茶文化' },
  { displayName: '陈先生', level: 'A', industry: '房地产', remark: '授信续期洽谈中' },
  { displayName: '周女士', level: 'B', industry: '服务业', remark: '对公加私行客户' },
  { displayName: '郑先生', level: 'C', industry: '其他', remark: '' },
  { displayName: '姚女士', level: 'A', industry: '批发零售', remark: '电商代运营' },
];

describe('generateBlessing', () => {
  it('always returns 30-80 chars with the customer name and no forbidden phrases', () => {
    for (const c of samples) {
      for (let i = 0; i < 30; i += 1) {
        const text = generateBlessing(c);
        expect(text.length, JSON.stringify({ c, text })).toBeGreaterThanOrEqual(30);
        expect(text.length, JSON.stringify({ c, text })).toBeLessThanOrEqual(80);
        expect(text).toContain(c.displayName);
        expect(text).not.toContain('尊敬的');
        expect(text).not.toContain('在这个特殊日子');
        expect(text).not.toContain('衷心祝愿');
      }
    }
  });

  it('produces variety across generations', () => {
    const c = samples[0];
    const unique = new Set(Array.from({ length: 40 }, () => generateBlessing(c)));
    expect(unique.size).toBeGreaterThan(5);
  });

  it('extracts personalized topics from remarks', () => {
    const tea = intentLines('合作5年以上，喜欢茶文化');
    expect(tea.some((t) => t.includes('茶'))).toBe(true);
    expect(tea.some((t) => t.includes('5年'))).toBe(true);
    const credit = intentLines('授信续期洽谈中');
    expect(credit.some((t) => t.includes('授信'))).toBe(true);
    const fallback = intentLines('关注理财');
    expect(fallback.some((t) => t.includes('理财'))).toBe(true);
  });
});
