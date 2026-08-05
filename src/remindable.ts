import type { Customer, FamilyMember } from './db';

export interface Remindable {
  kind: 'customer' | 'family';
  key: string;
  name: string;
  birthday: string;
  /** family：所属客户 id（用于跳转查看） */
  ownerId?: number;
  ownerName?: string;
  relationType?: string;
}

/**
 * 生成“生日提醒序列”实体：标准客户 + 未关联存量客户的自由登记家属（已填生日）。
 * 已关联客户的家属生日由其对应客户本身承载，避免重复提醒。
 */
export function buildRemindables(customers: Customer[], familyMembers: FamilyMember[]): Remindable[] {
  const byId = new Map<number, Customer>();
  customers.forEach((c) => {
    if (c.id != null) byId.set(c.id, c);
  });
  const list: Remindable[] = customers
    .filter((c) => c.birthday)
    .map((c) => ({ kind: 'customer', key: `c-${c.id}`, name: c.displayName, birthday: c.birthday }));
  for (const m of familyMembers) {
    if (m.linkedCustomerId != null) continue;
    if (!m.birthday) continue;
    const owner = m.customerId != null ? byId.get(m.customerId) : undefined;
    list.push({
      kind: 'family',
      key: `f-${m.id}`,
      name: m.displayName,
      birthday: m.birthday,
      ownerId: m.customerId,
      ownerName: owner?.displayName,
      relationType: m.relationType,
    });
  }
  return list;
}
