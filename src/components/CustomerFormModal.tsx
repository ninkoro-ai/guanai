import { useEffect, useState } from 'react';
import { Save } from 'lucide-react';
import { GENDERS, INDUSTRIES, LEVELS, LEVEL_LABELS } from '../constants';
import { db, type Customer, type Level } from '../db';
import { parseBirthday } from '../utils/date';
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
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const toast = useToast();

  const isEdit = customer != null;

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
    } else {
      setNo('');
      setName('');
      setBirthday('');
      setGender('未知');
      setIndustry(INDUSTRIES[0]);
      setLevel('C');
      setRemark('');
    }
    setError('');
  }, [open, customer]);

  const submit = async () => {
    const b = parseBirthday(birthday);
    const noTrim = no.trim();
    const nameTrim = name.trim();
    if (!noTrim || !nameTrim || !b) {
      setError('请填写客户编号、客户简称和生日（YYYY-MM-DD 或 MM-DD）');
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

  return (
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
        <input id="add-birthday" className="form-control" placeholder="1988-08-20 或 08-20" value={birthday} onChange={(e) => setBirthday(e.target.value)} />
        <p className="field-hint">无出生年份也可，仅填月日，如 08-20</p>
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
        {error ? <p className="form-error">{error}</p> : null}
      </form>
    </Modal>
  );
}
