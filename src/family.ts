import { db, type RelationType } from './db';

/** 关系类型 → 反向从属关系（用于双向自动同步） */
export const REVERSE_RELATION: Record<RelationType, RelationType> = {
  夫妻: '夫妻',
  子女: '父母',
  父母: '子女',
  其他: '其他',
};

export interface FamilyMemberInput {
  customerId: number;
  displayName: string;
  relationType: RelationType;
  linkedCustomerId?: number;
  /** 未关联存量客户时登记的生日（可选，加入生日提醒） */
  birthday?: string;
  remark: string;
}

/** 删除两个客户之间的所有家属关联行（任一方向） */
async function deletePairRows(idA: number, idB: number): Promise<void> {
  await db.familyMembers
    .where('customerId')
    .anyOf([idA, idB])
    .filter((m) => m.linkedCustomerId === idA || m.linkedCustomerId === idB)
    .delete();
}

/**
 * 写入一条家属关系；关联客户时自动写入对方的反向从属关系。
 * 备注规则：关联客户时，备注属于“关联人自己的信息”，写入该客户的备注字段，
 * 双方关系行本身不存备注，避免备注串到对方条目上。
 * remarkMode: 'append' 用于新增（不覆盖已有备注），'replace' 用于编辑（以表单内容为准）。
 */
async function insertMemberWithReverse(input: FamilyMemberInput, remarkMode: 'append' | 'replace'): Promise<void> {
  if (input.linkedCustomerId != null) {
    await deletePairRows(input.customerId, input.linkedCustomerId);
    const owner = await db.customers.get(input.customerId);
    const linked = await db.customers.get(input.linkedCustomerId);
    if (!owner || !linked || owner.id == null || linked.id == null) throw new Error('关联客户不存在');
    if (linked.id != null) {
      const existing = linked.remark?.trim() ?? '';
      const incoming = input.remark?.trim() ?? '';
      let next = incoming;
      if (remarkMode === 'append' && incoming && existing && !existing.includes(incoming)) {
        next = `${existing}；${incoming}`;
      }
      if (next !== existing) await db.customers.update(linked.id, { remark: next });
    }
    const now = Date.now();
    await db.familyMembers.add({
      customerId: owner.id,
      displayName: linked.displayName,
      relationType: input.relationType,
      linkedCustomerId: linked.id,
      birthday: '',
      remark: '',
      createdAt: now,
    });
    await db.familyMembers.add({
      customerId: linked.id,
      displayName: owner.displayName,
      relationType: REVERSE_RELATION[input.relationType] ?? '其他',
      linkedCustomerId: owner.id,
      birthday: '',
      remark: '',
      createdAt: now,
    });
  } else {
    await db.familyMembers.add({
      customerId: input.customerId,
      displayName: input.displayName,
      relationType: input.relationType,
      birthday: input.birthday?.trim() || undefined,
      remark: input.remark,
      createdAt: Date.now(),
    });
  }
}

export async function addFamilyMember(input: FamilyMemberInput): Promise<void> {
  await db.transaction('rw', db.familyMembers, db.customers, async () => {
    await insertMemberWithReverse(input, 'append');
  });
}

export async function updateFamilyMember(memberId: number, input: FamilyMemberInput): Promise<void> {
  const existing = await db.familyMembers.get(memberId);
  if (!existing) return;
  await db.transaction('rw', db.familyMembers, db.customers, async () => {
    if (existing.linkedCustomerId != null) {
      await deletePairRows(existing.customerId, existing.linkedCustomerId);
    } else {
      await db.familyMembers.delete(memberId);
    }
    await insertMemberWithReverse(input, 'replace');
  });
}

export async function deleteFamilyMember(memberId: number): Promise<void> {
  const m = await db.familyMembers.get(memberId);
  if (!m) return;
  await db.transaction('rw', db.familyMembers, async () => {
    if (m.linkedCustomerId != null) {
      await deletePairRows(m.customerId, m.linkedCustomerId);
    } else {
      await db.familyMembers.delete(memberId);
    }
  });
}

/** 为历史数据补齐反向从属关系（幂等，应用启动时调用一次） */
export async function ensureFamilySync(): Promise<void> {
  const rows = await db.familyMembers.toArray();
  const linked = rows.filter((r) => r.linkedCustomerId != null);
  if (linked.length === 0) return;
  await db.transaction('rw', db.familyMembers, db.customers, async () => {
    // 1) 历史数据迁移：旧版把备注同时写到双方关系行；迁移到“关联人自己的备注”，并清空关系行备注
    const processedRows = new Set<number>();
    for (const r of linked) {
      if (r.id == null || r.linkedCustomerId == null || processedRows.has(r.id)) continue;
      const pair = linked.find(
        (x) => x.id !== r.id && x.customerId === r.linkedCustomerId && x.linkedCustomerId === r.customerId,
      );
      processedRows.add(r.id);
      if (pair?.id != null) processedRows.add(pair.id);
      const legacyRemark = (r.remark ?? '').trim() || (pair?.remark ?? '').trim();
      if (legacyRemark) {
        const target = await db.customers.get(r.linkedCustomerId);
        if (target?.id != null) {
          const existing = target.remark?.trim() ?? '';
          if (!existing) {
            await db.customers.update(target.id, { remark: legacyRemark });
          } else if (!existing.includes(legacyRemark)) {
            await db.customers.update(target.id, { remark: `${existing}；${legacyRemark}` });
          }
        }
      }
      const ids = [r.id, pair?.id].filter((x): x is number => x != null);
      for (const id of ids) await db.familyMembers.update(id, { remark: '' });
    }
    // 2) 补齐缺失的反向从属关系
    for (const r of linked) {
      if (r.linkedCustomerId == null) continue;
      const hasReverse = rows.some(
        (x) => x.customerId === r.linkedCustomerId && x.linkedCustomerId === r.customerId,
      );
      if (hasReverse) continue;
      const owner = await db.customers.get(r.customerId);
      if (!owner || owner.id == null) continue;
      await db.familyMembers.add({
        customerId: r.linkedCustomerId,
        displayName: owner.displayName,
        relationType: REVERSE_RELATION[r.relationType] ?? '其他',
        linkedCustomerId: r.customerId,
        remark: r.remark,
        createdAt: r.createdAt,
      });
    }
  });
}
