import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Check, Sparkles } from 'lucide-react';
import { BlessingModal } from '../components/BlessingModal';
import { LevelBadge } from '../components/LevelBadge';
import { RecordFormModal } from '../components/RecordFormModal';
import { levelOrder } from '../constants';
import { db, hasContactToday, type Customer } from '../db';
import { birthdayInfo, todayKey } from '../utils/date';

export function HomePage({ onOpenDetail }: { onOpenDetail: (id: number) => void }) {
  const customers = useLiveQuery(() => db.customers.toArray(), []) ?? [];
  const records = useLiveQuery(() => db.records.toArray(), []) ?? [];
  const [blessFor, setBlessFor] = useState<Customer | null>(null);
  const [contactFor, setContactFor] = useState<Customer | null>(null);

  const dateKey = todayKey();
  const todayList = customers
    .filter((c) => birthdayInfo(c.birthday).isToday)
    .sort((a, b) => levelOrder(a.level) - levelOrder(b.level));
  const upcoming = customers
    .filter((c) => {
      const d = birthdayInfo(c.birthday).days;
      return d >= 1 && d <= 7;
    })
    .sort((a, b) => birthdayInfo(a.birthday).days - birthdayInfo(b.birthday).days);
  const aCount = customers.filter((c) => c.level === 'A').length;

  return (
    <div>
      <div className="stats">
        <div className="stat"><b>{todayList.length}</b><span>今日生日</span></div>
        <div className="stat"><b>{upcoming.length}</b><span>未来7天</span></div>
        <div className="stat"><b>{aCount}</b><span>A类客户</span></div>
      </div>

      <h2 className="section-title">🎂 今日生日</h2>
      {todayList.length === 0 && <div className="empty">今天没有生日客户</div>}
      {todayList.map((c) => {
        const done = hasContactToday(records, c.id, dateKey);
        return (
          <div key={c.id} className={`card${done ? ' card-done' : ''}`}>
            <div className="card-head">
              <span className="name">{c.displayName}</span>
              <LevelBadge level={c.level} />
            </div>
            <div className="sub">
              <span>客户编号：{c.customerNo}</span>
              <span>行业：{c.industry}</span>
            </div>
            {c.remark ? <div className="remark">{c.remark}</div> : null}
            <div className="actions">
              <button type="button" className="btn btn-sm" onClick={() => setBlessFor(c)}><Sparkles size={14} /> 生成祝福</button>
              {done
                ? <span className="done-tag"><Check size={14} /> 今日已维护</span>
                : <button type="button" className="btn btn-primary btn-sm" onClick={() => setContactFor(c)}><Check size={14} /> 完成维护</button>}
            </div>
          </div>
        );
      })}

      <h2 className="section-title">未来 7 天生日</h2>
      {upcoming.length === 0 && <div className="empty">未来 7 天没有生日客户</div>}
      {upcoming.map((c) => {
        const i = birthdayInfo(c.birthday);
        return (
          <button key={c.id} type="button" className="up-row" onClick={() => { if (c.id != null) onOpenDetail(c.id); }}>
            <span className="up-date">{i.md}</span>
            <span className="up-name">{c.displayName}</span>
            <span className="up-side">
              <LevelBadge level={c.level} />
              <span className="up-days">{i.label}</span>
            </span>
          </button>
        );
      })}

      <BlessingModal customer={blessFor} onClose={() => setBlessFor(null)} />
      {contactFor && <RecordFormModal customer={contactFor} record={null} onClose={() => setContactFor(null)} />}
    </div>
  );
}
