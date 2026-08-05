import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Pencil, Star } from 'lucide-react';
import { BirthTags } from '../components/BirthTags';
import { LevelBadge } from '../components/LevelBadge';
import { RecordFormModal } from '../components/RecordFormModal';
import { levelOrder } from '../constants';
import { db, hasContactToday, type ContactRecord, type Customer } from '../db';
import { buildRemindables } from '../remindable';
import type { AppSettings } from '../settings';
import { birthdayInfo, birthProfile, todayKey } from '../utils/date';

const TIMES = ['09:00', '10:00', '14:00'];
const KINDS = ['第一次提醒', '第二次提醒', '第三次提醒'];

export function RemindersPage({ settings, onOpenDetail }: { settings: AppSettings; onOpenDetail: (id: number) => void }) {
  const customers = useLiveQuery(() => db.customers.toArray(), []) ?? [];
  const familyMembers = useLiveQuery(() => db.familyMembers.toArray(), []) ?? [];
  const records = useLiveQuery(() => db.records.toArray(), []) ?? [];
  const [contactFor, setContactFor] = useState<Customer | null>(null);
  const [editRecord, setEditRecord] = useState<ContactRecord | null>(null);

  const dateKey = todayKey();
  const remindables = buildRemindables(customers, familyMembers);
  const advance = remindables
    .filter((c) => {
      const d = birthdayInfo(c.birthday).days;
      return d >= 1 && d <= 7;
    })
    .sort((a, b) => birthdayInfo(a.birthday).days - birthdayInfo(b.birthday).days);
  const todayFamily = remindables.filter((r) => r.kind === 'family' && birthdayInfo(r.birthday).isToday);
  const todayA = customers
    .filter((c) => c.level === 'A' && birthdayInfo(c.birthday).isToday)
    .sort((a, b) => levelOrder(a.level) - levelOrder(b.level));

  const byId = new Map<number, Customer>();
  customers.forEach((c) => {
    if (c.id != null) byId.set(c.id, c);
  });
  const sortedRecords = [...records].sort((a, b) => b.contactDate.localeCompare(a.contactDate) || b.createdAt - a.createdAt);

  return (
    <div>
      <h2 className="section-title">提前 7 天提醒</h2>
      {!settings.advance7 && <div className="empty">已关闭提前 7 天提醒，可在设置中开启</div>}
      {settings.advance7 && advance.length === 0 && <div className="empty">暂无提前提醒</div>}
      {settings.advance7 && advance.map((r) => {
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

      <h2 className="section-title">当天提醒（A类客户）</h2>
      {!settings.todayA && <div className="empty">已关闭当天提醒，可在设置中开启</div>}
      {settings.todayA && todayA.length === 0 && <div className="empty">今天没有 A 类客户生日</div>}
      {settings.todayA && todayA.length > 0 && (
        <div className="timeline">
          {todayA.flatMap((c) => {
            const done = hasContactToday(records, c.id, dateKey);
            return TIMES.map((t, idx) => (
              <div key={`${c.id}-${t}`} className="timeline-item clickable" onClick={() => { if (c.id != null) onOpenDetail(c.id); }}>
                <div className="tl-head">
                  <span className="tl-time">{t}</span>
                  <span className="name">
                    {c.starred ? <Star size={13} className="star-mark" fill="currentColor" /> : null}
                    {c.displayName}
                  </span>
                  <span className="tl-kind">{KINDS[idx]}</span>
                </div>
                <div className="tl-foot">
                  {done
                    ? <span className="status status-done">已联系</span>
                    : <button type="button" className="btn btn-sm" onClick={(e) => { e.stopPropagation(); setContactFor(c); }}>标记已联系</button>}
                </div>
              </div>
            ));
          })}
        </div>
      )}

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

      {contactFor && <RecordFormModal customer={contactFor} record={null} onClose={() => setContactFor(null)} />}
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
