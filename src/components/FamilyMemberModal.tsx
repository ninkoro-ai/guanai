import { useEffect, useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Save } from 'lucide-react';
import { RELATION_TYPES } from '../constants';
import { db, type FamilyMember, type RelationType } from '../db';
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
  const [linkedId, setLinkedId] = useState<number | ''>('');
  const [name, setName] = useState('');
  const [remark, setRemark] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const toast = useToast();

  const isEdit = member != null;
  const options = useMemo(() => customers.filter((c) => c.id !== customerId), [customers, customerId]);

  useEffect(() => {
    if (!open) return;
    if (member) {
      setRelationType(member.relationType);
      setLinkedId(member.linkedCustomerId ?? '');
      setName(member.displayName);
      setRemark(member.remark);
    } else {
      setRelationType('夫妻');
      setLinkedId('');
      setName('');
      setRemark('');
    }
    setError('');
  }, [open, member]);

  const pickCustomer = (id: number | '') => {
    setLinkedId(id);
    if (id !== '') {
      const c = customers.find((x) => x.id === id);
      if (c) setName(c.displayName);
    }
  };

  const save = async () => {
    const nameTrim = name.trim();
    if (!nameTrim) {
      setError('请填写家属姓名，或选择关联客户');
      return;
    }
    if (saving) return;
    setSaving(true);
    try {
      const fields = {
        customerId,
        displayName: nameTrim,
        relationType,
        linkedCustomerId: linkedId === '' ? undefined : linkedId,
        remark: remark.trim(),
      };
      if (isEdit && member?.id != null) {
        await db.familyMembers.update(member.id, fields);
        toast.show('已更新家属关系');
      } else {
        await db.familyMembers.add({ ...fields, createdAt: Date.now() });
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
        <label htmlFor="fm-linked">关联已有客户（选填）</label>
        <select id="fm-linked" className="form-control" value={linkedId} onChange={(e) => pickCustomer(e.target.value === '' ? '' : Number(e.target.value))}>
          <option value="">不关联，仅登记姓名</option>
          {options.map((c) => <option key={c.id} value={c.id}>{c.displayName}（{c.customerNo}）</option>)}
        </select>
        <label htmlFor="fm-name">家属姓名 *</label>
        <input id="fm-name" className="form-control" placeholder="如：王女士 / 小刘" value={name} onChange={(e) => setName(e.target.value)} disabled={linkedId !== ''} />
        <p className="field-hint">关联已有客户后，姓名自动取该客户简称</p>
        <label htmlFor="fm-remark">备注</label>
        <textarea id="fm-remark" className="form-control" rows={2} placeholder="如：共同经营 / 在私行有账户" value={remark} onChange={(e) => setRemark(e.target.value)} />
        {error ? <p className="form-error">{error}</p> : null}
      </form>
    </Modal>
  );
}
