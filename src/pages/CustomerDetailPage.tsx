import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Check, ChevronLeft, Pencil, Sparkles, Trash2, UserPlus } from 'lucide-react';
import { BlessingModal } from '../components/BlessingModal';
import { CustomerFormModal } from '../components/CustomerFormModal';
import { FamilyMemberModal } from '../components/FamilyMemberModal';
import { LevelBadge } from '../components/LevelBadge';
import { RecordFormModal } from '../components/RecordFormModal';
import { useToast } from '../components/Toast';
import { db, hasContactToday, type ContactRecord, type FamilyMember } from '../db';
import { birthdayInfo, todayKey } from '../utils/date';

export function CustomerDetailPage({
  customerId,
  onBack,
  onOpenDetail,
}: {
  customerId: number;
  onBack: () => void;
  onOpenDetail: (id: number) => void;
}) {
  const customer = useLiveQuery(() => db.customers.get(customerId), [customerId]);
  const records = useLiveQuery(() => db.records.where('customerId').equals(customerId).toArray(), [customerId]) ?? [];
  const family = useLiveQuery(() => db.familyMembers.where('customerId').equals(customerId).toArray(), [customerId]) ?? [];
  const [editCustomer, setEditCustomer] = useState(false);
  const [blessFor, setBlessFor] = useState(false);
  const [createRecord, setCreateRecord] = useState(false);
  const [editRecord, setEditRecord] = useState<ContactRecord | null>(null);
  const [familyOpen, setFamilyOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<FamilyMember | null>(null);
  const toast = useToast();

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

  const removeMember = async (m: FamilyMember) => {
    if (m.id == null) return;
    if (!window.confirm(`确认删除家属关系“${m.displayName}（${m.relationType}）”吗？`)) return;
    await db.familyMembers.delete(m.id);
    toast.show('已删除家属关系');
  };

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

      <div className="section-head">
        <h2 className="section-title">家属关系</h2>
        <button type="button" className="btn btn-sm" onClick={() => { setEditingMember(null); setFamilyOpen(true); }}>
          <UserPlus size={14} /> 新增家属
        </button>
      </div>
      {family.length === 0 && <div className="empty">暂未登记家属关系</div>}
      {family.map((m) => (
        <div key={m.id} className="record">
          <div className="record-head">
            <div className="record-meta">
              <span className="badge relation-badge">{m.relationType}</span>
              {m.linkedCustomerId != null
                ? <button type="button" className="link-name" onClick={() => onOpenDetail(m.linkedCustomerId!)}>{m.displayName}</button>
                : <span className="name">{m.displayName}</span>}
              {m.linkedCustomerId != null && <span className="sub">已关联客户</span>}
            </div>
            <div className="row-btns">
              <button type="button" className="btn btn-icon btn-ghost" aria-label="编辑家属关系" onClick={() => { setEditingMember(m); setFamilyOpen(true); }}>
                <Pencil size={14} />
              </button>
              <button type="button" className="btn btn-icon btn-ghost delete-btn" aria-label="删除家属关系" onClick={() => void removeMember(m)}>
                <Trash2 size={14} />
              </button>
            </div>
          </div>
          {m.remark ? <div className="record-body">{m.remark}</div> : null}
        </div>
      ))}

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
      {familyOpen && <FamilyMemberModal open customerId={customerId} member={editingMember} onClose={() => setFamilyOpen(false)} />}
    </div>
  );
}
