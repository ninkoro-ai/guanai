import { useEffect, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Eye, Pencil, Plus, Search, Star, Trash2, Upload } from 'lucide-react';
import { BirthTags } from '../components/BirthTags';
import { CustomerFormModal } from '../components/CustomerFormModal';
import { GenderBadge } from '../components/GenderBadge';
import { ImportModal } from '../components/ImportModal';
import { LevelBadge } from '../components/LevelBadge';
import { StatusChip } from '../components/StatusChip';
import { useToast } from '../components/Toast';
import { INDUSTRIES, LEVELS } from '../constants';
import { db, hasContactToday, type Customer, type Level } from '../db';
import { SIGNS, ZODIACS, birthdayInfo, birthdayMonth, birthdaySign, birthdayZodiac, birthProfile, currentMonth, todayKey } from '../utils/date';

type TimeFilter = 'all' | 'today' | 'week' | 'month';
type LevelFilter = 'all' | Level;

const TIME_FILTERS: Array<{ key: TimeFilter; label: string }> = [
  { key: 'all', label: '全部' },
  { key: 'today', label: '今日生日' },
  { key: 'week', label: '未来7天' },
  { key: 'month', label: '本月生日' },
];

const MONTHS = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0'));
const PAGE_SIZE = 20;

export function CustomersPage({ onOpenDetail }: { onOpenDetail: (id: number) => void }) {
  const customers = useLiveQuery(() => db.customers.toArray(), []) ?? [];
  const familyMembers = useLiveQuery(() => db.familyMembers.toArray(), []) ?? [];
  const records = useLiveQuery(() => db.records.toArray(), []) ?? [];
  const [q, setQ] = useState('');
  const [level, setLevel] = useState<LevelFilter>('all');
  const [time, setTime] = useState<TimeFilter>('all');
  const [industry, setIndustry] = useState<string>('all');
  const [starOnly, setStarOnly] = useState(false);
  const [month, setMonth] = useState<string>('all');
  const [sign, setSign] = useState<string>('all');
  const [zodiac, setZodiac] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [formOpen, setFormOpen] = useState(false);
  const [formCustomer, setFormCustomer] = useState<Customer | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  const toast = useToast();

  const dateKey = todayKey();
  const monthNow = currentMonth();

  // 筛选条件变化时回到第一页
  useEffect(() => {
    setPage(1);
  }, [q, level, time, industry, starOnly, month, sign, zodiac]);

  const list = customers
    .filter((c) => {
      if (level !== 'all' && c.level !== level) return false;
      const info = birthdayInfo(c.birthday);
      if (time === 'today' && !info.isToday) return false;
      if (time === 'week' && !(info.days >= 1 && info.days <= 7)) return false;
      if (time === 'month' && birthdayMonth(c.birthday) !== monthNow) return false;
      if (industry !== 'all' && c.industry !== industry) return false;
      if (starOnly && !c.starred) return false;
      if (month !== 'all' && birthdayMonth(c.birthday) !== month) return false;
      if (sign !== 'all' && birthdaySign(c.birthday) !== sign) return false;
      if (zodiac !== 'all' && birthdayZodiac(c.birthday) !== zodiac) return false;
      const query = q.trim();
      if (query && !c.displayName.includes(query) && !c.customerNo.includes(query)) return false;
      return true;
    })
    // 默认按“距离生日倒计时”正序排列（最近过生日的排最前）
    .sort((a, b) => birthdayInfo(a.birthday).days - birthdayInfo(b.birthday).days);

  const total = list.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageRows = list.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const queryTrim = q.trim();
  const customerById = new Map<number, Customer>();
  customers.forEach((c) => {
    if (c.id != null) customerById.set(c.id, c);
  });
  // 家属检索：自由登记家属（含客户编号）可像标准客户一样按编号/姓名查询
  const familyHits = queryTrim
    ? familyMembers.filter(
        (m) =>
          m.linkedCustomerId == null
          && (m.customerNo?.includes(queryTrim) || m.displayName.includes(queryTrim)),
      )
    : [];

  const remove = async (c: Customer) => {
    const id = c.id;
    if (id == null) return;
    if (!window.confirm(`确认删除客户 ${c.displayName}（${c.customerNo}）？其维护记录将一并删除。`)) return;
    await db.transaction('rw', db.customers, db.records, db.familyMembers, async () => {
      await db.customers.delete(id);
      await db.records.where('customerId').equals(id).delete();
      await db.familyMembers.where('customerId').equals(id).delete();
      await db.familyMembers.where('linkedCustomerId').equals(id).delete();
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

      <div className="chips" role="group" aria-label="按时间筛选">
        {TIME_FILTERS.map(({ key, label }) => (
          <button key={key} type="button" className={`chip${time === key ? ' active' : ''}`} aria-pressed={time === key} onClick={() => setTime(key)}>
            {label}
          </button>
        ))}
      </div>

      <div className="filter-grid" aria-label="客户筛选条件">
        <div>
          <label htmlFor="filter-level">客户等级</label>
          <select id="filter-level" className="form-control" value={level} onChange={(e) => setLevel(e.target.value as LevelFilter)}>
            <option value="all">全部等级</option>
            {LEVELS.map((lv) => <option key={lv} value={lv}>{lv}类</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="filter-industry">行业</label>
          <select id="filter-industry" className="form-control" value={industry} onChange={(e) => setIndustry(e.target.value)}>
            <option value="all">全部行业</option>
            {INDUSTRIES.map((ind) => <option key={ind} value={ind}>{ind}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="filter-star">星标</label>
          <select id="filter-star" className="form-control" value={starOnly ? 'starred' : 'all'} onChange={(e) => setStarOnly(e.target.value === 'starred')}>
            <option value="all">全部客户</option>
            <option value="starred">星标客户</option>
          </select>
        </div>
        <div>
          <label htmlFor="filter-month">生日月份</label>
          <select id="filter-month" className="form-control" value={month} onChange={(e) => setMonth(e.target.value)}>
            <option value="all">全部月份</option>
            {MONTHS.map((m) => <option key={m} value={m}>{Number(m)}月</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="filter-sign">星座</label>
          <select id="filter-sign" className="form-control" value={sign} onChange={(e) => setSign(e.target.value)}>
            <option value="all">全部星座</option>
            {SIGNS.map((s) => <option key={s} value={s}>{s}座</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="filter-zodiac">属相</label>
          <select id="filter-zodiac" className="form-control" value={zodiac} onChange={(e) => setZodiac(e.target.value)}>
            <option value="all">全部属相</option>
            {ZODIACS.map((z) => <option key={z} value={z}>属{z}</option>)}
          </select>
        </div>
      </div>

      {total === 0 && familyHits.length === 0 && <div className="empty">没有符合条件的客户</div>}

      {familyHits.length > 0 ? (
        <>
          <p className="count">家属搜索结果 · 共 {familyHits.length} 位</p>
          {familyHits.map((m) => {
            const owner = m.customerId != null ? customerById.get(m.customerId) : undefined;
            return (
              <button
                key={m.id}
                type="button"
                className="row clickable"
                onClick={() => { if (m.customerId != null) onOpenDetail(m.customerId); }}
              >
                <div className="row-main">
                  <div className="row-top">
                    <span className="name">{m.displayName}</span>
                    <span className="badge relation-badge">{m.relationType} · 家属</span>
                  </div>
                  <div className="sub">
                    {m.customerNo ? `${m.customerNo} · ` : ''}所属客户：{owner?.displayName ?? '未知'}
                    {m.birthday ? ` · 生日：${birthdayInfo(m.birthday).label}` : ''}
                  </div>
                </div>
                <div className="row-side"><span className="days">查看</span></div>
              </button>
            );
          })}
        </>
      ) : null}

      {pageRows.map((c) => {
        const info = birthdayInfo(c.birthday);
        return (
          <div key={c.id} className="row clickable" onClick={() => { if (c.id != null) onOpenDetail(c.id); }}>
            <div className="row-main">
              <div className="row-top">
                <span className="name">
                  {c.starred ? <Star size={13} className="star-mark" fill="currentColor" /> : null}
                  {c.displayName}
                </span>
                <GenderBadge gender={c.gender} />
                <LevelBadge level={c.level} />
              </div>
              <div className="sub">{c.customerNo} · {c.industry}</div>
              <BirthTags profile={birthProfile(c.birthday)} />
            </div>
            <div className="row-side">
              <span className="date-text">{info.md}</span>
              <span className="days">{info.label}</span>
              <StatusChip done={hasContactToday(records, c.id, dateKey)} />
            </div>
            <div className="row-btns">
              <button
                type="button"
                className={`btn btn-icon btn-ghost${c.starred ? ' star-on' : ''}`}
                aria-label={c.starred ? `取消星标 ${c.displayName}` : `设为星标 ${c.displayName}`}
                onClick={(e) => { e.stopPropagation(); if (c.id != null) void db.customers.update(c.id, { starred: !c.starred }); }}
              >
                <Star size={15} fill={c.starred ? 'currentColor' : 'none'} />
              </button>
              <button type="button" className="btn btn-icon btn-ghost" aria-label={`查看 ${c.displayName} 详情`} onClick={(e) => { e.stopPropagation(); if (c.id != null) onOpenDetail(c.id); }}>
                <Eye size={15} />
              </button>
              <button type="button" className="btn btn-icon btn-ghost" aria-label={`编辑 ${c.displayName}`} onClick={(e) => { e.stopPropagation(); setFormCustomer(c); setFormOpen(true); }}>
                <Pencil size={15} />
              </button>
              <button type="button" className="btn btn-icon btn-ghost delete-btn" aria-label={`删除 ${c.displayName}`} onClick={(e) => { e.stopPropagation(); void remove(c); }}>
                <Trash2 size={15} />
              </button>
            </div>
          </div>
        );
      })}

      {total > 0 ? (
        <div className="pager">
          <button type="button" className="btn btn-sm" disabled={safePage <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>上一页</button>
          <span className="pager-info">第 {safePage} / {totalPages} 页</span>
          <button type="button" className="btn btn-sm" disabled={safePage >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>下一页</button>
          <span className="pager-total count">共 {total} 位客户</span>
        </div>
      ) : null}

      <CustomerFormModal open={formOpen} customer={formCustomer} onClose={() => setFormOpen(false)} />
      <ImportModal open={importOpen} onClose={() => setImportOpen(false)} />
    </div>
  );
}
