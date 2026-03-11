import React, { useState, useMemo } from 'react';
import { LayoutGrid, List } from 'lucide-react';
import { friendlyStatus, getStatusColor } from '../utils/compliance';

const MONTHS = ['Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec','Jan','Feb','Mar'];

// Map month name → periodYM-style or period string match
function monthMatchesPeriod(month, period, fy) {
  if (!period) return false;
  const p = period.toLowerCase();
  const m = month.toLowerCase();

  // Direct month match e.g. "Jul 2025", "July 2025"
  if (p.includes(m)) return true;

  // Quarter match
  const Q1 = ['apr','may','jun'], Q2 = ['jul','aug','sep'],
        Q3 = ['oct','nov','dec'], Q4 = ['jan','feb','mar'];
  if ((p.includes('q1') || p.includes('q1 ')) && Q1.includes(m)) return true;
  if ((p.includes('q2') || p.includes('q2 ')) && Q2.includes(m)) return true;
  if ((p.includes('q3') || p.includes('q3 ')) && Q3.includes(m)) return true;
  if ((p.includes('q4') || p.includes('q4 ')) && Q4.includes(m)) return true;

  // Annual — show in Mar
  if ((p.includes('annual') || p.includes('fy') || p.includes('2025-26')) && m === 'mar') return true;

  // periodYM match e.g. "2025-07" → Jul
  const monthMap = { '01':'jan','02':'feb','03':'mar','04':'apr','05':'may','06':'jun',
                     '07':'jul','08':'aug','09':'sep','10':'oct','11':'nov','12':'dec' };
  const ymMatch = period.match(/(\d{4})-(\d{2})/);
  if (ymMatch && monthMap[ymMatch[2]] === m) return true;

  return false;
}

// Group tasks by their "row label" (service/description)
function groupByService(tasks) {
  const map = {};
  tasks.forEach(t => {
    const key = t.description || t.service || t.type || 'Other';
    if (!map[key]) map[key] = { label: key, type: t.type, tasks: [] };
    map[key].tasks.push(t);
  });
  // Sort: GST first, then IT, then TDS, then other
  const order = { GST: 0, IT: 1, TDS: 2, OTHER: 3 };
  return Object.values(map).sort((a, b) => (order[a.type] ?? 3) - (order[b.type] ?? 3));
}

const TYPE_COLOR = { GST: '#c9a84c', IT: '#6fa9e8', TDS: '#4ecca3', OTHER: '#8a9bb5' };

const STATUS_STYLES = {
  completed:     { bg: '#0e2d1f', border: '#2a9d68', text: '#4ecca3',  label: 'Filed'       },
  'in-progress': { bg: '#0d1e3a', border: '#3a7bd5', text: '#6fa9e8',  label: 'In Progress' },
  pending:       { bg: '#1e1a0f', border: '#7a6130', text: '#c9a84c',  label: 'Pending'     },
  overdue:       { bg: '#2d0e0e', border: '#c94c4c', text: '#e87070',  label: 'Overdue'     },
  na:            { bg: 'transparent', border: 'transparent', text: '#3a4a5e', label: '—'    },
};

function getTaskStatus(task, now) {
  const due = task.dueDate ? new Date(task.dueDate) : null;
  const s   = (task.status || 'pending').toLowerCase().replace(/\s+/g, '-');
  if (s === 'completed') return 'completed';
  if (due && due < now)  return 'overdue';
  if (s === 'in-progress') return 'in-progress';
  return 'pending';
}

export default function TimelinePage({ tasks, client }) {
  const [fy,      setFy]      = useState('2025-26');
  const [typeF,   setTypeF]   = useState('all');
  const [view,    setView]    = useState('matrix'); // matrix | list
  const now = new Date();

  const rows = useMemo(() => {
    let filtered = tasks;
    if (typeF !== 'all') filtered = tasks.filter(t => t.type === typeF);
    return groupByService(filtered);
  }, [tasks, typeF]);

  // Summary counts
  const summary = useMemo(() => {
    let filed=0, pending=0, overdue=0, inProgress=0;
    tasks.forEach(t => {
      const s = getTaskStatus(t, now);
      if (s === 'completed')    filed++;
      else if (s === 'overdue') overdue++;
      else if (s === 'in-progress') inProgress++;
      else pending++;
    });
    return { filed, pending, overdue, inProgress, total: tasks.length };
  }, [tasks]);

  return (
    <div>
      {/* Header */}
      <div className="fade-up" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '1.7rem', color: 'var(--cream)' }}>Compliance Timeline</h1>
            <p style={{ fontSize: '.82rem', color: 'var(--slate)', marginTop: '.2rem' }}>
              {client?.name} · FY {fy} · All compliances across the year
            </p>
          </div>
          {/* View toggle */}
          <div style={{ display: 'flex', gap: '.5rem' }}>
            {[['matrix', <LayoutGrid size={15}/>], ['list', <List size={15}/>]].map(([v, icon]) => (
              <button key={v} onClick={() => setView(v)}
                className={view === v ? 'btn btn-gold' : 'btn btn-outline'}
                style={{ padding: '.5rem .9rem', fontSize: '.8rem', gap: '.4rem', textTransform: 'capitalize' }}>
                {icon} {v}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Summary cards */}
      <div className="fade-up fade-up-1" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
        {[
          { label: 'Filed',       val: summary.filed,      col: '#4ecca3', bg: '#0e2d1f' },
          { label: 'In Progress', val: summary.inProgress, col: '#6fa9e8', bg: '#0d1e3a' },
          { label: 'Pending',     val: summary.pending,    col: '#c9a84c', bg: '#1e1a0f' },
          { label: 'Overdue',     val: summary.overdue,    col: '#e87070', bg: '#2d0e0e' },
        ].map(c => (
          <div key={c.label} className="card" style={{ padding: '1rem 1.25rem' }}>
            <div style={{ fontSize: '.72rem', color: 'var(--slate)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: '.35rem' }}>{c.label}</div>
            <div style={{ fontSize: '2rem', fontFamily: 'var(--font-display)', color: c.col }}>{c.val}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="fade-up fade-up-2" style={{ display: 'flex', gap: '.75rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
        <select value={fy} onChange={e => setFy(e.target.value)} style={{ width: 'auto', minWidth: 120 }}>
          <option value="2025-26">FY 2025–26</option>
          <option value="2024-25">FY 2024–25</option>
        </select>
        <select value={typeF} onChange={e => setTypeF(e.target.value)} style={{ width: 'auto', minWidth: 140 }}>
          <option value="all">All Types</option>
          <option value="GST">GST</option>
          <option value="IT">Income Tax</option>
          <option value="TDS">TDS</option>
        </select>
        {/* Legend */}
        <div style={{ display: 'flex', gap: '.75rem', alignItems: 'center', marginLeft: 'auto', flexWrap: 'wrap' }}>
          {Object.entries(STATUS_STYLES).filter(([k]) => k !== 'na').map(([k, v]) => (
            <div key={k} style={{ display: 'flex', alignItems: 'center', gap: '.35rem', fontSize: '.72rem', color: v.text }}>
              <div style={{ width: 8, height: 8, borderRadius: 2, background: v.bg, border: `1px solid ${v.border}` }} />
              {v.label}
            </div>
          ))}
        </div>
      </div>

      {/* ── MATRIX VIEW ──────────────────────────────────────── */}
      {view === 'matrix' && (
        <div className="fade-up fade-up-3" style={{ overflowX: 'auto' }}>
          <div style={{
            background: 'var(--navy-mid)',
            border: '1px solid rgba(201,168,76,.1)',
            borderRadius: 'var(--radius-lg)',
            overflow: 'hidden',
            minWidth: 900,
          }}>
            {/* Header row */}
            <div style={{ display: 'grid', gridTemplateColumns: '220px repeat(12, 1fr)', borderBottom: '1px solid rgba(201,168,76,.12)' }}>
              <div style={{ padding: '.65rem 1rem', fontSize: '.72rem', color: 'var(--slate)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.06em' }}>
                Compliance
              </div>
              {MONTHS.map(m => (
                <div key={m} style={{ padding: '.65rem .4rem', textAlign: 'center', fontSize: '.72rem', color: 'var(--slate)', fontWeight: 600, letterSpacing: '.04em', borderLeft: '1px solid rgba(255,255,255,.04)' }}>
                  {m}
                </div>
              ))}
            </div>

            {/* Rows */}
            {rows.length === 0 ? (
              <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--slate)', fontSize: '.88rem' }}>
                No tasks found for the selected filters.
              </div>
            ) : rows.map((row, ri) => (
              <div key={row.label} style={{
                display: 'grid', gridTemplateColumns: '220px repeat(12, 1fr)',
                borderBottom: ri < rows.length - 1 ? '1px solid rgba(255,255,255,.04)' : 'none',
                background: ri % 2 === 0 ? 'transparent' : 'rgba(255,255,255,.015)',
              }}>
                {/* Row label */}
                <div style={{ padding: '.7rem 1rem', display: 'flex', alignItems: 'center', gap: '.6rem' }}>
                  <div style={{ width: 3, height: 28, borderRadius: 2, background: TYPE_COLOR[row.type] || '#8a9bb5', flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: '.82rem', color: 'var(--cream)', fontWeight: 500, lineHeight: 1.3 }}>
                      {row.label}
                    </div>
                    <div style={{ fontSize: '.68rem', color: TYPE_COLOR[row.type] || '#8a9bb5', marginTop: '.1rem' }}>
                      {row.type}
                    </div>
                  </div>
                </div>

                {/* Month cells */}
                {MONTHS.map(month => {
                  const matchingTasks = row.tasks.filter(t => monthMatchesPeriod(month, t.period, fy));
                  if (matchingTasks.length === 0) {
                    return (
                      <div key={month} style={{ borderLeft: '1px solid rgba(255,255,255,.04)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '.4rem' }}>
                        <div style={{ fontSize: '.65rem', color: '#2a3a4e' }}>—</div>
                      </div>
                    );
                  }
                  return (
                    <div key={month} style={{ borderLeft: '1px solid rgba(255,255,255,.04)', display: 'flex', flexDirection: 'column', gap: 3, padding: '.4rem', alignItems: 'center', justifyContent: 'center' }}>
                      {matchingTasks.map(t => {
                        const s   = getTaskStatus(t, now);
                        const sty = STATUS_STYLES[s] || STATUS_STYLES.pending;
                        return (
                          <div key={t.id}
                            title={`${t.description} · ${t.period} · Due: ${t.dueDate || '—'}`}
                            style={{
                              width: '100%', padding: '3px 5px',
                              background: sty.bg,
                              border: `1px solid ${sty.border}`,
                              borderRadius: 4,
                              fontSize: '.62rem', fontWeight: 600,
                              color: sty.text, textAlign: 'center',
                              cursor: 'default', letterSpacing: '.02em',
                              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                            }}>
                            {sty.label === 'In Progress' ? 'W.I.P' : sty.label}
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
      )}

      {/* ── LIST VIEW ─────────────────────────────────────────── */}
      {view === 'list' && (
        <div className="fade-up fade-up-3" style={{ display: 'flex', flexDirection: 'column', gap: '.75rem' }}>
          {rows.map(row => (
            <div key={row.label} className="card" style={{ padding: '1.1rem 1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem', marginBottom: '.85rem' }}>
                <div style={{ width: 4, height: 32, borderRadius: 2, background: TYPE_COLOR[row.type] || '#8a9bb5' }} />
                <div>
                  <div style={{ fontSize: '.95rem', color: 'var(--cream)', fontWeight: 600 }}>{row.label}</div>
                  <div style={{ fontSize: '.72rem', color: TYPE_COLOR[row.type] || '#8a9bb5' }}>{row.type}</div>
                </div>
                <div style={{ marginLeft: 'auto', display: 'flex', gap: '.4rem' }}>
                  {row.tasks.map(t => {
                    const s   = getTaskStatus(t, now);
                    const sty = STATUS_STYLES[s];
                    return (
                      <span key={t.id} style={{
                        fontSize: '.68rem', fontWeight: 600, padding: '2px 8px', borderRadius: 99,
                        background: sty.bg, border: `1px solid ${sty.border}`, color: sty.text,
                      }}>
                        {t.period} · {sty.label}
                      </span>
                    );
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
