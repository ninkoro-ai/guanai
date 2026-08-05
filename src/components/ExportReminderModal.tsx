import { DownloadCloud } from 'lucide-react';
import { Modal } from './Modal';

export function ExportReminderModal({
  open,
  onClose,
  onExport,
}: {
  open: boolean;
  onClose: () => void;
  onExport: () => void;
}) {
  return (
    <Modal
      open={open}
      title="数据备份提醒"
      onClose={onClose}
      footer={
        <>
          <button type="button" className="btn" onClick={onClose}>稍后再说</button>
          <button type="button" className="btn btn-primary" onClick={onExport}>
            <DownloadCloud size={14} /> 去导出
          </button>
        </>
      }
    >
      <p className="muted-p" style={{ marginTop: 0 }}>今天辛苦了，记得给数据上个"保险"。</p>
      <div className="note">
        心桥的数据保存在本机浏览器中，手机清理内存、清除浏览器历史记录或卸载应用，都可能导致数据丢失。<br />
        建议每天完成关怀后，及时到「设置 → 数据导出」备份一次，导出文件建议另行保存。
      </div>
    </Modal>
  );
}
