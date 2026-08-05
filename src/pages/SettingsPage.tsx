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
  const [userName, setUserName] = useState(settings.userName);
  const [team, setTeam] = useState(settings.team);

  useEffect(() => {
    setUserName(settings.userName);
    setTeam(settings.team);
  }, [settings.userName, settings.team]);

  const undoLast = async () => {
    if (!window.confirm('确认撤销上次导入？将删除本次新增的客户及其维护记录，并还原被覆盖的客户数据。')) return;
    const ok = await undoLastImport();
    if (ok) toast.show('已撤销上次导入');
  };

  return (
    <div>
      <h2 className="section-title">账户与团队</h2>
      <div className="setting">
        <div className="setting-label">当前用户名</div>
        <input
          id="user-name"
          className="form-control"
          style={{ maxWidth: 160 }}
          placeholder="如：张经理"
          value={userName}
          onChange={(e) => setUserName(e.target.value)}
          onBlur={() => { if (userName.trim() !== settings.userName) onChange({ userName: userName.trim() }); }}
        />
      </div>
      <div className="setting">
        <div className="setting-label">所属团队</div>
        <input
          id="team-name"
          className="form-control"
          style={{ maxWidth: 160 }}
          placeholder="如：财富中心一部"
          value={team}
          onChange={(e) => setTeam(e.target.value)}
          onBlur={() => { if (team.trim() !== settings.team) onChange({ team: team.trim() }); }}
        />
      </div>

      <h2 className="section-title">数据管理</h2>
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

      <p className="creator-mark">Powered by Ninkoro.com</p>

      <ImportModal open={importOpen} onClose={() => setImportOpen(false)} />
      {clearOpen && <ClearDataModal open onClose={() => setClearOpen(false)} />}
    </div>
  );
}
