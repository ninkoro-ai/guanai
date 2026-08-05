import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Pencil, Star } from 'lucide-react';
import { BirthTags } from '../components/BirthTags';
import { LevelBadge } from '../components/LevelBadge';
import { RecordFormModal } from '../components/RecordFormModal';
import { db, type ContactRecord, type Customer } from '../db';
import { buildRemindables } from '../remindable';
import { birthdayInfo, birthProfile } from '../utils/date';

export function RemindersPage({ onOpenDetail }: { onOpenDetail: (id: number) => void }) {
  const customers = useLiveQuery(() => db.customers.toArray(), []) ?? [];
  const familyMembers = useLiveQuery(() => db.familyMembers.toArray(), []) ?? [];
  const records = useLiveQuery(() => db.records.toArray(), []) ?? [];
  const [editRecord, setEditRecord] = useState<ContactRecord | null>(null);

  const remindables = buildRemindables(customers, familyMembers);
  const advance = remindables
    .filter((c) => {
      const d = birthdayInfo(c.birthday).days;
      return d >= 1 && d <= 7;
    })
    .sort((a, b) => birthdayInfo(a.birthday).days - birthdayInfo(b.birthday).days);
  const todayFamily = remindables.filter((r) => r.kind === 'family' && birthdayInfo(r.birthday).isToday);

  const byId = new Map<number, Customer>();
  customers.forEach((c) => {
    if (c.id != null) byId.set(c.id, c);
  });
  const sortedRecords = [...records].sort((a, b) => b.contactDate.localeCompare(a.contactDate) || b.createdAt - a.createdAt);

  return (
    <div>
      <h2 className="section-title">提前 7 天提醒</h2>
      {advance.length === 0 && <div className="empty">未来 7 天没有待提醒的生日</div>}
      {advance.map((r) => {
        if (r.kind === 'family') {
          return (
            <button key={r.key} type="button" className="card card-link" onClick={() => { if (r.ownerId != null) onOpenDetail(r.ownerId); }}>
              <div className="card-head">
                <span className="name">{r.name}</span>
                <span className="badge relation-badge">{r.relationType} · 家属</span>
              </div>
              <div className="sub">{birthdayInfo(r.birthday).days} 天后生日 · {r.ownerName ?? '未知客户'}的家属 · 请提前安排关怀</div>
              <BirthTags profile={birthProfile(r.birthday)} />
            </button>
          );
        }
        const c = customers.find((x) => x.id != null && `c-${x.id}` === r.key);
        if (!c) return null;
        return (
          <button key={r.key} type="button" className="card card-link" onClick={() => { if (c.id != null) onOpenDetail(c.id); }}>
            <div className="card-head">
              <span className="name">
                {c.starred ? <Star size={14} className="star-mark" fill="currentColor" /> : null}
                {c.displayName}
              </span>
              <LevelBadge level={c.level} />
            </div>
            <div className="sub">{birthdayInfo(c.birthday).days} 天后生日 · 请提前安排客户关怀</div>
            <BirthTags profile={birthProfile(c.birthday)} />
          </button>
        );
      })}

      <h2 className="section-title">今天家属生日</h2>
      {todayFamily.length === 0 && <div className="empty">今天没有家属生日</div>}
      {todayFamily.map((r) => (
        <button key={r.key} type="button" className="up-row" onClick={() => { if (r.ownerId != null) onOpenDetail(r.ownerId); }}>
          <span className="up-date">今天</span>
          <span className="up-name">
            {r.name}
            <span className="badge relation-badge" style={{ marginLeft: 8 }}>{r.relationType}</span>
          </span>
          <span className="up-side">
            <span className="up-days">{r.ownerName ?? '未知客户'}的家属</span>
          </span>
        </button>
      ))}

      <h2 className="section-title">维护记录</h2>
      {sortedRecords.length === 0 && <div className="empty">暂无维护记录</div>}
      {sortedRecords.map((r) => {
        const c = r.customerId != null ? byId.get(r.customerId) : undefined;
        return (
          <div key={r.id} className="record">
            <div className="record-head">
              <div className="record-meta">
                <span className="name">{c?.displayName ?? '未知客户'}</span>
                <span className="sub">{r.contactDate} · {r.contactType}</span>
              </div>
              <button type="button" className="btn btn-icon btn-ghost" aria-label="编辑维护记录" onClick={() => setEditRecord(r)}>
                <Pencil size={14} />
              </button>
            </div>
            <div className="record-body">{r.remark}</div>
          </div>
        );
      })}

      {editRecord && (
        <RecordFormModal
          customer={editRecord.customerId != null ? byId.get(editRecord.customerId) ?? null : null}
          record={editRecord}
          onClose={() => setEditRecord(null)}
        />
      )}
    </div>
  );
}
