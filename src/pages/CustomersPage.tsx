import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Pencil, Plus, Search, Trash2, Upload } from 'lucide-react';
import { CustomerFormModal } from '../components/CustomerFormModal';
import { ImportModal } from '../components/ImportModal';
import { LevelBadge } from '../components/LevelBadge';
import { StatusChip } from '../components/StatusChip';
import { useToast } from '../components/Toast';
import { INDUSTRIES, LEVELS, levelOrder } from '../constants';
import { db, hasContactToday, type Customer, type Level } from '../db';
import { birthdayInfo, currentMonth, todayKey } from '../utils/date';

type TimeFilter = 'all' | 'today' | 'week' | 'month';
type LevelFilter = 'all' | Level;

const TIME_FILTERS: Array<{ key: TimeFilter; label: string }> = [
  { key: 'all', label: '全部' },
  { key: 'today', label: '今日生日' },
  { key: 'week', label: '未来7天' },
  { key: 'month', label: '本月生日' },
];

export function CustomersPage() {
  const customers = useLiveQuery(() => db.customers.toArray(), []) ?? [];
  const records = useLiveQuery(() => db.records.toArray(), []) ?? [];
  const [q, setQ] = useState('');
  const [level, setLevel] = useState<LevelFilter>('all');
  const [time, setTime] = useState<TimeFilter>('all');
  const [industry, setIndustry] = useState<string>('all');
  const [formOpen, setFormOpen] = useState(false);
  const [formCustomer, setFormCustomer] = useState<Customer | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  const toast = useToast();

  const dateKey = todayKey();
  const month = currentMonth();

  const list = customers
    .filter((c) => {
      if (level !== 'all' && c.level !== level) return false;
      const info = birthdayInfo(c.birthday);
      if (time === 'today' && !info.isToday) return false;
      if (time === 'week' && !(info.days >= 1 && info.days <= 7)) return false;
      if (time === 'month' && c.birthday.slice(5, 7) !== month) return false;
      if (industry !== 'all' && c.industry !== industry) return false;
      const query = q.trim();
      if (query && !c.displayName.includes(query) && !c.customerNo.includes(query)) return false;
      return true;
    })
    .sort((a, b) => levelOrder(a.level) - levelOrder(b.level) || birthdayInfo(a.birthday).days - birthdayInfo(b.birthday).days);

  const remove = async (c: Customer) => {
    const id = c.id;
    if (id == null) return;
    if (!window.confirm(`确认删除客户 ${c.displayName}（${c.customerNo}）？其维护记录将一并删除。`)) return;
    await db.transaction('rw', db.customers, db.records, async () => {
      await db.customers.delete(id);
      await db.records.where('customerId').equals(id).delete();
    });
    toast.show('已删除客户');
  };

  return (
    <div>
      <div className="toolbar">
        <button type="button" className="btn btn-primary" onClick={() => { setFormCustomer(null); setFormOpen(true); }}><Plus size={14} /> 新增客户</button>
        <button type="button" className="btn" onClick={() => setImportOpen(true)}><Upload size={14} /> 批量导入</button>
      </div>

      <div className="search">
        <Search size={15} />
        <input type="search" placeholder="搜索客户编号 / 客户简称" value={q} onChange={(e) => setQ(e.target.value)} aria-label="搜索客户" />
      </div>

      <div className="chips" role="group" aria-label="按客户等级筛选">
        <button type="button" className={`chip${level === 'all' ? ' active' : ''}`} aria-pressed={level === 'all'} onClick={() => setLevel('all')}>全部</button>
        {LEVELS.map((lv) => (
          <button key={lv} type="button" className={`chip${level === lv ? ' active' : ''}`} aria-pressed={level === lv} onClick={() => setLevel(lv)}>
            {lv}类
          </button>
        ))}
      </div>

      <div className="chips" role="group" aria-label="按时间筛选">
        {TIME_FILTERS.map(({ key, label }) => (
          <button key={key} type="button" className={`chip${time === key ? ' active' : ''}`} aria-pressed={time === key} onClick={() => setTime(key)}>
            {label}
          </button>
        ))}
      </div>

      <div className="select-row">
        <label htmlFor="industry-filter">行业</label>
        <select id="industry-filter" className="form-control" value={industry} onChange={(e) => setIndustry(e.target.value)}>
          <option value="all">全部</option>
          {INDUSTRIES.map((ind) => <option key={ind} value={ind}>{ind}</option>)}
        </select>
      </div>

      <p className="count">{list.length ? `共 ${list.length} 位客户` : ''}</p>
      {list.length === 0 && <div className="empty">没有符合条件的客户</div>}

      {list.map((c) => {
        const info = birthdayInfo(c.birthday);
        return (
          <div key={c.id} className="row">
            <div className="row-main">
              <div className="row-top">
                <span className="name">{c.displayName}</span>
                <LevelBadge level={c.level} />
              </div>
              <div className="sub">{c.customerNo} · {c.gender} · {c.industry}</div>
            </div>
            <div className="row-side">
              <span className="date-text">{info.md}</span>
              <span className="days">{info.label}</span>
              <StatusChip done={hasContactToday(records, c.id, dateKey)} />
            </div>
            <div className="row-btns">
              <button type="button" className="btn btn-icon btn-ghost" aria-label={`编辑 ${c.displayName}`} onClick={() => { setFormCustomer(c); setFormOpen(true); }}>
                <Pencil size={15} />
              </button>
              <button type="button" className="btn btn-icon btn-ghost delete-btn" aria-label={`删除 ${c.displayName}`} onClick={() => void remove(c)}>
                <Trash2 size={15} />
              </button>
            </div>
          </div>
        );
      })}

      <CustomerFormModal open={formOpen} customer={formCustomer} onClose={() => setFormOpen(false)} />
      <ImportModal open={importOpen} onClose={() => setImportOpen(false)} />
    </div>
  );
}
