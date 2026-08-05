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

/** 写入一条家属关系；关联客户时自动写入对方的反向从属关系 */
async function insertMemberWithReverse(input: FamilyMemberInput): Promise<void> {
  if (input.linkedCustomerId != null) {
    await deletePairRows(input.customerId, input.linkedCustomerId);
    const owner = await db.customers.get(input.customerId);
    const linked = await db.customers.get(input.linkedCustomerId);
    if (!owner || !linked || owner.id == null || linked.id == null) throw new Error('关联客户不存在');
    const now = Date.now();
    await db.familyMembers.add({
      customerId: owner.id,
      displayName: linked.displayName,
      relationType: input.relationType,
      linkedCustomerId: linked.id,
      remark: input.remark,
      createdAt: now,
    });
    await db.familyMembers.add({
      customerId: linked.id,
      displayName: owner.displayName,
      relationType: REVERSE_RELATION[input.relationType] ?? '其他',
      linkedCustomerId: owner.id,
      remark: input.remark,
      createdAt: now,
    });
  } else {
    await db.familyMembers.add({
      customerId: input.customerId,
      displayName: input.displayName,
      relationType: input.relationType,
      remark: input.remark,
      createdAt: Date.now(),
    });
  }
}

export async function addFamilyMember(input: FamilyMemberInput): Promise<void> {
  await db.transaction('rw', db.familyMembers, db.customers, async () => {
    await insertMemberWithReverse(input);
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
    await insertMemberWithReverse(input);
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
