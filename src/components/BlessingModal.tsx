import { useEffect, useState } from 'react';
import { Copy, RefreshCw } from 'lucide-react';
import type { Customer } from '../db';
import { generateBlessing } from '../utils/blessing';
import { Modal } from './Modal';
import { useToast } from './Toast';

export function BlessingModal({ customer, onClose }: { customer: Customer | null; onClose: () => void }) {
  const [text, setText] = useState('');
  const toast = useToast();

  useEffect(() => {
    if (customer) setText(generateBlessing(customer));
  }, [customer]);

  if (!customer) return null;

  const refresh = () => {
    let next = generateBlessing(customer);
    if (next === text) next = generateBlessing(customer);
    setText(next);
  };

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
          <button type="button" className="btn" onClick={refresh}><RefreshCw size={14} /> 换一换</button>
          <button type="button" className="btn btn-primary" onClick={() => void copy()}><Copy size={14} /> 复制</button>
        </>
      }
    >
      <div className="bubble">{text}</div>
    </Modal>
  );
}
