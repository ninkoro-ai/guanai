import { useState } from 'react';
import { useEffect } from 'react';
import { Cake } from 'lucide-react';
import BottomNav from './components/BottomNav';
import { ExportReminderModal } from './components/ExportReminderModal';
import { useToast } from './components/Toast';
import { CustomersPage } from './pages/CustomersPage';
import { CustomerDetailPage } from './pages/CustomerDetailPage';
import { HomePage } from './pages/HomePage';
import { RemindersPage } from './pages/RemindersPage';
import { SettingsPage } from './pages/SettingsPage';
import { readSettings, writeSettings, type AppSettings } from './settings';
import { formatTodayHeading } from './utils/date';
import { ensureFamilySync } from './family';
import { markExportReminderShown, shouldShowExportReminder } from './exportReminder';

export type Tab = 'home' | 'customers' | 'reminders' | 'settings';

export default function App() {
  const [tab, setTab] = useState<Tab>('home');
  const [detailId, setDetailId] = useState<number | null>(null);
  const [settings, setSettings] = useState<AppSettings>(readSettings);
  const [reminderOpen, setReminderOpen] = useState(false);
  const toast = useToast();

  useEffect(() => {
    void ensureFamilySync();
  }, []);

  // 完成每日关怀任务后，弹出“及时导出数据”的友情提醒（每日最多一次）
  useEffect(() => {
    const onCareCompleted = () => {
      if (!shouldShowExportReminder()) return;
      markExportReminderShown();
      setReminderOpen(true);
    };
    window.addEventListener('xinqiao:care-completed', onCareCompleted);
    return () => window.removeEventListener('xinqiao:care-completed', onCareCompleted);
  }, []);

  const updateSettings = (patch: Partial<AppSettings>) => {
    const next = { ...settings, ...patch };
    setSettings(next);
    writeSettings(next);
    toast.show('提醒设置已保存');
  };

  const openDetail = (id: number) => setDetailId(id);
  const switchTab = (next: Tab) => {
    setTab(next);
    setDetailId(null);
  };

  return (
    <div className="app">
      <header className="app-header">
        <div>
          <h1 className="app-title">心桥</h1>
          <p className="app-date">{formatTodayHeading()}</p>
        </div>
        <span className="logo"><Cake size={18} /></span>
      </header>
      <main className="app-main">
        {detailId != null ? (
          <CustomerDetailPage customerId={detailId} onBack={() => setDetailId(null)} onOpenDetail={openDetail} />
        ) : (
          <>
            {tab === 'home' && <HomePage onOpenDetail={openDetail} />}
            {tab === 'customers' && <CustomersPage onOpenDetail={openDetail} />}
            {tab === 'reminders' && <RemindersPage settings={settings} onOpenDetail={openDetail} />}
            {tab === 'settings' && <SettingsPage settings={settings} onChange={updateSettings} />}
          </>
        )}
      </main>
      <BottomNav tab={tab} onChange={switchTab} />
      <ExportReminderModal
        open={reminderOpen}
        onClose={() => setReminderOpen(false)}
        onExport={() => {
          setReminderOpen(false);
          switchTab('settings');
        }}
      />
    </div>
  );
}
