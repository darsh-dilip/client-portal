import React, { useMemo } from 'react';
import { formatRawStatus } from '../utils/compliance';

const MONTHS = ['Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec','Jan','Feb','Mar'];

// Status cell config — text labels, full status support
const STATUS_CFG = {
  completed:     { label: 'Filed',       color: '#4ecca3', bg: 'rgba(78,204,163,.12)',  border: 'rgba(78,204,163,.35)'  },
  overdue:       { label: 'Overdue',     color: '#e87070', bg: 'rgba(232,112,112,.12)', border: 'rgba(232,112,112,.35)' },
  'in-progress': { label: 'W.I.P',       color: '#9b72cf', bg: 'rgba(155,114,207,.12)', border: 'rgba(155,114,207,.35)' },
  pending:       { label: 'Pending',     color: '#6fa9e8', bg: 'rgba(111,169,232,.12)', border: 'rgba(111,169,232,.35)' },
  on_hold:       { label: 'On Hold',     color: '#c9a84c', bg: 'rgba(201,168,76,.12)',  border: 'rgba(201,168,76,.35)'  },
  refused:       { label: 'Refused',     color: '#e87070', bg: 'rgba(232,112,112,.08)', border: 'rgba(232,112,112,.2)'  },
  data_pending:  { label: 'Data Pend.',  color: '#f0a050', bg: 'rgba(240,160,80,.1)',   border: 'rgba(240,160,80,.3)'   },
  nil_filed:     { label: 'Nil Filed',   color: '#4ecca3', bg: 'rgba(78,204,163,.08)',  border: 'rgba(78,204,163,.25)'  },
};

function getStatusCfg(status) {
  const s = (status || 'pending').toLowerCase().replace(' ', '_').replace('-', '_');
  return STATUS_CFG[s] || STATUS_CFG.pending;
}

function getEffective(task) {
  const s = (task.status || 'pending').toLowerCase().trim();
  if (['completed','nil_filed','nil filed','filed'].includes(s)) return 'completed';
  if (s === 'on_hold' || s === 'on hold')  return 'on_hold';
  if (s === 'refused')                      return 'refused';
  if (s === 'data_pending' || s === 'data pending') return 'data_pending';
  if (s === 'in-progress' || s === 'in progress' || s === 'wip') return 'in-progress';
  if (task.dueDate && new Date(task.dueDate) < new Date()) return 'overdue';
  return 'pending';
}

const TYPE_COLOR = { GST: '#c9a84c', IT: '#6fa9e8', TDS: '#4ecca3', OTHER: '#8a9bb5' };

function matchMonth(month, period, periodYM) {
  if (!period && !periodYM) return false;
  const m = month.toLowerCase();
  if (periodYM) {
    const mm = { '01':'jan','02':'feb','03':'mar','04':'apr','05':'may','06':'jun','07':'jul','08':'aug','09':'sep','10':'oct','11':'nov','12':'dec' };
    const parts = periodYM.match(/\d{4}-(\d{2})/);
    if (parts && mm[parts[1]] === m) return true;
  }
  const p = (period || '').toLowerCase();
  if (p.includes(m)) return true;
  const Q = { q1:['apr','may','jun'], q2:['jul','aug','sep'], q3:['oct','nov','dec'], q4:['jan','feb','mar'] };
  for (const [q, ms] of Object.entries(Q)) {
    if (p.includes(q) && ms.includes(m)) return true;
  }
  if ((p.includes('annual') || p.includes('yearly')) && m === 'mar') return true;
  return false;
}

function groupByService(tasks) {
  const map = {};
  tasks.forEach(t => {
    const key = t.description || t.service || 'Other';
    if (!map[key]) map[key] = { label: key, type: t.type || 'OTHER', tasks: [] };
    map[key].tasks.push(t);
  });
  const order = { GST:0, IT:1, TDS:2, OTHER:3 };
  return Object.values(map).sort((a,b) => (order[a.type]??3)-(order[b.type]??3));
}

// Legend items
const LEGEND = [
  { key:'completed',    label:'Filed'     },
  { key:'overdue',      label:'Overdue'   },
  { key:'in-progress',  label:'W.I.P'     },
  { key:'pending',      label:'Pending'   },
  { key:'on_hold',      label:'On Hold'   },
  { key:'data_pending', label:'Data Pend.'},
  { key:'nil_filed',    label:'Nil Filed' },
];

export default function TimelinePage({ tasks, client }) {
  const rows = useMemo(() => groupByService(tasks), [tasks]);

  return (
    <div>
      {/* Header + legend */}
      <div className="fade-up" style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', flexWrap:'wrap', gap:'.75rem', marginBottom:'.9rem' }}>
        <div>
          <h1 style={{ fontSize:'1.5rem', color:'var(--cream)' }}>Compliance Timeline</h1>
          <p style={{ fontSize:'.78rem', color:'var(--slate)', marginTop:'.15rem' }}>
            {client?.name} · All compliances across the financial year
          </p>
        </div>
        {/* Legend */}
        <div style={{ display:'flex', gap:'.55rem', flexWrap:'wrap', alignItems:'center' }}>
          {LEGEND.map(l => {
            const cfg = STATUS_CFG[l.key] || STATUS_CFG.pending;
            return (
              <div key={l.key} style={{ display:'flex', alignItems:'center', gap:'.3rem', fontSize:'.7rem' }}>
                <div style={{ padding:'1px 7px', borderRadius:4, background:cfg.bg, border:`1px solid ${cfg.border}`, color:cfg.color, fontSize:'.62rem', fontWeight:600 }}>{l.label}</div>
              </div>
            );
          })}
          <div style={{ width:1, height:14, background:'rgba(255,255,255,.1)' }}/>
          {Object.entries(TYPE_COLOR).map(([k,v]) => (
            <div key={k} style={{ display:'flex', alignItems:'center', gap:'.3rem', fontSize:'.7rem' }}>
              <div style={{ width:8, height:8, borderRadius:2, background:v }}/>
              <span style={{ color:'var(--slate)' }}>{k}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Matrix */}
      <div className="fade-up fade-up-1" style={{ overflowX:'auto' }}>
        <div style={{ background:'var(--navy-mid)', border:'1px solid rgba(201,168,76,.1)', borderRadius:'var(--radius-lg)', overflow:'hidden', minWidth:800 }}>

          {/* Header row */}
          <div style={{ display:'grid', gridTemplateColumns:'170px repeat(12,1fr)', borderBottom:'1px solid rgba(201,168,76,.12)' }}>
            <div style={{ padding:'.4rem .75rem', fontSize:'.6rem', color:'var(--slate)', textTransform:'uppercase', letterSpacing:'.07em' }}>Compliance</div>
            {MONTHS.map(m => (
              <div key={m} style={{ padding:'.4rem .2rem', textAlign:'center', fontSize:'.62rem', color:'var(--slate)', fontWeight:600, borderLeft:'1px solid rgba(255,255,255,.04)' }}>{m}</div>
            ))}
          </div>

          {rows.length === 0 ? (
            <div style={{ padding:'2rem', textAlign:'center', color:'var(--slate)', fontSize:'.85rem' }}>No tasks found.</div>
          ) : rows.map((row, ri) => (
            <div key={row.label} style={{ display:'grid', gridTemplateColumns:'170px repeat(12,1fr)', borderBottom: ri < rows.length-1 ? '1px solid rgba(255,255,255,.04)' : 'none', background: ri%2===0 ? 'transparent' : 'rgba(255,255,255,.012)' }}>
              {/* Label */}
              <div style={{ padding:'.55rem .75rem', display:'flex', alignItems:'center', gap:'.4rem' }}>
                <div style={{ width:2, height:28, borderRadius:2, background:TYPE_COLOR[row.type]||'#8a9bb5', flexShrink:0 }}/>
                <div>
                  <div style={{ fontSize:'.75rem', color:'var(--cream)', fontWeight:500, lineHeight:1.25 }}>{row.label}</div>
                  <div style={{ fontSize:'.58rem', color:TYPE_COLOR[row.type]||'#8a9bb5' }}>{row.type}</div>
                </div>
              </div>

              {/* Month cells */}
              {MONTHS.map(month => {
                const matching = row.tasks.filter(t => matchMonth(month, t.period, t.periodYM));
                if (!matching.length) return (
                  <div key={month} style={{ borderLeft:'1px solid rgba(255,255,255,.04)', display:'flex', alignItems:'center', justifyContent:'center', padding:'.3rem .15rem' }}>
                    <span style={{ fontSize:'.45rem', color:'rgba(255,255,255,.07)' }}>·</span>
                  </div>
                );
                return (
                  <div key={month} style={{ borderLeft:'1px solid rgba(255,255,255,.04)', display:'flex', flexDirection:'column', gap:2, padding:'.3rem .2rem', alignItems:'center', justifyContent:'center' }}>
                    {matching.map(t => {
                      const eff = getEffective(t);
                      const cfg = STATUS_CFG[eff] || STATUS_CFG.pending;
                      // Use the raw Firestore status for the label
                      const rawLabel = formatRawStatus(t.status);
                      return (
                        <div key={t.id}
                          title={`${t.description||t.service}\nPeriod: ${t.period}\nDue: ${t.dueDate||'—'}\nStatus: ${rawLabel}`}
                          style={{
                            padding: '2px 6px',
                            borderRadius: 4,
                            background: cfg.bg,
                            border: `1px solid ${cfg.border}`,
                            color: cfg.color,
                            fontSize: '.58rem',
                            fontWeight: 700,
                            whiteSpace: 'nowrap',
                            letterSpacing: '.02em',
                            cursor: 'default',
                          }}>
                          {cfg.label}
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
