import * as XLSX from 'xlsx';
import { INDUSTRIES } from '../constants';
import type { ContactRecord, Customer, Gender, Level } from '../db';

export interface ImportError {
  line: number;
  message: string;
}

export interface ImportDuplicate {
  customerNo: string;
  row: Customer;
}

export interface ParsedImport {
  rows: Customer[];
  errors: ImportError[];
  duplicates: ImportDuplicate[];
}

const HEADERS = ['客户编号', '客户简称', '生日', '性别', '行业', '客户等级', '备注'];

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

export function downloadImportTemplate(): void {
  const ws = XLSX.utils.aoa_to_sheet([
    HEADERS,
    ['C001', '刘先生', '1988-08-20', '男', '制造业', 'A类', '合作多年'],
    ['C002', '王女士', '08-15', '女', '服务业', 'B类', ''],
    ['C003', '陈先生', '1990年8月5日', '男', '建筑业', 'C类', ''],
  ]);
  ws['!cols'] = [{ wch: 12 }, { wch: 12 }, { wch: 14 }, { wch: 8 }, { wch: 12 }, { wch: 10 }, { wch: 20 }];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, '客户');
  XLSX.writeFile(wb, '客户生日关怀助手_导入模板.xlsx');
}

function normalizeGender(v: unknown): Gender {
  const s = String(v ?? '').trim().toLowerCase();
  if (s === '男' || s === 'm' || s === 'male' || s === '1') return '男';
  if (s === '女' || s === 'f' || s === 'female' || s === '2') return '女';
  return '未知';
}

function normalizeLevel(v: unknown): Level | null {
  const s = String(v ?? '').trim().toUpperCase().replace(/类.*$/, '');
  if (s === 'A') return 'A';
  if (s === 'B') return 'B';
  if (s === 'C') return 'C';
  if (s === '') return 'C';
  return null;
}

function normalizeIndustry(v: unknown): string {
  const s = String(v ?? '').trim();
  return (INDUSTRIES as readonly string[]).includes(s) ? s : '其他';
}

function isValidYMD(y: number, m: number, d: number): boolean {
  if (!Number.isInteger(y) || !Number.isInteger(m) || !Number.isInteger(d)) return false;
  if (y < 1900 || y > 2100 || m < 1 || m > 12 || d < 1) return false;
  const maxDay = new Date(Date.UTC(y, m, 0)).getUTCDate();
  return d <= maxDay;
}

function isValidMD(m: number, d: number): boolean {
  if (!Number.isInteger(m) || !Number.isInteger(d)) return false;
  if (m < 1 || m > 12 || d < 1) return false;
  // 无年份时按闰年判断，允许 02-29
  const maxDay = new Date(Date.UTC(2000, m, 0)).getUTCDate();
  return d <= maxDay;
}

function formatYMD(y: number, m: number, d: number): string {
  return `${y}-${pad2(m)}-${pad2(d)}`;
}

function formatMD(m: number, d: number): string {
  return `${pad2(m)}-${pad2(d)}`;
}

/**
 * 智能解析生日：兼容常见用户输入格式，统一转换为 YYYY-MM-DD 或 MM-DD。
 * 支持：1990-08-05、08-05、1990/08/05、1990.08.05、1990年8月5日、8月5日、8-5 等；
 * 支持 Excel Date 对象、日期序列号（如 45874）以及无分隔符的 19900805 / 0805。
 * 无法解析或日期不存在时返回 null。
 */
export function parseFlexibleBirthday(v: unknown): string | null {
  if (v === null || v === undefined || v === '') return null;

  if (v instanceof Date && !Number.isNaN(v.getTime())) {
    return formatYMD(v.getFullYear(), v.getMonth() + 1, v.getDate());
  }

  if (typeof v === 'number') {
    if (Number.isInteger(v) && v >= 19000101 && v <= 21001231) {
      const y = Math.floor(v / 10000);
      const m = Math.floor(v / 100) % 100;
      const d = v % 100;
      if (isValidYMD(y, m, d)) return formatYMD(y, m, d);
    }
    const serial = XLSX.SSF.parse_date_code(v);
    if (serial && isValidYMD(serial.y, serial.m, serial.d)) return formatYMD(serial.y, serial.m, serial.d);
    return null;
  }

  if (typeof v !== 'string') return null;

  const s = String(v)
    .trim()
    .replace(/(上午|下午|时|点).*$/, '')
    .replace(/\s+\d{1,2}:\d{2}(:\d{2})?.*$/, '')
    .replace(/[．。]/g, '.')
    .replace(/[／]/g, '/')
    .replace(/[－–—]/g, '-')
    .replace(/年/g, '-')
    .replace(/月/g, '-')
    .replace(/日/g, '')
    .replace(/\s+/g, '')
    .trim();
  if (!s) return null;

  const parts = s.split(/[^0-9]+/).filter(Boolean).map(Number);
  if (parts.length === 3) {
    const [y, m, d] = parts;
    if (isValidYMD(y, m, d)) return formatYMD(y, m, d);
    return null;
  }
  if (parts.length === 2) {
    const [m, d] = parts;
    if (isValidMD(m, d)) return formatMD(m, d);
    return null;
  }
  if (parts.length === 1) {
    const n = parts[0];
    if (n >= 19000101 && n <= 21001231) {
      const y = Math.floor(n / 10000);
      const m = Math.floor(n / 100) % 100;
      const d = n % 100;
      if (isValidYMD(y, m, d)) return formatYMD(y, m, d);
    }
    if (n >= 101 && n <= 1231) {
      const m = Math.floor(n / 100);
      const d = n % 100;
      if (isValidMD(m, d)) return formatMD(m, d);
    }
  }
  return null;
}

function isDateLike(v: unknown): boolean {
  if (v === null || v === undefined || v === '') return false;
  if (typeof v === 'number' || v instanceof Date) return true;
  if (typeof v === 'string') {
    const s = v.trim();
    return /\d/.test(s) && /[-/.\年月日]/.test(s);
  }
  return false;
}

export async function parseImportFile(file: File, existingNos: Set<string>): Promise<ParsedImport> {
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { type: 'array' });
  const sheetName = wb.SheetNames[0];
  const ws = sheetName ? wb.Sheets[sheetName] : undefined;
  if (!ws) return { rows: [], errors: [{ line: 0, message: 'Excel 中没有可读取的工作表' }], duplicates: [] };
  const raw = XLSX.utils.sheet_to_json<unknown[]>(ws, { header: 1, raw: true, defval: '' });

  const rows: Customer[] = [];
  const errors: ImportError[] = [];
  const duplicates: ImportDuplicate[] = [];
  const seen = new Map<string, number>();

  raw.forEach((cells, idx) => {
    const line = idx + 1;
    if (idx === 0 && String(cells[0] ?? '').includes('客户编号')) return;
    if (!Array.isArray(cells) || cells.every((c) => c === '' || c === null || c === undefined)) return;

    const customerNo = String(cells[0] ?? '').trim();
    const displayName = String(cells[1] ?? '').trim();
    const birthdayCell = cells[2];
    const birthday = parseFlexibleBirthday(birthdayCell);
    const birthdayEmpty =
      birthdayCell === null ||
      birthdayCell === undefined ||
      (typeof birthdayCell === 'string' && birthdayCell.trim() === '');

    const rowErrors: string[] = [];
    if (!customerNo) rowErrors.push('客户编号不能为空');
    if (!displayName) rowErrors.push('客户简称不能为空');
    if (birthdayEmpty) {
      rowErrors.push('生日不能为空');
    } else if (!birthday) {
      rowErrors.push(
        isDateLike(birthdayCell)
          ? '生日日期不存在，请检查年月日是否正确'
          : '生日格式无法识别，请填写例如：1990-08-05、08-05、1990年8月5日',
      );
    }
    const level = normalizeLevel(cells[5]);
    if (level === null) rowErrors.push('客户等级格式错误，请填写 A/B/C');

    if (rowErrors.length > 0) {
      rowErrors.forEach((message) => errors.push({ line, message }));
      return;
    }

    if (seen.has(customerNo)) {
      errors.push({ line, message: `客户编号与第 ${seen.get(customerNo)} 行重复` });
      return;
    }
    seen.set(customerNo, line);

    const row: Customer = {
      customerNo,
      displayName,
      birthday: birthday as string,
      gender: normalizeGender(cells[3]),
      industry: normalizeIndustry(cells[4]),
      level: level as Level,
      remark: String(cells[6] ?? '').trim(),
      createdAt: 0,
    };
    if (existingNos.has(customerNo)) {
      duplicates.push({ customerNo, row });
    } else {
      rows.push(row);
    }
  });

  return { rows, errors, duplicates };
}

export function buildErrorReport(errors: ImportError[]): string {
  const head = '客户生日关怀助手 - 导入错误报告\n';
  if (errors.length === 0) return head + '未发现错误。';
  return head + errors.map((e) => `第${e.line}行：${e.message}`).join('\n');
}

export function downloadErrorReport(errors: ImportError[]): void {
  const blob = new Blob([buildErrorReport(errors)], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = '导入错误报告.txt';
  a.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function exportData(customers: Customer[], records: ContactRecord[]): void {
  const byId = new Map<number, Customer>();
  customers.forEach((c) => {
    if (c.id != null) byId.set(c.id, c);
  });
  const wb = XLSX.utils.book_new();

  const cws = XLSX.utils.aoa_to_sheet([
    HEADERS,
    ...customers.map((c) => [c.customerNo, c.displayName, c.birthday, c.gender, c.industry, `${c.level}类`, c.remark]),
  ]);
  XLSX.utils.book_append_sheet(wb, cws, '客户');

  const rws = XLSX.utils.aoa_to_sheet([
    ['客户编号', '客户简称', '日期', '方式', '备注'],
    ...records.map((r) => {
      const c = byId.get(r.customerId);
      return [c?.customerNo ?? '', c?.displayName ?? '', r.contactDate, r.contactType, r.remark];
    }),
  ]);
  XLSX.utils.book_append_sheet(wb, rws, '维护记录');
  XLSX.writeFile(wb, '客户生日关怀助手_导出.xlsx');
}
