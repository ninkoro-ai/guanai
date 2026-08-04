import Dexie, { type EntityTable } from 'dexie';

export type Level = 'A' | 'B' | 'C';
export type Gender = '男' | '女' | '未知';
export type ContactType = '电话' | '微信';

export interface Customer {
  id?: number;
  customerNo: string;
  displayName: string;
  /** 生日：YYYY-MM-DD 或 MM-DD（无年份） */
  birthday: string;
  gender: Gender;
  industry: string;
  level: Level;
  remark: string;
  createdAt: number;
}

export interface ContactRecord {
  id?: number;
  customerId: number;
  /** 维护日期 YYYY-MM-DD */
  contactDate: string;
  contactType: ContactType;
  remark: string;
  createdAt: number;
}

export const db = new Dexie('birthday-care-assistant') as Dexie & {
  customers: EntityTable<Customer, 'id'>;
  records: EntityTable<ContactRecord, 'id'>;
};

db.version(1).stores({
  customers: '++id, customerNo, birthday, level, industry',
  records: '++id, customerId, contactDate',
});

/** 客户当天是否已完成维护（由维护记录派生，避免跨年状态过期） */
export function hasContactToday(records: ContactRecord[], customerId: number | undefined, dateKey: string): boolean {
  if (customerId == null) return false;
  return records.some((r) => r.customerId === customerId && r.contactDate === dateKey);
}
