import { describe, expect, it } from 'vitest';
import * as XLSX from 'xlsx';
import { buildErrorReport, parseImportFile } from './excel';

function makeFile(rows: unknown[][]): File {
  const ws = XLSX.utils.aoa_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, '客户');
  const out = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
  return new File([out as BlobPart], 'import.xlsx', {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
}

describe('parseImportFile', () => {
  it('imports valid rows and reports errors with line numbers', async () => {
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
    expect(r.errors.some((e) => e.message.includes('生日格式错误'))).toBe(true);
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
});

describe('buildErrorReport', () => {
  it('includes line numbers', () => {
    const report = buildErrorReport([{ line: 3, message: '客户编号不能为空' }]);
    expect(report).toContain('第3行：客户编号不能为空');
  });
});
