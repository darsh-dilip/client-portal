import React, { useMemo, useState } from 'react';
import TaskTable from '../components/TaskTable';
import { calcComplianceScore, scoreToGrade, getEffectiveStatus } from '../utils/compliance';
import { Receipt, TrendingUp, FileText } from 'lucide-react';

// ── Equal-size stat tile — clicking filters the table below ───────────────
const TILE_CFG = [
  { key: 'total',       label: 'Total',    color: 'var(--cream)', bg: 'var(--navy-light)',     border: 'rgba(255,255,255,.08)'    },
  { key: 'completed',   label: 'Filed',    color: '#4ecca3',      bg: 'rgba(78,204,163,.09)',  border: 'rgba(78,204,163,.25)'     },
  { key: 'pending',     label: 'Pending',  color: '#c9a84c',      bg: 'rgba(201,168,76,.09)',  border: 'rgba(201,168,76,.25)'     },
  { key: 'overdue',     label: 'Overdue',  color: '#e87070',      bg: 'rgba(232,112,112,.09)', border: 'rgba(232,112,112,.25)'    },
  { key: 'in-progress', label: 'W.I.P',    color: '#9b72cf',      bg: 'rgba(155,114,207,.09)', border: 'rgba(155,114,207,.25)'    },
];

function StatTile({ cfg, value, active, onClick }) {
  return (
    <button
      onClick={() => cfg.key !== 'total' && onClick(cfg.key)}
      style={{
        flex: '1 1 0',           // equal flex width
        minWidth: 0,
        padding: '.65rem .5rem',
        background: active ? cfg.bg : 'var(--navy-light)',
        border: `1px solid ${active ? cfg.border : 'rgba(255,255,255,.07)'}`,
        borderRadius: 'var(--radius-md)',
        textAlign: 'center',
        cursor: cfg.key !== 'total' ? 'pointer' : 'default',
        transition: 'border-color .15s, background .15s',
        outline: active ? `2px solid ${cfg.color}33` : 'none',
      }}
    >
      <div style={{ fontSize: '.6rem', color: active ? cfg.color : 'var(--slate)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: '.25rem', whiteSpace: 'nowrap' }}>
        {cfg.label}
      </div>
      <div style={{ fontSize: '1.65rem', fontFamily: 'var(--font-display)', color: active ? cfg.color : 'var(--cream)' }}>
        {value}
      </div>
    </button>
  );
}

// ── Shared filing page ─────────────────────────────────────────────────────
function FilingPage({ icon, title, subtitle, tasks }) {
  const [activeFilter, setActiveFilter] = useState(null);

  const counts = useMemo(() => {
    let completed = 0, pending = 0, overdue = 0, ip = 0;
    tasks.forEach(t => {
      const s = getEffectiveStatus(t);
      if (s === 'completed')    completed++;
      else if (s === 'overdue') overdue++;
      else if (s === 'in-progress') ip++;
      else pending++;
    });
    return { total: tasks.length, completed, pending, overdue, 'in-progress': ip };
  }, [tasks]);

  function handleTileClick(key) {
    setActiveFilter(prev => prev === key ? null : key);
  }

  if (!tasks.length) return (
    <div>
      <PageHeader icon={icon} title={title} subtitle={subtitle} />
      <div className="card" style={{ textAlign: 'center', padding: '3rem', color: 'var(--slate)' }}>
        No {title} tasks found for your account.
      </div>
    </div>
  );

  return (
    <div>
      <PageHeader icon={icon} title={title} subtitle={subtitle} />

      {/* Equal-width stat tiles in a single row */}
      <div className="fade-up fade-up-1" style={{ display: 'flex', gap: '.6rem', marginBottom: '1rem' }}>
        {TILE_CFG.map(cfg => (
          <StatTile
            key={cfg.key}
            cfg={cfg}
            value={counts[cfg.key] ?? 0}
            active={activeFilter === cfg.key}
            onClick={handleTileClick}
          />
        ))}
      </div>

      {/* Table — receives activeFilter, clicking tile scrolls/filters here */}
      <div className="fade-up fade-up-2 card">
        <TaskTable
          tasks={tasks}
          title={title}
          externalStatus={activeFilter}
          onClearExternal={() => setActiveFilter(null)}
        />
      </div>
    </div>
  );
}

function PageHeader({ icon, title, subtitle }) {
  return (
    <div className="fade-up" style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '.85rem' }}>
      <div style={{ width: 40, height: 40, background: 'var(--navy-light)', border: '1px solid rgba(201,168,76,.15)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {icon}
      </div>
      <div>
        <h1 style={{ fontSize: '1.5rem', color: 'var(--cream)' }}>{title}</h1>
        <p style={{ fontSize: '.78rem', color: 'var(--slate)', marginTop: '.1rem' }}>{subtitle}</p>
      </div>
    </div>
  );
}

export function GSTPage({ tasks }) {
  const t = useMemo(() => tasks.filter(t => t.type === 'GST'), [tasks]);
  return <FilingPage icon={<Receipt size={20} color="var(--gold)" />} title="GST Filings" subtitle="GSTR-1, GSTR-3B, GSTR-9 and other GST returns" tasks={t} />;
}
export function ITPage({ tasks }) {
  const t = useMemo(() => tasks.filter(t => t.type === 'IT'), [tasks]);
  return <FilingPage icon={<TrendingUp size={20} color="#6fa9e8" />} title="Income Tax" subtitle="ITR filings, advance tax, and income tax compliances" tasks={t} />;
}
export function TDSPage({ tasks }) {
  const t = useMemo(() => tasks.filter(t => t.type === 'TDS'), [tasks]);
  return <FilingPage icon={<FileText size={20} color="#4ecca3" />} title="TDS Returns" subtitle="Form 24Q, 26Q, 27Q and TDS/TCS compliances" tasks={t} />;
}
