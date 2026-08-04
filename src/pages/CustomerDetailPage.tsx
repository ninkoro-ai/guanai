import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Check, ChevronLeft, Pencil, Sparkles } from 'lucide-react';
import { BlessingModal } from '../components/BlessingModal';
import { CustomerFormModal } from '../components/CustomerFormModal';
import { LevelBadge } from '../components/LevelBadge';
import { RecordFormModal } from '../components/RecordFormModal';
import { db, hasContactToday, type ContactRecord } from '../db';
import { birthdayInfo, todayKey } from '../utils/date';

export function CustomerDetailPage({ customerId, onBack }: { customerId: number; onBack: () => void }) {
  const customer = useLiveQuery(() => db.customers.get(customerId), [customerId]);
  const records = useLiveQuery(() => db.records.where('customerId').equals(customerId).toArray(), [customerId]) ?? [];
  const [editCustomer, setEditCustomer] = useState(false);
  const [blessFor, setBlessFor] = useState(false);
  const [createRecord, setCreateRecord] = useState(false);
  const [editRecord, setEditRecord] = useState<ContactRecord | null>(null);

  if (!customer) {
    return (
      <div>
        <button type="button" className="btn btn-ghost back-btn" onClick={onBack}><ChevronLeft size={16} /> 返回</button>
        <div className="empty">客户不存在或已被删除</div>
      </div>
    );
  }

  const info = birthdayInfo(customer.birthday);
  const done = hasContactToday(records, customer.id, todayKey());
  const sorted = [...records].sort((a, b) => b.contactDate.localeCompare(a.contactDate) || b.createdAt - a.createdAt);

  return (
    <div className="detail-view">
      <button type="button" className="btn btn-ghost back-btn" onClick={onBack}><ChevronLeft size={16} /> 返回</button>

      <div className="card">
        <div className="card-head">
          <span className="name">{customer.displayName}</span>
          <LevelBadge level={customer.level} />
        </div>
        <div className="sub">
          <span>客户编号：{customer.customerNo}</span>
          <span>性别：{customer.gender}</span>
          <span>行业：{customer.industry}</span>
        </div>
        <div className="sub">
          <span>生日：{info.md}</span>
          <span>距离生日：{info.label}</span>
        </div>
        {customer.remark ? <div className="remark">{customer.remark}</div> : null}
        <div className="actions">
          <button type="button" className="btn btn-sm" onClick={() => setEditCustomer(true)}><Pencil size={14} /> 编辑客户</button>
          <button type="button" className="btn btn-sm" onClick={() => setBlessFor(true)}><Sparkles size={14} /> 生成祝福</button>
          {info.isToday && !done ? (
            <button type="button" className="btn btn-primary btn-sm" onClick={() => setCreateRecord(true)}><Check size={14} /> 完成维护</button>
          ) : null}
        </div>
      </div>

      <h2 className="section-title">历史维护记录</h2>
      {sorted.length === 0 && <div className="empty">暂无维护记录</div>}
      {sorted.map((r) => (
        <div key={r.id} className="record">
          <div className="record-head">
            <div className="record-meta">
              <span className="name">{r.contactDate}</span>
              <span className="sub">{r.contactType}</span>
            </div>
            <button type="button" className="btn btn-icon btn-ghost" aria-label="编辑维护记录" onClick={() => setEditRecord(r)}>
              <Pencil size={14} />
            </button>
          </div>
          <div className="record-body">{r.remark}</div>
        </div>
      ))}

      {editCustomer && <CustomerFormModal open customer={customer} onClose={() => setEditCustomer(false)} />}
      {blessFor && <BlessingModal customer={customer} onClose={() => setBlessFor(false)} />}
      {createRecord && <RecordFormModal customer={customer} record={null} onClose={() => setCreateRecord(false)} />}
      {editRecord && <RecordFormModal customer={customer} record={editRecord} onClose={() => setEditRecord(null)} />}
    </div>
  );
}
