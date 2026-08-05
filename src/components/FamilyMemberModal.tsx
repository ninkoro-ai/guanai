import { useEffect, useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Save, Search, X } from 'lucide-react';
import { RELATION_TYPES } from '../constants';
import { db, type Customer, type FamilyMember, type RelationType } from '../db';
import { addFamilyMember, updateFamilyMember } from '../family';
import { birthdayInfo, parseFlexibleBirthday } from '../utils/date';
import { Modal } from './Modal';
import { useToast } from './Toast';

export function FamilyMemberModal({
  open,
  customerId,
  member,
  onClose,
}: {
  open: boolean;
  customerId: number;
  member: FamilyMember | null;
  onClose: () => void;
}) {
  const customers = useLiveQuery(() => db.customers.toArray(), []) ?? [];
  const [relationType, setRelationType] = useState<RelationType>('夫妻');
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<Customer | null>(null);
  const [interacted, setInteracted] = useState(false);
  const [name, setName] = useState('');
  const [birthday, setBirthday] = useState('');
  const [customerNo, setCustomerNo] = useState('');
  const [remark, setRemark] = useState('');
  const [remarkTouched, setRemarkTouched] = useState(false);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const toast = useToast();

  const isEdit = member != null;

  useEffect(() => {
    if (!open) return;
    setInteracted(false);
    if (member) {
      setRelationType(member.relationType);
      setName(member.displayName);
      setSelected(null);
    } else {
      setRelationType('夫妻');
      setName('');
      setSelected(null);
    }
    setRemark('');
    setRemarkTouched(false);
    setBirthday(member?.birthday ?? '');
    setCustomerNo(member?.customerNo ?? '');
  }, [open, member]);

  useEffect(() => {
    if (open) {
      setQuery('');
      setError('');
    }
  }, [open]);

  const results = useMemo(() => {
    const q = query.trim();
    if (!q) return [];
    return customers.filter(
      (c) => c.id !== customerId && (c.displayName.includes(q) || c.customerNo.includes(q)),
    );
  }, [customers, query, customerId]);

  const linkedCustomer = useMemo(
    () => (member?.linkedCustomerId != null ? customers.find((c) => c.id === member.linkedCustomerId) ?? null : null),
    [customers, member],
  );
  // 用户未主动操作时，惰性补上关联客户；用户操作后以用户选择为准
  const currentSelected = !interacted ? (selected ?? linkedCustomer) : selected;
  // 备注：关联客户时展示/编辑“关联人自己的备注”；用户手动修改后以输入为准
  const effectiveRemark = remarkTouched ? remark : (member == null ? '' : (currentSelected?.remark ?? member.remark ?? ''));

  const select = (c: Customer) => {
    setInteracted(true);
    setSelected(c);
    setName(c.displayName);
    setQuery('');
  };

  const clear = () => {
    setInteracted(true);
    setSelected(null);
    setName('');
  };

  const save = async () => {
    const nameTrim = name.trim();
    if (!currentSelected && !nameTrim) {
      setError('请填写家属姓名，或搜索并选择关联客户');
      return;
    }
    let birthdayValue: string | undefined;
    if (currentSelected == null && birthday.trim()) {
      birthdayValue = parseFlexibleBirthday(birthday) ?? undefined;
      if (!birthdayValue) {
        setError('生日格式无法识别，请填写例如：1990-08-05、08-05、1990年8月5日');
        return;
      }
    }
    if (saving) return;
    setSaving(true);
    try {
      const input = {
        customerId,
        displayName: currentSelected?.displayName ?? nameTrim,
        relationType,
        linkedCustomerId: currentSelected?.id,
        birthday: birthdayValue,
        customerNo: currentSelected == null ? (customerNo.trim() || undefined) : undefined,
        remark: effectiveRemark.trim(),
      };
      if (isEdit && member?.id != null) {
        await updateFamilyMember(member.id, input);
        toast.show('已更新家属关系');
      } else {
        await addFamilyMember(input);
        toast.show('已新增家属关系');
      }
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      title={isEdit ? '编辑家属关系' : '新增家属'}
      onClose={onClose}
      footer={
        <>
          <button type="button" className="btn" onClick={onClose}>取消</button>
          <button type="button" className="btn btn-primary" onClick={() => void save()} disabled={saving}>
            <Save size={14} /> {isEdit ? '保存修改' : '保存'}
          </button>
        </>
      }
    >
      <form className="form" onSubmit={(e) => { e.preventDefault(); void save(); }}>
        <label htmlFor="fm-relation">关系类型</label>
        <select id="fm-relation" className="form-control" value={relationType} onChange={(e) => setRelationType(e.target.value as RelationType)}>
          {RELATION_TYPES.map((t) => <option key={t}>{t}</option>)}
        </select>
        <label htmlFor="fm-search">关联已有客户（选填，支持编号 / 姓名搜索）</label>
        <div className="search">
          <Search size={15} />
          <input id="fm-search" type="search" placeholder="输入客户编号或简称搜索" value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
        {currentSelected ? (
          <div className="selected-customer">
            <span>
              {currentSelected.displayName}（{currentSelected.customerNo}）
              <span className="sub">生日：{birthdayInfo(currentSelected.birthday).label}</span>
            </span>
            <button type="button" className="btn btn-icon btn-ghost" aria-label="取消选择" onClick={clear}>
              <X size={14} />
            </button>
          </div>
        ) : null}
        {!currentSelected && query.trim() ? (
          <div className="search-results" role="listbox" aria-label="客户搜索结果">
            {results.length === 0 && <div className="empty">未找到匹配客户</div>}
            {results.slice(0, 8).map((c) => (
              <button key={c.id} type="button" role="option" aria-selected={false} className="search-result" onClick={() => select(c)}>
                <span className="name">{c.displayName}</span>
                <span className="sub">{c.customerNo} · {birthdayInfo(c.birthday).label} · {c.industry}</span>
              </button>
            ))}
          </div>
        ) : null}
        <label htmlFor="fm-name">家属姓名 *</label>
        <input id="fm-name" className="form-control" placeholder="如：王女士 / 小刘" value={name} onChange={(e) => { setInteracted(true); setName(e.target.value); }} disabled={currentSelected != null} />
        <p className="field-hint">选择关联客户后姓名自动取该客户简称；备注会同步到该关联人自己的信息中</p>
        {currentSelected ? (
          <p className="field-hint">生日：{birthdayInfo(currentSelected.birthday).md}（{birthdayInfo(currentSelected.birthday).label}，随关联客户资料）</p>
        ) : (
          <>
            <label htmlFor="fm-birthday">生日（选填，填写后加入生日提醒）</label>
            <input
              id="fm-birthday"
              className="form-control"
              placeholder="1990-08-05 / 08-05 / 1990年8月5日"
              value={birthday}
              onChange={(e) => setBirthday(e.target.value)}
            />
            <p className="field-hint">家属不一定是存量客户，无需客户编号；填写生日后自动进入与标准客户一致的提醒序列</p>
            <label htmlFor="fm-customerNo">家属客户编号（选填，便于独立检索）</label>
            <input
              id="fm-customerNo"
              className="form-control"
              placeholder="如：J20260001"
              value={customerNo}
              onChange={(e) => setCustomerNo(e.target.value)}
            />
            <p className="field-hint">为家属单独编号后，可在客户搜索中按编号或姓名检索到</p>
          </>
        )}
        <label htmlFor="fm-remark">备注（关联客户时同步到其本人信息）</label>
        <textarea id="fm-remark" className="form-control" rows={2} placeholder="如：喜欢雪茄 / 在私行有账户" value={effectiveRemark} onChange={(e) => { setRemark(e.target.value); setRemarkTouched(true); }} />
        {error ? <p className="form-error">{error}</p> : null}
      </form>
    </Modal>
  );
}
