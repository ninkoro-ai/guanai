import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Check, Sparkles, Star } from 'lucide-react';
import { BirthTags } from '../components/BirthTags';
import { BlessingModal } from '../components/BlessingModal';
import { LevelBadge } from '../components/LevelBadge';
import { RecordFormModal } from '../components/RecordFormModal';
import { levelOrder } from '../constants';
import { db, hasContactToday, type Customer } from '../db';
import { buildRemindables, type Remindable } from '../remindable';
import { birthdayInfo, birthProfile, todayKey } from '../utils/date';

export function HomePage({ onOpenDetail }: { onOpenDetail: (id: number) => void }) {
  const customers = useLiveQuery(() => db.customers.toArray(), []) ?? [];
  const familyMembers = useLiveQuery(() => db.familyMembers.toArray(), []) ?? [];
  const records = useLiveQuery(() => db.records.toArray(), []) ?? [];
  const [blessFor, setBlessFor] = useState<Customer | null>(null);
  const [contactFor, setContactFor] = useState<Customer | null>(null);

  const dateKey = todayKey();
  const customerById = new Map<number, Customer>();
  customers.forEach((c) => {
    if (c.id != null) customerById.set(c.id, c);
  });
  const remindables = buildRemindables(customers, familyMembers);

  const todayList = remindables
    .filter((r) => birthdayInfo(r.birthday).isToday)
    .sort((a, b) => {
      if (a.kind !== b.kind) return a.kind === 'customer' ? -1 : 1;
      if (a.kind === 'customer') {
        const ca = customerById.get(Number(a.key.slice(2)));
        const cb = customerById.get(Number(b.key.slice(2)));
        return levelOrder(ca?.level ?? 'C') - levelOrder(cb?.level ?? 'C');
      }
      return a.name.localeCompare(b.name, 'zh-CN');
    });
  const upcoming = remindables
    .filter((r) => {
      const d = birthdayInfo(r.birthday).days;
      return d >= 1 && d <= 7;
    })
    .sort((a, b) => birthdayInfo(a.birthday).days - birthdayInfo(b.birthday).days || (a.kind === 'customer' ? -1 : 1));
  const aCount = customers.filter((c) => c.level === 'A').length;

  const renderTodayCard = (r: Remindable) => {
    if (r.kind === 'family') {
      return (
        <button
          key={r.key}
          type="button"
          className="card card-link"
          onClick={() => { if (r.ownerId != null) onOpenDetail(r.ownerId); }}
        >
          <div className="card-head">
            <span className="name">{r.name}</span>
            <span className="badge relation-badge">{r.relationType} · 家属</span>
          </div>
          <div className="sub">
            <span>家属：{r.ownerName ?? '未知客户'}</span>
            <span>生日：{birthdayInfo(r.birthday).label}</span>
          </div>
        </button>
      );
    }
    const c = customerById.get(Number(r.key.slice(2)));
    if (!c) return null;
    const done = hasContactToday(records, c.id, dateKey);
    return (
      <div key={r.key} className={`card clickable${done ? ' card-done' : ''}`} onClick={() => { if (c.id != null) onOpenDetail(c.id); }}>
        <div className="card-head">
          <span className="name">
            {c.starred ? <Star size={14} className="star-mark" fill="currentColor" /> : null}
            {c.displayName}
          </span>
          <LevelBadge level={c.level} />
        </div>
        <div className="sub">
          <span>客户编号：{c.customerNo}</span>
          <span>行业：{c.industry}</span>
        </div>
        <BirthTags profile={birthProfile(c.birthday)} />
        {c.remark ? <div className="remark">{c.remark}</div> : null}
        <div className="actions">
          <button type="button" className="btn btn-sm" onClick={(e) => { e.stopPropagation(); setBlessFor(c); }}><Sparkles size={14} /> 生成祝福</button>
          {done
            ? <span className="done-tag"><Check size={14} /> 今日已维护</span>
            : <button type="button" className="btn btn-primary btn-sm" onClick={(e) => { e.stopPropagation(); setContactFor(c); }}><Check size={14} /> 完成维护</button>}
        </div>
      </div>
    );
  };

  const renderUpcomingRow = (r: Remindable) => {
    const i = birthdayInfo(r.birthday);
    if (r.kind === 'family') {
      return (
        <button key={r.key} type="button" className="up-row" onClick={() => { if (r.ownerId != null) onOpenDetail(r.ownerId); }}>
          <span className="up-date">{i.md}</span>
          <span className="up-name">
            {r.name}
            <span className="badge relation-badge" style={{ marginLeft: 8 }}>{r.relationType}</span>
          </span>
          <span className="up-side">
            <span className="up-days">{i.label}</span>
          </span>
        </button>
      );
    }
    const c = customerById.get(Number(r.key.slice(2)));
    if (!c) return null;
    return (
      <button key={r.key} type="button" className="up-row" onClick={() => { if (c.id != null) onOpenDetail(c.id); }}>
        <span className="up-date">{i.md}</span>
        <span className="up-name">
          {c.starred ? <Star size={12} className="star-mark" fill="currentColor" /> : null}
          {c.displayName}
        </span>
        <span className="up-side">
          <LevelBadge level={c.level} />
          <span className="up-days">{i.label}</span>
        </span>
      </button>
    );
  };

  return (
    <div>
      <div className="stats">
        <div className="stat"><b>{todayList.length}</b><span>今日生日</span></div>
        <div className="stat"><b>{upcoming.length}</b><span>未来7天</span></div>
        <div className="stat"><b>{aCount}</b><span>A类客户</span></div>
      </div>

      <h2 className="section-title">🎂 今日生日</h2>
      {todayList.length === 0 && <div className="empty">今天没有生日客户</div>}
      {todayList.map(renderTodayCard)}

      <h2 className="section-title">未来 7 天生日</h2>
      {upcoming.length === 0 && <div className="empty">未来 7 天没有生日客户</div>}
      {upcoming.map(renderUpcomingRow)}

      <BlessingModal customer={blessFor} onClose={() => setBlessFor(null)} />
      {contactFor && <RecordFormModal customer={contactFor} record={null} onClose={() => setContactFor(null)} />}
    </div>
  );
}
