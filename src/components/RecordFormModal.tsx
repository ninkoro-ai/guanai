import { useEffect, useState } from 'react';
import { db, type ContactRecord, type ContactType, type Customer } from '../db';
import { todayKey } from '../utils/date';
import { Modal } from './Modal';
import { useToast } from './Toast';

export function RecordFormModal({
  customer,
  record,
  onClose,
}: {
  customer: Customer | null;
  record: ContactRecord | null;
  onClose: () => void;
}) {
  const [type, setType] = useState<ContactType>('电话');
  const [remark, setRemark] = useState('');
  const [saving, setSaving] = useState(false);
  const toast = useToast();
  const isEdit = record != null;

  useEffect(() => {
    if (record) {
      setType(record.contactType);
      setRemark(record.remark);
    } else {
      setType('电话');
      setRemark('');
    }
  }, [record]);

  if (!customer) return null;

  const save = async () => {
    if (saving || customer.id == null) return;
    setSaving(true);
    try {
      const fields = {
        contactType: type,
        remark: remark.trim() || '生日当天问候',
      };
      if (isEdit && record?.id != null) {
        await db.records.update(record.id, fields);
        toast.show('已更新维护记录');
      } else {
        await db.records.add({
          customerId: customer.id,
          contactDate: todayKey(),
          ...fields,
          createdAt: Date.now(),
        });
        toast.show('已保存维护记录');
        // 完成每日关怀后通知应用层：可弹出“及时导出数据”的友情提醒（每日一次）
        window.dispatchEvent(new CustomEvent('xinqiao:care-completed'));
      }
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open
      title={isEdit ? `编辑维护记录 · ${customer.displayName}` : `完成维护 · ${customer.displayName}`}
      onClose={onClose}
      footer={
        <>
          <button type="button" className="btn" onClick={onClose}>取消</button>
          <button type="button" className="btn btn-primary" onClick={() => void save()} disabled={saving}>
            {saving ? '保存中…' : isEdit ? '保存修改' : '保存记录'}
          </button>
        </>
      }
    >
      <form className="form" onSubmit={(e) => { e.preventDefault(); void save(); }}>
        {isEdit && record ? <p className="field-hint">维护日期：{record.contactDate}</p> : null}
        <label htmlFor="record-type">方式</label>
        <select id="record-type" className="form-control" value={type} onChange={(e) => setType(e.target.value as ContactType)}>
          <option>电话</option>
          <option>微信</option>
        </select>
        <label htmlFor="record-remark">内容</label>
        <textarea id="record-remark" className="form-control" rows={2} placeholder="如：客户表示感谢" value={remark} onChange={(e) => setRemark(e.target.value)} />
      </form>
    </Modal>
  );
}
