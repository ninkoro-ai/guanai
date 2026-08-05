import { describe, expect, it } from 'vitest';
import * as XLSX from 'xlsx';
import { buildErrorReport, parseFlexibleBirthday, parseImportFile } from './excel';

function makeFile(rows: unknown[][]): File {
  const ws = XLSX.utils.aoa_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, '客户');
  const out = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
  return new File([out as BlobPart], 'import.xlsx', {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
}

describe('parseFlexibleBirthday', () => {
  it('normalizes supported formats to YYYY-MM-DD or MM-DD', () => {
    const cases: Array<[unknown, string]> = [
      ['1990-08-05', '1990-08-05'],
      ['08-05', '08-05'],
      ['1990/08/05', '1990-08-05'],
      ['1990.08.05', '1990-08-05'],
      ['1990年8月5日', '1990-08-05'],
      ['8月5日', '08-05'],
      ['8-5', '08-05'],
      ['8/5', '08-05'],
      ['8.5', '08-05'],
      ['1990-8-5', '1990-08-05'],
      ['19900805', '1990-08-05'],
    ];
    for (const [input, expected] of cases) {
      expect(parseFlexibleBirthday(input), String(input)).toBe(expected);
    }
  });

  it('accepts Date objects and Excel serial numbers', () => {
    expect(parseFlexibleBirthday(new Date(2026, 7, 5))).toBe('2026-08-05');
    const serial = 45874;
    const d = XLSX.SSF.parse_date_code(serial);
    const expected = `${d.y}-${String(d.m).padStart(2, '0')}-${String(d.d).padStart(2, '0')}`;
    expect(parseFlexibleBirthday(serial)).toBe(expected);
  });

  it('rejects empty, unrecognizable and impossible dates', () => {
    expect(parseFlexibleBirthday('')).toBeNull();
    expect(parseFlexibleBirthday(null)).toBeNull();
    expect(parseFlexibleBirthday(undefined)).toBeNull();
    expect(parseFlexibleBirthday('无法识别')).toBeNull();
    expect(parseFlexibleBirthday('2026-02-30')).toBeNull();
    expect(parseFlexibleBirthday('1990-13-05')).toBeNull();
    expect(parseFlexibleBirthday('13-5')).toBeNull();
  });
});

describe('parseImportFile', () => {
  it('imports all supported birthday formats with normalization', async () => {
    const formats = ['1990-08-05', '08-05', '1990/08/05', '1990.08.05', '1990年8月5日', '8月5日', '8-5'];
    const file = makeFile([
      ['客户编号', '客户简称', '生日', '性别', '行业', '客户等级', '备注'],
      ...formats.map((b, i) => [`C${String(i + 1).padStart(3, '0')}`, `客户${i + 1}`, b, '男', '其他', 'C类', '']),
    ]);
    const r = await parseImportFile(file, new Set());
    expect(r.errors).toHaveLength(0);
    expect(r.rows.map((x) => x.birthday)).toEqual([
      '1990-08-05',
      '08-05',
      '1990-08-05',
      '1990-08-05',
      '1990-08-05',
      '08-05',
      '08-05',
    ]);
  });

  it('reports clear errors for empty, impossible and unrecognizable birthdays', async () => {
    const file = makeFile([
      ['客户编号', '客户简称', '生日', '性别', '行业', '客户等级', '备注'],
      ['C001', '刘先生', '', '男', '其他', 'C类', ''],
      ['C002', '陈先生', '2026-02-30', '男', '其他', 'C类', ''],
      ['C003', '赵女士', '不知啥', '女', '其他', 'C类', ''],
    ]);
    const r = await parseImportFile(file, new Set());
    expect(r.rows).toHaveLength(0);
    expect(r.errors.some((e) => e.message.includes('生日不能为空'))).toBe(true);
    expect(r.errors.some((e) => e.message.includes('生日日期不存在'))).toBe(true);
    expect(r.errors.some((e) => e.message.includes('生日格式无法识别'))).toBe(true);
  });

  it('imports valid rows and reports missing fields with line numbers', async () => {
    const file = makeFile([
      ['客户编号', '客户简称', '生日', '性别', '行业', '客户等级', '备注'],
      ['C001', '刘先生', '1988-08-20', '男', '制造业', 'A类', '合作多年'],
      ['', '王女士', '08-15', '女', '服务业', 'B类', ''],
      ['C003', '陈先生', '坏日期', '男', '建筑业', 'C', ''],
      ['C004', '赵女士', '1990/5/6', '女', '房地产', 'A', ''],
    ]);
    const r = await parseImportFile(file, new Set());
    expect(r.rows.map((x) => x.customerNo)).toEqual(['C001', 'C004']);
    expect(r.rows[0].birthday).toBe('1988-08-20');
    expect(r.rows[1].birthday).toBe('1990-05-06');
    expect(r.errors.map((e) => e.line)).toEqual(expect.arrayContaining([3, 4]));
    expect(r.errors.some((e) => e.message.includes('客户编号不能为空'))).toBe(true);
    expect(r.errors.some((e) => e.message.includes('生日格式无法识别'))).toBe(true);
  });

  it('detects duplicates against existing customers and within the file', async () => {
    const file = makeFile([
      ['客户编号', '客户简称', '生日', '性别', '行业', '客户等级', '备注'],
      ['C001', '刘先生', '1988-08-20', '男', '制造业', 'A类', ''],
      ['C001', '刘新名', '1988-08-20', '男', '制造业', 'B类', ''],
      ['C002', '王女士', '08-15', '女', '服务业', 'B类', ''],
      ['C002', '王女士2', '08-16', '女', '服务业', 'C类', ''],
    ]);
    const r = await parseImportFile(file, new Set(['C001']));
    expect(r.duplicates.map((d) => d.customerNo)).toEqual(['C001']);
    expect(r.rows.map((x) => x.customerNo)).toEqual(['C002']);
    expect(r.errors.some((e) => e.message.includes('重复'))).toBe(true);
  });

  it('normalizes level, gender and industry', async () => {
    const file = makeFile([
      ['客户编号', '客户简称', '生日', '性别', '行业', '客户等级', '备注'],
      ['C001', '刘先生', '08-20', 'male', '能源', 'A类重点客户', ''],
    ]);
    const r = await parseImportFile(file, new Set());
    expect(r.rows[0]).toMatchObject({ level: 'A', gender: '男', industry: '其他', birthday: '08-20' });
  });

  it('parses optional company and position columns', async () => {
    const file = makeFile([
      ['客户编号', '客户简称', '生日', '性别', '行业', '客户等级', '备注', '所属公司', '职位'],
      ['C001', '刘先生', '1988-08-20', '男', '制造业', 'A类', '合作多年', '华兴制造集团', '总经理'],
      ['C002', '王女士', '08-15', '女', '服务业', 'B类', '', '', ''],
    ]);
    const r = await parseImportFile(file, new Set());
    expect(r.rows[0].company).toBe('华兴制造集团');
    expect(r.rows[0].position).toBe('总经理');
    expect(r.rows[1].company).toBeUndefined();
    expect(r.rows[1].position).toBeUndefined();
  });

  it('parses optional starred column', async () => {
    const file = makeFile([
      ['客户编号', '客户简称', '生日', '性别', '行业', '客户等级', '备注', '所属公司', '职位', '星标'],
      ['C001', '刘先生', '1988-08-20', '男', '制造业', 'A类', '', '', '', '是'],
      ['C002', '王女士', '08-15', '女', '服务业', 'B类', '', '', '', '否'],
      ['C003', '陈先生', '08-16', '男', '其他', 'C类', '', '', '', ''],
    ]);
    const r = await parseImportFile(file, new Set());
    expect(r.rows[0].starred).toBe(true);
    expect(r.rows[1].starred).toBe(false);
    expect(r.rows[2].starred).toBe(false);
  });
});

describe('buildErrorReport', () => {
  it('includes line numbers', () => {
    const report = buildErrorReport([{ line: 3, message: '生日日期不存在，请检查年月日是否正确' }]);
    expect(report).toContain('第3行：生日日期不存在');
  });
});
