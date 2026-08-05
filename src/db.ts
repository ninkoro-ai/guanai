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
  /** 星标客户：不受 ABC 等级限制的重点标记 */
  starred?: boolean;
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
  /** 生日（YYYY-MM-DD 或 MM-DD，可选）：未关联存量客户时填写，可加入与标准客户一致的生日提醒 */
  birthday?: string;
  remark: string;
  createdAt: number;
}

type BirthdayDb = Dexie & {
  customers: EntityTable<Customer, 'id'>;
  records: EntityTable<ContactRecord, 'id'>;
  familyMembers: EntityTable<FamilyMember, 'id'>;
};

const schema = {
  customers: '++id, customerNo, birthday, level, industry, starred',
  records: '++id, customerId, contactDate',
  familyMembers: '++id, customerId, linkedCustomerId',
};

/** 真实用户数据库（生产环境默认使用） */
const realDb = new Dexie('birthday-care-assistant') as BirthdayDb;
/** 演示数据数据库：与真实数据完全隔离 */
export const demoDb = new Dexie('birthday-care-demo') as BirthdayDb;

realDb.version(3).stores(schema);
demoDb.version(3).stores(schema);

/**
 * 当前生效的数据库（ESM 实时绑定）：
 * 演示模式开启时指向 demoDb，关闭时指向 realDb，切换不影响任何一方数据。
 */
export let db: BirthdayDb = realDb;

export function setActiveDemoMode(on: boolean): void {
  db = on ? demoDb : realDb;
}

/** 客户当天是否已完成维护（由维护记录派生，避免跨年状态过期） */
export function hasContactToday(records: ContactRecord[], customerId: number | undefined, dateKey: string): boolean {
  if (customerId == null) return false;
  return records.some((r) => r.customerId === customerId && r.contactDate === dateKey);
}
