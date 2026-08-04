import { useState } from 'react';
import { Cake } from 'lucide-react';
import BottomNav from './components/BottomNav';
import { useToast } from './components/Toast';
import { CustomersPage } from './pages/CustomersPage';
import { CustomerDetailPage } from './pages/CustomerDetailPage';
import { HomePage } from './pages/HomePage';
import { RemindersPage } from './pages/RemindersPage';
import { SettingsPage } from './pages/SettingsPage';
import { readSettings, writeSettings, type AppSettings } from './settings';
import { formatTodayHeading } from './utils/date';

export type Tab = 'home' | 'customers' | 'reminders' | 'settings';

export default function App() {
  const [tab, setTab] = useState<Tab>('home');
  const [detailId, setDetailId] = useState<number | null>(null);
  const [settings, setSettings] = useState<AppSettings>(readSettings);
  const toast = useToast();

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
          <h1 className="app-title">客户生日关怀助手</h1>
          <p className="app-date">{formatTodayHeading()}</p>
        </div>
        <span className="logo"><Cake size={18} /></span>
      </header>
      <main className="app-main">
        {detailId != null ? (
          <CustomerDetailPage customerId={detailId} onBack={() => setDetailId(null)} />
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
    </div>
  );
}
