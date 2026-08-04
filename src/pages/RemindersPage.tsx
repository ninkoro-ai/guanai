import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { ContactModal } from '../components/ContactModal';
import { LevelBadge } from '../components/LevelBadge';
import { levelOrder } from '../constants';
import { db, hasContactToday, type Customer } from '../db';
import type { AppSettings } from '../settings';
import { birthdayInfo, todayKey } from '../utils/date';

const TIMES = ['09:00', '10:00', '14:00'];
const KINDS = ['第一次提醒', '第二次提醒', '第三次提醒'];

export function RemindersPage({ settings }: { settings: AppSettings }) {
  const customers = useLiveQuery(() => db.customers.toArray(), []) ?? [];
  const records = useLiveQuery(() => db.records.toArray(), []) ?? [];
  const [contactFor, setContactFor] = useState<Customer | null>(null);

  const dateKey = todayKey();
  const advance = customers
    .filter((c) => {
      const d = birthdayInfo(c.birthday).days;
      return d >= 1 && d <= 7;
    })
    .sort((a, b) => birthdayInfo(a.birthday).days - birthdayInfo(b.birthday).days);
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
      {settings.advance7 && advance.map((c) => (
        <div key={c.id} className="card">
          <div className="card-head">
            <span className="name">{c.displayName}</span>
            <LevelBadge level={c.level} />
          </div>
          <div className="sub">{birthdayInfo(c.birthday).days} 天后生日 · 请提前安排客户关怀</div>
        </div>
      ))}

      <h2 className="section-title">当天提醒（A类客户）</h2>
      {!settings.todayA && <div className="empty">已关闭当天提醒，可在设置中开启</div>}
      {settings.todayA && todayA.length === 0 && <div className="empty">今天没有 A 类客户生日</div>}
      {settings.todayA && todayA.length > 0 && (
        <div className="timeline">
          {todayA.flatMap((c) => {
            const done = hasContactToday(records, c.id, dateKey);
            return TIMES.map((t, idx) => (
              <div key={`${c.id}-${t}`} className="timeline-item">
                <div className="tl-head">
                  <span className="tl-time">{t}</span>
                  <span className="name">{c.displayName}</span>
                  <span className="tl-kind">{KINDS[idx]}</span>
                </div>
                <div className="tl-foot">
                  {done
                    ? <span className="status status-done">已联系</span>
                    : <button type="button" className="btn btn-sm" onClick={() => setContactFor(c)}>标记已联系</button>}
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
              <span className="name">{c?.displayName ?? '未知客户'}</span>
              <span className="sub">{r.contactDate} · {r.contactType}</span>
            </div>
            <div className="record-body">{r.remark}</div>
          </div>
        );
      })}

      <ContactModal customer={contactFor} onClose={() => setContactFor(null)} />
    </div>
  );
}
