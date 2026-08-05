import { useEffect, useState } from 'react';
import { AlertTriangle, Trash2 } from 'lucide-react';
import { db } from '../db';
import { clearLastImport } from '../importSession';
import { Modal } from './Modal';
import { useToast } from './Toast';

const STEPS = [
  { title: '清空所有数据？', desc: '将删除全部客户与维护记录，此操作无法撤销。', label: '继续' },
  { title: '再次确认', desc: '所有客户档案与维护记录都会被永久删除。', label: '再次确认' },
  { title: '最后确认', desc: '即将清空全部数据，删除后不可恢复。', label: '确认清空' },
];

export function ClearDataModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const toast = useToast();

  useEffect(() => {
    if (open) {
      setStep(0);
      setBusy(false);
    }
  }, [open]);

  const confirm = async () => {
    if (step < 2) {
      setStep(step + 1);
      return;
    }
    if (busy) return;
    setBusy(true);
    try {
      await db.transaction('rw', db.customers, db.records, async () => {
        await db.customers.clear();
        await db.records.clear();
      });
      clearLastImport();
      toast.show('已清空所有数据');
      onClose();
    } finally {
      setBusy(false);
    }
  };

  const current = STEPS[step];

  return (
    <Modal
      open={open}
      title="清空所有数据"
      onClose={onClose}
      footer={
        <>
          <button type="button" className="btn" onClick={onClose}>取消</button>
          <button type="button" className="btn btn-danger" onClick={() => void confirm()} disabled={busy}>
            <Trash2 size={14} /> {busy ? '清空中…' : current.label}
          </button>
        </>
      }
    >
      <div className="confirm-dots" aria-label={`确认步骤 ${step + 1}/3`}>
        {[0, 1, 2].map((i) => (
          <span key={i} className={`confirm-dot${i <= step ? ' active' : ''}`} />
        ))}
      </div>
      <div className="confirm-body">
        <AlertTriangle size={22} />
        <div>
          <div className="confirm-title">{current.title}</div>
          <p className="confirm-desc">{current.desc}</p>
        </div>
      </div>
    </Modal>
  );
}
