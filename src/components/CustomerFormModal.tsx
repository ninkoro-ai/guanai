import { useEffect, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Pencil, Save, Trash2, UserPlus } from 'lucide-react';
import { GENDERS, INDUSTRIES, LEVELS, LEVEL_LABELS } from '../constants';
import { db, type Customer, type FamilyMember, type Level } from '../db';
import { deleteFamilyMember } from '../family';
import { birthdayInfo, birthProfile, parseFlexibleBirthday } from '../utils/date';
import { BirthTags } from './BirthTags';
import { FamilyMemberModal } from './FamilyMemberModal';
import { Modal } from './Modal';
import { useToast } from './Toast';

export function CustomerFormModal({ open, customer, onClose }: { open: boolean; customer: Customer | null; onClose: () => void }) {
  const [no, setNo] = useState('');
  const [name, setName] = useState('');
  const [birthday, setBirthday] = useState('');
  const [gender, setGender] = useState<Customer['gender']>('未知');
  const [industry, setIndustry] = useState<string>(INDUSTRIES[0]);
  const [level, setLevel] = useState<Level>('C');
  const [remark, setRemark] = useState('');
  const [company, setCompany] = useState('');
  const [position, setPosition] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [familyOpen, setFamilyOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<FamilyMember | null>(null);
  const toast = useToast();

  const isEdit = customer != null;
  const family = useLiveQuery(
    () => {
      if (customer?.id == null) return Promise.resolve([] as FamilyMember[]);
      return db.familyMembers.where('customerId').equals(customer.id).toArray();
    },
    [customer?.id],
  ) ?? [];
  const customers = useLiveQuery(() => db.customers.toArray(), []) ?? [];

  useEffect(() => {
    if (!open) return;
    if (customer) {
      setNo(customer.customerNo);
      setName(customer.displayName);
      setBirthday(customer.birthday);
      setGender(customer.gender);
      setIndustry(customer.industry);
      setLevel(customer.level);
      setRemark(customer.remark);
      setCompany(customer.company ?? '');
      setPosition(customer.position ?? '');
    } else {
      setNo('');
      setName('');
      setBirthday('');
      setGender('未知');
      setIndustry(INDUSTRIES[0]);
      setLevel('C');
      setRemark('');
      setCompany('');
      setPosition('');
    }
    setError('');
  }, [open, customer]);

  const submit = async () => {
    const b = parseFlexibleBirthday(birthday);
    const noTrim = no.trim();
    const nameTrim = name.trim();
    if (!noTrim || !nameTrim || !b) {
      setError('请填写客户编号、客户简称和生日（支持 1990-08-05、08-05、1990年8月5日 等格式）');
      return;
    }
    const dup = await db.customers.where('customerNo').equals(noTrim).first();
    if (dup && dup.id !== customer?.id) {
      setError(`客户编号已存在：${noTrim}`);
      return;
    }
    setSaving(true);
    try {
      const fields = {
        customerNo: noTrim,
        displayName: nameTrim,
        birthday: b,
        gender,
        industry,
        level,
        remark: remark.trim(),
        company: company.trim() || undefined,
        position: position.trim() || undefined,
      };
      if (customer?.id != null) {
        await db.customers.update(customer.id, fields);
        toast.show(`已更新客户：${nameTrim}`);
      } else {
        await db.customers.add({ ...fields, createdAt: Date.now() });
        toast.show(`已新增客户：${nameTrim}`);
      }
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const removeMember = async (m: FamilyMember) => {
    if (m.id == null) return;
    if (!window.confirm(`确认删除家属关系“${m.displayName}（${m.relationType}）”吗？`)) return;
    await deleteFamilyMember(m.id);
    toast.show('已删除家属关系');
  };

  return (
    <>
      <Modal
        open={open}
        title={isEdit ? `编辑客户 · ${customer?.displayName ?? ''}` : '新增客户'}
        onClose={onClose}
        footer={
          <>
            <button type="button" className="btn" onClick={onClose}>取消</button>
            <button type="button" className="btn btn-primary" onClick={() => void submit()} disabled={saving}>
              <Save size={14} /> {isEdit ? '保存修改' : '保存客户'}
            </button>
          </>
        }
      >
        <form className="form" onSubmit={(e) => { e.preventDefault(); void submit(); }}>
          <div className="form-grid">
            <div>
              <label htmlFor="add-no">客户编号 *</label>
              <input id="add-no" className="form-control" placeholder="C20260001" value={no} onChange={(e) => setNo(e.target.value)} />
            </div>
            <div>
              <label htmlFor="add-name">客户简称 *</label>
              <input id="add-name" className="form-control" placeholder="刘先生" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
          </div>
          <label htmlFor="add-birthday">生日 *</label>
          <input id="add-birthday" className="form-control" placeholder="1990-08-20 / 08-20 / 1990年8月20日" value={birthday} onChange={(e) => setBirthday(e.target.value)} />
          <p className="field-hint">支持 1990-08-05、08-05、1990年8月5日、8月5日 等格式，系统自动识别并统一保存；无出生年份仅填月日亦可</p>
          <div className="form-grid">
            <div>
              <label htmlFor="add-gender">性别</label>
              <select id="add-gender" className="form-control" value={gender} onChange={(e) => setGender(e.target.value as Customer['gender'])}>
                {GENDERS.map((g) => <option key={g}>{g}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="add-level">客户等级</label>
              <select id="add-level" className="form-control" value={level} onChange={(e) => setLevel(e.target.value as Level)}>
                {LEVELS.map((lv) => <option key={lv} value={lv}>{LEVEL_LABELS[lv]}</option>)}
              </select>
            </div>
          </div>
          <label htmlFor="add-industry">行业</label>
          <select id="add-industry" className="form-control" value={industry} onChange={(e) => setIndustry(e.target.value)}>
            {INDUSTRIES.map((ind) => <option key={ind}>{ind}</option>)}
          </select>
          <label htmlFor="add-remark">备注</label>
          <textarea id="add-remark" className="form-control" rows={2} placeholder="如：合作5年以上 / 喜欢茶文化" value={remark} onChange={(e) => setRemark(e.target.value)} />
          <div className="form-grid">
            <div>
              <label htmlFor="add-company">所属公司（选填）</label>
              <input id="add-company" className="form-control" placeholder="如：华兴制造集团" value={company} onChange={(e) => setCompany(e.target.value)} />
            </div>
            <div>
              <label htmlFor="add-position">职位（选填）</label>
              <input id="add-position" className="form-control" placeholder="如：总经理" value={position} onChange={(e) => setPosition(e.target.value)} />
            </div>
          </div>
          {isEdit && customer?.id != null ? (
            <div className="family-edit">
              <div className="family-edit-head">
                <span className="sub">家属关系（{family.length}）</span>
                <button type="button" className="btn btn-sm" onClick={() => { setEditingMember(null); setFamilyOpen(true); }}>
                  <UserPlus size={14} /> 新增家属
                </button>
              </div>
              {family.length === 0 && <div className="empty">暂未登记家属关系</div>}
              {family.map((m) => {
                const linked = m.linkedCustomerId != null ? customers.find((c) => c.id === m.linkedCustomerId) ?? null : null;
                return (
                  <div key={m.id} className="family-edit-row">
                    <div className="family-edit-info">
                      <div className="family-edit-top">
                        <span className="badge relation-badge">{m.relationType}</span>
                        <span className="name">{m.displayName}</span>
                      </div>
                      {linked ? (
                        <div className="sub">
                          <span>生日：{birthdayInfo(linked.birthday).label}</span>
                          <BirthTags profile={birthProfile(linked.birthday)} />
                          {linked.remark ? <span className="record-body">{linked.remark}</span> : null}
                        </div>
                      ) : (
                        <div className="sub">
                          {m.birthday ? <span>生日：{birthdayInfo(m.birthday).label}</span> : null}
                          {m.birthday ? <BirthTags profile={birthProfile(m.birthday)} /> : null}
                          {m.remark ? <span className="record-body">{m.remark}</span> : null}
                        </div>
                      )}
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
                );
              })}
            </div>
          ) : null}
          {error ? <p className="form-error">{error}</p> : null}
        </form>
      </Modal>
      {familyOpen && customer?.id != null ? (
        <FamilyMemberModal open customerId={customer.id} member={editingMember} onClose={() => setFamilyOpen(false)} />
      ) : null}
    </>
  );
}
