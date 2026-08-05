import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Check, ChevronLeft, Pencil, Sparkles, Star, Trash2, UserPlus } from 'lucide-react';
import { BirthTags } from '../components/BirthTags';
import { BlessingModal } from '../components/BlessingModal';
import { CustomerFormModal } from '../components/CustomerFormModal';
import { FamilyMemberModal } from '../components/FamilyMemberModal';
import { LevelBadge } from '../components/LevelBadge';
import { RecordFormModal } from '../components/RecordFormModal';
import { useToast } from '../components/Toast';
import { db, hasContactToday, type ContactRecord, type Customer, type FamilyMember } from '../db';
import { deleteFamilyMember } from '../family';
import { birthdayInfo, birthProfile, todayKey } from '../utils/date';

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
  const allCustomers = useLiveQuery(() => db.customers.toArray(), []) ?? [];
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
  const profile = birthProfile(customer.birthday);
  const done = hasContactToday(records, customer.id, todayKey());
  const sorted = [...records].sort((a, b) => b.contactDate.localeCompare(a.contactDate) || b.createdAt - a.createdAt);
  const customerById = new Map<number, Customer>();
  allCustomers.forEach((c) => {
    if (c.id != null) customerById.set(c.id, c);
  });

  const removeMember = async (m: FamilyMember) => {
    if (m.id == null) return;
    if (!window.confirm(`确认删除家属关系“${m.displayName}（${m.relationType}）”吗？`)) return;
    await deleteFamilyMember(m.id);
    toast.show('已删除家属关系');
  };

  const toggleStar = async () => {
    if (customer?.id == null) return;
    await db.customers.update(customer.id, { starred: !customer.starred });
  };

  return (
    <div className="detail-view">
      <button type="button" className="btn btn-ghost back-btn" onClick={onBack}><ChevronLeft size={16} /> 返回</button>

      <div className="card">
        <div className="card-head">
          <span className="name">
            {customer.starred ? <Star size={14} className="star-mark" fill="currentColor" /> : null}
            {customer.displayName}
          </span>
          <span className="row-top-actions">
            <LevelBadge level={customer.level} />
            <button
              type="button"
              className={`btn btn-icon btn-ghost${customer.starred ? ' star-on' : ''}`}
              aria-label={customer.starred ? '取消星标' : '设为星标'}
              onClick={() => void toggleStar()}
            >
              <Star size={16} fill={customer.starred ? 'currentColor' : 'none'} />
            </button>
          </span>
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
        <BirthTags profile={profile} />
        {(customer.company || customer.position) ? (
          <div className="sub">
            {customer.company ? <span>公司：{customer.company}</span> : null}
            {customer.position ? <span>职位：{customer.position}</span> : null}
          </div>
        ) : null}
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
      {family.map((m) => {
        const linked = m.linkedCustomerId != null ? customerById.get(m.linkedCustomerId) ?? null : null;
        const memberBirthday = linked ? linked.birthday : m.birthday;
        const memberInfo = memberBirthday ? birthdayInfo(memberBirthday) : null;
        const memberProfile = memberBirthday ? birthProfile(memberBirthday) : null;
        return (
          <div key={m.id} className="record">
            <div className="record-head">
              <div className="record-meta">
                <span className="badge relation-badge">{m.relationType}</span>
                {linked
                  ? <button type="button" className="link-name" onClick={() => onOpenDetail(linked.id!)}>{m.displayName}</button>
                  : <span className="name">{m.displayName}</span>}
                {linked && <span className="sub">已关联客户</span>}
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
            {memberInfo ? (
              <div className="member-birth">
                <span className="sub">生日：{memberInfo.md} · {memberInfo.label}</span>
                {memberProfile ? <BirthTags profile={memberProfile} /> : null}
              </div>
            ) : null}
            <div className="record-body">{linked ? (linked.remark || '') : m.remark}</div>
          </div>
        );
      })}

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
