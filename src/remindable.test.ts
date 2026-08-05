import { describe, expect, it } from 'vitest';
import type { Customer, FamilyMember } from './db';
import { buildRemindables } from './remindable';

const c1: Customer = { id: 1, customerNo: 'C1', displayName: '刘先生', birthday: '08-05', gender: '男', industry: '制造业', level: 'A', remark: '', createdAt: 0 };
const c2: Customer = { id: 2, customerNo: 'C2', displayName: '周女士', birthday: '1990-08-05', gender: '女', industry: '服务业', level: 'B', remark: '', createdAt: 0 };

const linked: FamilyMember = { id: 10, customerId: 1, displayName: '周女士', relationType: '夫妻', linkedCustomerId: 2, remark: '', createdAt: 0 };
const freeWithBd: FamilyMember = { id: 11, customerId: 1, displayName: '小刘', relationType: '子女', birthday: '2003-06-12', remark: '在海外读书', createdAt: 0 };
const freeNoBd: FamilyMember = { id: 12, customerId: 1, displayName: '孙母', relationType: '父母', remark: '', createdAt: 0 };

describe('buildRemindables', () => {
  it('includes customers and free-form family with birthdays; skips linked and birthday-less', () => {
    const list = buildRemindables([c1, c2], [linked, freeWithBd, freeNoBd]);
    expect(list.map((r) => r.key)).toEqual(['c-1', 'c-2', 'f-11']);
    expect(list[2]).toMatchObject({
      kind: 'family',
      name: '小刘',
      birthday: '2003-06-12',
      ownerId: 1,
      ownerName: '刘先生',
      relationType: '子女',
    });
  });

  it('omits owner name when owner customer is missing', () => {
    const list = buildRemindables([], [freeWithBd]);
    expect(list).toHaveLength(1);
    expect(list[0].ownerName).toBeUndefined();
  });
});
