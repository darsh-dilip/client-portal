import React, { useMemo } from 'react';
import { getEffectiveStatus } from '../utils/compliance';

const MONTHS = ['Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec','Jan','Feb','Mar'];

// Icon config for each status
const ICON = {
  completed:     { sym: '✓', color: '#4ecca3', bg: '#071a10', title: 'Filed'       },
  overdue:       { sym: '✗', color: '#e87070', bg: '#1e0707', title: 'Overdue'     },
  'in-progress': { sym: '◉', color: '#9b72cf', bg: '#130a1e', title: 'In Progress' },
  pending:       { sym: '→', color: '#6fa9e8', bg: '#07111e', title: 'Pending'     },
};

const TYPE_COLOR = { GST: '#c9a84c', IT: '#6fa9e8', TDS: '#4ecca3', OTHER: '#8a9bb5' };

// Match task period to a calendar month
function matchMonth(month, period, periodYM) {
  if (!period && !periodYM) return false;
  const m = month.toLowerCase();

  // Try periodYM first — "2025-07" → Jul
  if (periodYM) {
    const mm = { '01':'jan','02':'feb','03':'mar','04':'apr','05':'may','06':'jun',
                 '07':'jul','08':'aug','09':'sep','10':'oct','11':'nov','12':'dec' };
    const parts = periodYM.match(/\d{4}-(\d{2})/);
    if (parts && mm[parts[1]] === m) return true;
  }

  // Try period string
  const p = (period || '').toLowerCase();
  if (p.includes(m)) return true;

  // Quarter match
  const Q = { q1:['apr','may','jun'], q2:['jul','aug','sep'], q3:['oct','nov','dec'], q4:['jan','feb','mar'] };
  for (const [q, ms] of Object.entries(Q)) {
    if (p.includes(q) && ms.includes(m)) return true;
  }

  // Annual → show in Mar
  if ((p.includes('annual') || p.includes('yearly')) && m === 'mar') return true;

  return false;
}

// Group tasks by service name, sort by type
function groupByService(tasks) {
  const map = {};
  tasks.forEach(t => {
    const key = t.description || t.service || 'Other';
    if (!map[key]) map[key] = { label: key, type: t.type || 'OTHER', tasks: [] };
    map[key].tasks.push(t);
  });
  const order = { GST: 0, IT: 1, TDS: 2, OTHER: 3 };
  return Object.values(map).sort((a, b) => (order[a.type] ?? 3) - (order[b.type] ?? 3));
}

export default function TimelinePage({ tasks, client }) {
  const rows = useMemo(() => groupByService(tasks), [tasks]);

  return (
    <div>
      {/* Header + legend */}
      <div className="fade-up" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '.75rem', marginBottom: '.9rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', color: 'var(--cream)' }}>Compliance Timeline</h1>
          <p style={{ fontSize: '.78rem', color: 'var(--slate)', marginTop: '.15rem' }}>
            {client?.name} · All compliances across the financial year
          </p>
        </div>
        <div style={{ display: 'flex', gap: '.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
          {Object.entries(ICON).map(([k, v]) => (
            <div key={k} style={{ display: 'flex', alignItems: 'center', gap: '.3rem', fontSize: '.72rem' }}>
              <span style={{ width: 17, height: 17, borderRadius: 4, background: v.bg, border: `1px solid ${v.color}`, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '.65rem', color: v.color, fontWeight: 700 }}>{v.sym}</span>
              <span style={{ color: 'var(--slate)' }}>{v.title}</span>
            </div>
          ))}
          <div style={{ width: 1, height: 14, background: 'rgba(255,255,255,.1)' }} />
          {Object.entries(TYPE_COLOR).map(([k, v]) => (
            <div key={k} style={{ display: 'flex', alignItems: 'center', gap: '.3rem', fontSize: '.72rem' }}>
              <div style={{ width: 8, height: 8, borderRadius: 2, background: v }} />
              <span style={{ color: 'var(--slate)' }}>{k}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Matrix */}
      <div className="fade-up fade-up-1" style={{ overflowX: 'auto' }}>
        <div style={{ background: 'var(--navy-mid)', border: '1px solid rgba(201,168,76,.1)', borderRadius: 'var(--radius-lg)', overflow: 'hidden', minWidth: 680 }}>

          {/* Header row */}
          <div style={{ display: 'grid', gridTemplateColumns: '170px repeat(12,1fr)', borderBottom: '1px solid rgba(201,168,76,.12)' }}>
            <div style={{ padding: '.4rem .75rem', fontSize: '.6rem', color: 'var(--slate)', textTransform: 'uppercase', letterSpacing: '.07em' }}>Compliance</div>
            {MONTHS.map(m => (
              <div key={m} style={{ padding: '.4rem .2rem', textAlign: 'center', fontSize: '.62rem', color: 'var(--slate)', fontWeight: 600, borderLeft: '1px solid rgba(255,255,255,.04)' }}>{m}</div>
            ))}
          </div>

          {/* Rows */}
          {rows.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--slate)', fontSize: '.85rem' }}>No tasks found.</div>
          ) : rows.map((row, ri) => (
            <div key={row.label} style={{
              display: 'grid', gridTemplateColumns: '170px repeat(12,1fr)',
              borderBottom: ri < rows.length - 1 ? '1px solid rgba(255,255,255,.04)' : 'none',
              background: ri % 2 === 0 ? 'transparent' : 'rgba(255,255,255,.012)',
            }}>
              {/* Label */}
              <div style={{ padding: '.5rem .75rem', display: 'flex', alignItems: 'center', gap: '.4rem' }}>
                <div style={{ width: 2, height: 22, borderRadius: 2, background: TYPE_COLOR[row.type] || '#8a9bb5', flexShrink: 0 }} />
                <div>
                  <div style={{ fontSize: '.75rem', color: 'var(--cream)', fontWeight: 500, lineHeight: 1.25 }}>{row.label}</div>
                  <div style={{ fontSize: '.58rem', color: TYPE_COLOR[row.type] || '#8a9bb5' }}>{row.type}</div>
                </div>
              </div>

              {/* Month cells */}
              {MONTHS.map(month => {
                const matching = row.tasks.filter(t => matchMonth(month, t.period, t.periodYM));
                if (!matching.length) return (
                  <div key={month} style={{ borderLeft: '1px solid rgba(255,255,255,.04)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontSize: '.5rem', color: 'rgba(255,255,255,.06)' }}>·</span>
                  </div>
                );
                return (
                  <div key={month} style={{ borderLeft: '1px solid rgba(255,255,255,.04)', display: 'flex', flexDirection: 'column', gap: 3, padding: '.3rem', alignItems: 'center', justifyContent: 'center' }}>
                    {matching.map(t => {
                      const eff = getEffectiveStatus(t);
                      const ic  = ICON[eff] || ICON.pending;
                      return (
                        <div key={t.id}
                          title={`${t.description || t.service}\nPeriod: ${t.period}\nDue: ${t.dueDate || '—'}\nStatus: ${ic.title}`}
                          style={{ width: 20, height: 20, borderRadius: 4, background: ic.bg, border: `1px solid ${ic.color}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '.68rem', color: ic.color, fontWeight: 700, cursor: 'default', flexShrink: 0 }}>
                          {ic.sym}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
