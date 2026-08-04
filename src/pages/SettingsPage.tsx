import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Download, FileDown, Upload } from 'lucide-react';
import { ImportModal } from '../components/ImportModal';
import { useToast } from '../components/Toast';
import { db } from '../db';
import type { AppSettings } from '../settings';
import { downloadImportTemplate, exportData } from '../utils/excel';

export function SettingsPage({ settings, onChange }: { settings: AppSettings; onChange: (patch: Partial<AppSettings>) => void }) {
  const [importOpen, setImportOpen] = useState(false);
  const toast = useToast();
  const customers = useLiveQuery(() => db.customers.toArray(), []) ?? [];
  const records = useLiveQuery(() => db.records.toArray(), []) ?? [];

  return (
    <div>
      <h2 className="section-title">数据</h2>
      <div className="setting">
        <div>
          <div className="setting-label">下载 Excel 模板</div>
          <div className="setting-desc">客户生日关怀助手_导入模板.xlsx</div>
        </div>
        <button
          type="button"
          className="btn btn-sm"
          onClick={() => {
            downloadImportTemplate();
            toast.show('模板已生成：客户生日关怀助手_导入模板.xlsx');
          }}
        >
          <Download size={14} /> 下载
        </button>
      </div>
      <div className="setting">
        <div>
          <div className="setting-label">批量导入</div>
          <div className="setting-desc">上传 Excel 批量新增客户</div>
        </div>
        <button type="button" className="btn btn-sm" onClick={() => setImportOpen(true)}><Upload size={14} /> 导入</button>
      </div>
      <div className="setting">
        <div>
          <div className="setting-label">数据导出</div>
          <div className="setting-desc">导出全部客户与维护记录</div>
        </div>
        <button
          type="button"
          className="btn btn-sm"
          onClick={() => {
            exportData(customers, records);
            toast.show('已导出全部客户与维护记录');
          }}
        >
          <FileDown size={14} /> 导出
        </button>
      </div>

      <h2 className="section-title">提醒设置</h2>
      <div className="setting">
        <div>
          <div className="setting-label">提前 7 天提醒</div>
          <div className="setting-desc">生日前 7 天在首页与提醒页显示</div>
        </div>
        <span className="switch">
          <input type="checkbox" checked={settings.advance7} onChange={(e) => onChange({ advance7: e.target.checked })} aria-label="提前7天提醒" />
        </span>
      </div>
      <div className="setting">
        <div>
          <div className="setting-label">当天提醒（A类客户）</div>
          <div className="setting-desc">09:00 / 10:00 / 14:00 三次提醒</div>
        </div>
        <span className="switch">
          <input type="checkbox" checked={settings.todayA} onChange={(e) => onChange({ todayA: e.target.checked })} aria-label="当天提醒" />
        </span>
      </div>

      <h2 className="section-title">隐私说明</h2>
      <div className="note">
        仅保存：行内客户编号、客户简称、生日、性别、行业、客户等级、备注。<br />
        不保存：身份证号码、银行账号、完整客户姓名、交易信息。<br />
        所有数据仅存储在本机浏览器中，不上传服务器。
      </div>

      <ImportModal open={importOpen} onClose={() => setImportOpen(false)} />
    </div>
  );
}
