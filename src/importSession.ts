import { db, type Customer } from './db';

export interface ImportUndoInfo {
  addedIds: number[];
  updated: Array<{ id: number; before: Customer }>;
  at: number;
}

type Listener = () => void;

let lastImport: ImportUndoInfo | null = null;
const listeners = new Set<Listener>();

function emit(): void {
  listeners.forEach((fn) => fn());
}

export function subscribeImportSession(fn: Listener): () => void {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

export function setLastImport(info: ImportUndoInfo | null): void {
  lastImport = info;
  emit();
}

export function getLastImport(): ImportUndoInfo | null {
  return lastImport;
}

export function clearLastImport(): void {
  lastImport = null;
  emit();
}

/** 撤销最近一次导入：删除新增客户及其维护记录，并还原被覆盖的客户数据 */
export async function undoLastImport(): Promise<boolean> {
  const info = lastImport;
  if (!info) return false;
  await db.transaction('rw', db.customers, db.records, async () => {
    if (info.addedIds.length > 0) {
      await db.records.where('customerId').anyOf(info.addedIds).delete();
      await db.customers.bulkDelete(info.addedIds);
    }
    for (const u of info.updated) {
      await db.customers.update(u.id, {
        displayName: u.before.displayName,
        birthday: u.before.birthday,
        gender: u.before.gender,
        industry: u.before.industry,
        level: u.before.level,
        remark: u.before.remark,
      });
    }
  });
  clearLastImport();
  return true;
}
