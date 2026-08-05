import Dexie, { type EntityTable } from 'dexie';

export type Level = 'A' | 'B' | 'C';
export type Gender = '男' | '女' | '未知';
export type ContactType = '电话' | '微信';
export type RelationType = '夫妻' | '子女' | '父母' | '其他';

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
  /** 所属公司（选填，用于公私联动与客户画像） */
  company?: string;
  /** 职位（选填，用于公私联动与客户画像） */
  position?: string;
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

export interface FamilyMember {
  id?: number;
  customerId: number;
  displayName: string;
  relationType: RelationType;
  /** 关联的系统内客户（可选）；为空表示仅登记姓名 */
  linkedCustomerId?: number;
  remark: string;
  createdAt: number;
}

export const db = new Dexie('birthday-care-assistant') as Dexie & {
  customers: EntityTable<Customer, 'id'>;
  records: EntityTable<ContactRecord, 'id'>;
  familyMembers: EntityTable<FamilyMember, 'id'>;
};

db.version(2).stores({
  customers: '++id, customerNo, birthday, level, industry',
  records: '++id, customerId, contactDate',
  familyMembers: '++id, customerId, linkedCustomerId',
});

/** 客户当天是否已完成维护（由维护记录派生，避免跨年状态过期） */
export function hasContactToday(records: ContactRecord[], customerId: number | undefined, dateKey: string): boolean {
  if (customerId == null) return false;
  return records.some((r) => r.customerId === customerId && r.contactDate === dateKey);
}
