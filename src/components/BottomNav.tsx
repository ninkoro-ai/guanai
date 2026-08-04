import { Bell, House, Settings, Users, type LucideIcon } from 'lucide-react';
import type { Tab } from '../App';

interface NavItem {
  key: Tab;
  label: string;
  Icon: LucideIcon;
}

const ITEMS: NavItem[] = [
  { key: 'home', label: '首页', Icon: House },
  { key: 'customers', label: '客户', Icon: Users },
  { key: 'reminders', label: '提醒', Icon: Bell },
  { key: 'settings', label: '设置', Icon: Settings },
];

export function BottomNav({ tab, onChange }: { tab: Tab; onChange: (t: Tab) => void }) {
  return (
    <nav className="nav" aria-label="底部导航">
      {ITEMS.map(({ key, label, Icon }) => (
        <button
          key={key}
          type="button"
          className={`nav-item${tab === key ? ' active' : ''}`}
          aria-current={tab === key ? 'page' : undefined}
          onClick={() => onChange(key)}
        >
          <Icon size={18} />
          <span>{label}</span>
        </button>
      ))}
    </nav>
  );
}

export default BottomNav;
