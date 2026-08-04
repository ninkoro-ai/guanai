import { useState } from 'react';
import { db, type ContactType, type Customer } from '../db';
import { todayKey } from '../utils/date';
import { Modal } from './Modal';
import { useToast } from './Toast';

export function ContactModal({ customer, onClose }: { customer: Customer | null; onClose: () => void }) {
  const [type, setType] = useState<ContactType>('电话');
  const [remark, setRemark] = useState('');
  const [saving, setSaving] = useState(false);
  const toast = useToast();
  if (!customer) return null;

  const save = async () => {
    if (saving || customer.id == null) return;
    setSaving(true);
    try {
      await db.records.add({
        customerId: customer.id,
        contactDate: todayKey(),
        contactType: type,
        remark: remark.trim() || '生日当天问候',
        createdAt: Date.now(),
      });
      toast.show('已保存维护记录');
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open
      title={`完成维护 · ${customer.displayName}`}
      onClose={onClose}
      footer={
        <>
          <button type="button" className="btn" onClick={onClose}>取消</button>
          <button type="button" className="btn btn-primary" onClick={() => void save()} disabled={saving}>
            {saving ? '保存中…' : '保存记录'}
          </button>
        </>
      }
    >
      <form className="form" onSubmit={(e) => { e.preventDefault(); void save(); }}>
        <label htmlFor="contact-type">方式</label>
        <select id="contact-type" className="form-control" value={type} onChange={(e) => setType(e.target.value as ContactType)}>
          <option>电话</option>
          <option>微信</option>
        </select>
        <label htmlFor="contact-remark">备注</label>
        <textarea id="contact-remark" className="form-control" rows={2} placeholder="如：客户表示感谢" value={remark} onChange={(e) => setRemark(e.target.value)} />
      </form>
    </Modal>
  );
}
