import { useState } from 'react';
import { Copy, RefreshCw } from 'lucide-react';
import type { Customer } from '../db';
import { blessingVariants } from '../utils/blessing';
import { Modal } from './Modal';
import { useToast } from './Toast';

export function BlessingModal({ customer, onClose }: { customer: Customer | null; onClose: () => void }) {
  const [idx, setIdx] = useState(0);
  const toast = useToast();
  if (!customer) return null;

  const variants = blessingVariants(customer);
  const text = variants[idx % variants.length];

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      toast.show('已复制祝福语');
    } catch {
      toast.show('复制失败，请长按选择文本复制');
    }
  };

  return (
    <Modal
      open
      title={`${customer.displayName} · 生日祝福参考`}
      onClose={onClose}
      footer={
        <>
          <button type="button" className="btn" onClick={() => setIdx((i) => i + 1)}><RefreshCw size={14} /> 换一换</button>
          <button type="button" className="btn btn-primary" onClick={() => void copy()}><Copy size={14} /> 复制</button>
        </>
      }
    >
      <div className="bubble">{text}</div>
    </Modal>
  );
}
