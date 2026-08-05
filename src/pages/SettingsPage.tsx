import { useEffect, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Download, FileDown, RotateCcw, Trash2, Upload } from 'lucide-react';
import { ClearDataModal } from '../components/ClearDataModal';
import { ImportModal } from '../components/ImportModal';
import { useToast } from '../components/Toast';
import { db } from '../db';
import { getLastImport, subscribeImportSession, undoLastImport } from '../importSession';
import type { AppSettings } from '../settings';
import { downloadImportTemplate, exportData } from '../utils/excel';

export function SettingsPage({ settings, onChange }: { settings: AppSettings; onChange: (patch: Partial<AppSettings>) => void }) {
  const [importOpen, setImportOpen] = useState(false);
  const [clearOpen, setClearOpen] = useState(false);
  const [, setSessionTick] = useState(0);
  const toast = useToast();
  const customers = useLiveQuery(() => db.customers.toArray(), []) ?? [];
  const records = useLiveQuery(() => db.records.toArray(), []) ?? [];
  const familyMembers = useLiveQuery(() => db.familyMembers.toArray(), []) ?? [];

  useEffect(() => subscribeImportSession(() => setSessionTick((t) => t + 1)), []);
  const lastImport = getLastImport();

  const undoLast = async () => {
    if (!window.confirm('确认撤销上次导入？将删除本次新增的客户及其维护记录，并还原被覆盖的客户数据。')) return;
    const ok = await undoLastImport();
    if (ok) toast.show('已撤销上次导入');
  };

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
            exportData(customers, records, familyMembers);
            toast.show('已导出客户、维护记录与家属关系');
          }}
        >
          <FileDown size={14} /> 导出
        </button>
      </div>
      {lastImport && (
        <div className="setting">
          <div>
            <div className="setting-label">撤销上次导入</div>
            <div className="setting-desc">{new Date(lastImport.at).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false })} 的批量导入，可回退误导入的数据</div>
          </div>
          <button type="button" className="btn btn-sm" onClick={() => void undoLast()}><RotateCcw size={14} /> 撤销</button>
        </div>
      )}
      <div className="setting setting-danger">
        <div>
          <div className="setting-label">清空所有数据</div>
          <div className="setting-desc">删除全部客户、维护记录与家属关系，需三次确认</div>
        </div>
        <button type="button" className="btn btn-sm btn-danger-soft" onClick={() => setClearOpen(true)}><Trash2 size={14} /> 清空数据</button>
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

      <h2 className="section-title">关于心桥</h2>
      <div className="note">
        心桥 · 客户关怀系统 —— 您与客户之间心的桥梁。<br />
        面向银行客户经理，提供生日提醒、祝福辅助、维护记录与家属关系管理，让客户关怀简单、及时、有温度。
      </div>

      <p className="creator-mark">Powered by Ninkoro.com</p>

      <ImportModal open={importOpen} onClose={() => setImportOpen(false)} />
      {clearOpen && <ClearDataModal open onClose={() => setClearOpen(false)} />}
    </div>
  );
}
