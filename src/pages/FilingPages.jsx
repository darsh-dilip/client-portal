import React, { useMemo, useState } from 'react';
import TaskTable from '../components/TaskTable';
import { calcComplianceScore, scoreToGrade, getEffectiveStatus } from '../utils/compliance';
import { Receipt, TrendingUp, FileText, X } from 'lucide-react';

const now = new Date();

// ── Clickable stat tile ────────────────────────────────────────────────────
function StatTile({ label, value, color, bg, border, tasks, effectiveStatus }) {
  const [open, setOpen] = useState(false);
  const matching = tasks.filter(t => getEffectiveStatus(t) === effectiveStatus);

  return (
    <>
      <button
        onClick={() => matching.length && setOpen(true)}
        style={{
          padding: '.6rem .9rem', background: bg,
          border: `1px solid ${border}`, borderRadius: 'var(--radius-md)',
          textAlign: 'left', cursor: matching.length ? 'pointer' : 'default',
          transition: 'transform .15s',
        }}
        onMouseOver={e => matching.length && (e.currentTarget.style.transform = 'scale(1.03)')}
        onMouseOut={e => (e.currentTarget.style.transform = '')}
      >
        <div style={{ fontSize: '.62rem', color: 'var(--slate)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: '.2rem' }}>{label}</div>
        <div style={{ fontSize: '1.6rem', fontFamily: 'var(--font-display)', color }}>{value}</div>
      </button>

      {open && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.7)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}
          onClick={() => setOpen(false)}>
          <div style={{ background: 'var(--navy-mid)', border: `1px solid ${border}`, borderRadius: 'var(--radius-xl)', width: '100%', maxWidth: 520, maxHeight: '78vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}
            onClick={e => e.stopPropagation()}>
            <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid rgba(255,255,255,.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ fontSize: '1rem', color, fontWeight: 600 }}>{label} <span style={{ color: 'var(--slate)', fontWeight: 400 }}>({matching.length})</span></div>
              <button onClick={() => setOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--slate)', cursor: 'pointer' }}><X size={16} /></button>
            </div>
            <div style={{ overflowY: 'auto', flex: 1 }}>
              {matching.map(t => (
                <div key={t.id} style={{ padding: '.75rem 1.25rem', borderBottom: '1px solid rgba(255,255,255,.04)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
                  <div>
                    <div style={{ fontSize: '.85rem', color: 'var(--cream)', fontWeight: 500 }}>{t.description || t.service}</div>
                    <div style={{ fontSize: '.72rem', color: 'var(--slate)', marginTop: '.1rem' }}>{t.period} · Due: {t.dueDate || '—'}</div>
                  </div>
                  <span style={{ fontSize: '.68rem', color, background: bg, border: `1px solid ${border}`, borderRadius: 99, padding: '2px 8px', whiteSpace: 'nowrap' }}>{t.type}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ── Compact inline score ───────────────────────────────────────────────────
function InlineScore({ score }) {
  const { grade, color } = scoreToGrade(score);
  const r = 28, circ = 2 * Math.PI * r, dash = ((score || 0) / 100) * circ;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem', background: 'var(--navy-light)', border: '1px solid rgba(201,168,76,.1)', borderRadius: 'var(--radius-md)', padding: '.55rem .85rem' }}>
      <svg width={66} height={66} viewBox="0 0 66 66">
        <circle cx={33} cy={33} r={r} fill="none" stroke="rgba(255,255,255,.06)" strokeWidth={6} />
        <circle cx={33} cy={33} r={r} fill="none" stroke={color} strokeWidth={6}
          strokeDasharray={`${dash} ${circ - dash}`} strokeLinecap="round" transform="rotate(-90 33 33)" />
        <text x={33} y={37} textAnchor="middle" fill={color} fontSize={15} fontWeight={700} fontFamily="var(--font-display)">{score ?? '—'}</text>
      </svg>
      <div>
        <div style={{ fontSize: '.62rem', color: 'var(--slate)', textTransform: 'uppercase', letterSpacing: '.06em' }}>Score</div>
        <div style={{ fontSize: '1.2rem', fontFamily: 'var(--font-display)', color }}>Grade {grade}</div>
      </div>
    </div>
  );
}

// ── Shared FilingPage ──────────────────────────────────────────────────────
function FilingPage({ icon, title, subtitle, tasks }) {
  const score = useMemo(() => calcComplianceScore(tasks), [tasks]);

  const counts = useMemo(() => {
    let filed = 0, pending = 0, overdue = 0, ip = 0;
    tasks.forEach(t => {
      const s = getEffectiveStatus(t);
      if (s === 'completed')    filed++;
      else if (s === 'overdue') overdue++;
      else if (s === 'in-progress') ip++;
      else pending++;
    });
    return { total: tasks.length, filed, pending, overdue, ip };
  }, [tasks]);

  const TILES = [
    { label: 'Total',    value: counts.total,   color: 'var(--cream)', bg: 'var(--navy-light)', border: 'rgba(255,255,255,.08)',   effectiveStatus: null },
    { label: 'Filed',    value: counts.filed,   color: '#4ecca3',      bg: 'rgba(78,204,163,.08)',  border: 'rgba(78,204,163,.2)',  effectiveStatus: 'completed'    },
    { label: 'Pending',  value: counts.pending, color: '#c9a84c',      bg: 'rgba(201,168,76,.08)', border: 'rgba(201,168,76,.2)',   effectiveStatus: 'pending'      },
    { label: 'Overdue',  value: counts.overdue, color: '#e87070',      bg: 'rgba(232,112,112,.08)',border: 'rgba(232,112,112,.2)',  effectiveStatus: 'overdue'      },
    { label: 'W.I.P',    value: counts.ip,      color: '#9b72cf',      bg: 'rgba(155,114,207,.08)',border: 'rgba(155,114,207,.2)',  effectiveStatus: 'in-progress'  },
  ];

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

      {/* Compact stats + score bar */}
      <div className="fade-up fade-up-1" style={{ display: 'flex', gap: '.65rem', marginBottom: '1rem', flexWrap: 'wrap', alignItems: 'stretch' }}>
        {TILES.map(t => (
          <StatTile key={t.label} {...t} tasks={tasks} />
        ))}
        <div style={{ flex: 1, minWidth: 140 }}>
          <InlineScore score={score} />
        </div>
      </div>

      {/* Table */}
      <div className="fade-up fade-up-2 card">
        <TaskTable tasks={tasks} title={title} />
      </div>
    </div>
  );
}

function PageHeader({ icon, title, subtitle }) {
  return (
    <div className="fade-up" style={{ marginBottom: '1.1rem', display: 'flex', alignItems: 'center', gap: '.85rem' }}>
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

// ── Exports ────────────────────────────────────────────────────────────────
export function GSTPage({ tasks }) {
  const gstTasks = useMemo(() => tasks.filter(t => t.type === 'GST'), [tasks]);
  return <FilingPage icon={<Receipt size={20} color="var(--gold)" />} title="GST Filings" subtitle="GSTR-1, GSTR-3B, GSTR-9 and other GST returns" tasks={gstTasks} />;
}

export function ITPage({ tasks }) {
  const itTasks = useMemo(() => tasks.filter(t => t.type === 'IT'), [tasks]);
  return <FilingPage icon={<TrendingUp size={20} color="#6fa9e8" />} title="Income Tax" subtitle="ITR filings, advance tax, and income tax compliances" tasks={itTasks} />;
}

export function TDSPage({ tasks }) {
  const tdsTasks = useMemo(() => tasks.filter(t => t.type === 'TDS'), [tasks]);
  return <FilingPage icon={<FileText size={20} color="#4ecca3" />} title="TDS Returns" subtitle="Form 24Q, 26Q, 27Q and TDS/TCS compliances" tasks={tdsTasks} />;
}
