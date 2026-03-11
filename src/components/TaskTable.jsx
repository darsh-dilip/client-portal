import React, { useState, useMemo, useRef, useEffect } from 'react';
import { format } from 'date-fns';
import { ChevronDown, ChevronUp, Search, Download, Printer, Phone, Mail, X } from 'lucide-react';
import { getEffectiveStatus, formatRawStatus, toDate, allFYs } from '../utils/compliance';
import { exportCSV, triggerPrint } from '../utils/export';
import { useUser } from '../hooks/useUser';

// ── Status badge ───────────────────────────────────────────────────────────
const STATUS_STYLE = {
  completed:     { bg: 'rgba(78,204,163,.13)',  border: 'rgba(78,204,163,.3)',  color: '#4ecca3' },
  'in-progress': { bg: 'rgba(155,114,207,.13)', border: 'rgba(155,114,207,.3)', color: '#9b72cf' },
  pending:       { bg: 'rgba(201,168,76,.13)',  border: 'rgba(201,168,76,.3)',  color: '#c9a84c' },
  overdue:       { bg: 'rgba(232,112,112,.13)', border: 'rgba(232,112,112,.3)', color: '#e87070' },
};

function StatusBadge({ task }) {
  const effective = getEffectiveStatus(task);
  const raw       = formatRawStatus(task.status);
  const sty       = STATUS_STYLE[effective] || STATUS_STYLE.pending;
  return (
    <span style={{
      display: 'inline-block', fontSize: '.68rem', fontWeight: 600,
      padding: '3px 9px', borderRadius: 99, whiteSpace: 'nowrap',
      textTransform: 'uppercase', letterSpacing: '.04em',
      background: sty.bg, border: `1px solid ${sty.border}`, color: sty.color,
    }}>
      {raw}
    </span>
  );
}

// ── Assignee popover ───────────────────────────────────────────────────────
function AssigneeCell({ uid }) {
  const staff = useUser(uid);
  const [open, setOpen] = useState(false);
  const ref  = useRef(null);

  useEffect(() => {
    if (!open) return;
    const handler = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  if (!uid) return <span style={{ color: 'var(--slate)', fontSize: '.78rem' }}>—</span>;

  return (
    <div ref={ref} style={{ position: 'relative', display: 'inline-block' }}>
      <button
        onClick={() => setOpen(v => !v)}
        style={{
          display: 'flex', alignItems: 'center', gap: '.35rem',
          background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.08)',
          borderRadius: 6, padding: '3px 8px', color: 'var(--slate-light)',
          cursor: 'pointer', fontSize: '.78rem', fontFamily: 'var(--font-body)',
        }}>
        <div style={{
          width: 18, height: 18, borderRadius: '50%', flexShrink: 0,
          background: 'linear-gradient(135deg,#1e3050,#3a7bd5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '.55rem', fontWeight: 700, color: '#fff',
        }}>
          {staff?.init || (staff?.name?.[0] || '?').toUpperCase()}
        </div>
        {staff?.name?.split(' ')[0] || '…'}
        <ChevronDown size={10} />
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 6px)', left: 0, zIndex: 100,
          background: 'var(--navy-mid)', border: '1px solid rgba(201,168,76,.2)',
          borderRadius: 10, padding: '.9rem 1rem', minWidth: 210,
          boxShadow: '0 12px 32px rgba(0,0,0,.6)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '.65rem', marginBottom: '.65rem' }}>
            <div style={{
              width: 34, height: 34, borderRadius: '50%',
              background: 'linear-gradient(135deg,#1e3050,#3a7bd5)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '.75rem', fontWeight: 700, color: '#fff', flexShrink: 0,
            }}>
              {staff?.init || (staff?.name?.[0] || '?').toUpperCase()}
            </div>
            <div>
              <div style={{ fontSize: '.88rem', color: 'var(--cream)', fontWeight: 600 }}>{staff?.name || 'Team Member'}</div>
              <div style={{ fontSize: '.7rem', color: 'var(--slate)', textTransform: 'capitalize' }}>{staff?.role || ''}</div>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '.4rem' }}>
            {staff?.email && (
              <a href={`mailto:${staff.email}`} style={{ display: 'flex', alignItems: 'center', gap: '.5rem', color: 'var(--slate-light)', fontSize: '.78rem', textDecoration: 'none' }}>
                <Mail size={12} style={{ color: 'var(--gold)', flexShrink: 0 }} />{staff.email}
              </a>
            )}
            {staff?.phone && (
              <a href={`tel:${staff.phone}`} style={{ display: 'flex', alignItems: 'center', gap: '.5rem', color: 'var(--slate-light)', fontSize: '.78rem', textDecoration: 'none' }}>
                <Phone size={12} style={{ color: 'var(--gold)', flexShrink: 0 }} />{staff.phone}
              </a>
            )}
            {!staff?.email && !staff?.phone && (
              <div style={{ fontSize: '.75rem', color: 'var(--slate)' }}>No contact info on file.</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main TaskTable ─────────────────────────────────────────────────────────
export default function TaskTable({ tasks, title = 'Tasks' }) {
  const [search,   setSearch]   = useState('');
  const [statusF,  setStatusF]  = useState('all');
  const [periodF,  setPeriodF]  = useState('all');
  const [fyF,      setFyF]      = useState('all');
  const [fromDt,   setFromDt]   = useState('');
  const [toDt,     setToDt]     = useState('');
  const [sortDir,  setSortDir]  = useState('asc');

  const periods = useMemo(() => [...new Set(tasks.map(t => t.period).filter(Boolean))].sort(), [tasks]);
  const fys     = useMemo(() => allFYs(tasks), [tasks]);

  const filtered = useMemo(() => tasks.filter(t => {
    const eff = getEffectiveStatus(t);
    if (statusF !== 'all' && eff !== statusF)        return false;
    if (periodF !== 'all' && t.period !== periodF)   return false;
    if (fyF !== 'all'     && t.fy !== fyF)            return false;
    if (fromDt && t.dueDate && t.dueDate < fromDt)   return false;
    if (toDt   && t.dueDate && t.dueDate > toDt)     return false;
    if (search) {
      const hay = `${t.description || ''} ${t.service || ''} ${t.type || ''} ${t.period || ''} ${t.status || ''}`.toLowerCase();
      if (!hay.includes(search.toLowerCase())) return false;
    }
    return true;
  }).sort((a, b) => {
    const da = toDate(a.dueDate), db = toDate(b.dueDate);
    return sortDir === 'asc' ? da - db : db - da;
  }), [tasks, search, statusF, periodF, fyF, fromDt, toDt, sortDir]);

  function handleCSV() {
    exportCSV(
      `${title.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0,10)}.csv`,
      filtered.map(t => [
        t.description || t.service || '',
        t.period || '',
        t.fy || '',
        t.dueDate || '',
        t.filedDate || '',
        formatRawStatus(t.status),
        t.assignedTo || '',
      ]),
      ['Description', 'Period', 'FY', 'Due Date', 'Filed Date', 'Status', 'Assigned To (UID)'],
    );
  }

  return (
    <div>
      {/* ── Filters ──────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: '.6rem', flexWrap: 'wrap', marginBottom: '.85rem', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 160 }}>
          <Search size={13} style={{ position: 'absolute', left: '.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--slate)' }} />
          <input placeholder="Search tasks…" value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft: '2.2rem' }} />
        </div>

        <select value={statusF} onChange={e => setStatusF(e.target.value)} style={{ width: 'auto', minWidth: 120 }}>
          <option value="all">All Status</option>
          <option value="completed">Filed</option>
          <option value="pending">Pending</option>
          <option value="overdue">Overdue</option>
          <option value="in-progress">In Progress</option>
        </select>

        <select value={fyF} onChange={e => setFyF(e.target.value)} style={{ width: 'auto', minWidth: 110 }}>
          <option value="all">All FY</option>
          {fys.map(f => <option key={f} value={f}>{f}</option>)}
        </select>

        <select value={periodF} onChange={e => setPeriodF(e.target.value)} style={{ width: 'auto', minWidth: 130 }}>
          <option value="all">All Periods</option>
          {periods.map(p => <option key={p} value={p}>{p}</option>)}
        </select>

        <input type="date" value={fromDt} onChange={e => setFromDt(e.target.value)} title="Due from" style={{ width: 'auto' }} />
        <input type="date" value={toDt}   onChange={e => setToDt(e.target.value)}   title="Due to"   style={{ width: 'auto' }} />

        <button className="btn btn-outline" onClick={() => setSortDir(d => d === 'asc' ? 'desc' : 'asc')}
          style={{ whiteSpace: 'nowrap', padding: '.55rem .85rem', fontSize: '.8rem', gap: '.3rem' }}>
          Due Date {sortDir === 'asc' ? <ChevronUp size={12}/> : <ChevronDown size={12}/>}
        </button>

        <button className="btn btn-outline" onClick={handleCSV}
          style={{ padding: '.55rem .85rem', fontSize: '.8rem', gap: '.3rem' }}>
          <Download size={13}/> CSV
        </button>
        <button className="btn btn-outline" onClick={() => triggerPrint(title)}
          style={{ padding: '.55rem .85rem', fontSize: '.8rem', gap: '.3rem' }}>
          <Printer size={13}/> Print
        </button>
      </div>

      <div style={{ fontSize: '.78rem', color: 'var(--slate)', marginBottom: '.65rem' }}>
        {filtered.length} of {tasks.length} task{tasks.length !== 1 ? 's' : ''}
      </div>

      {/* ── Table ─────────────────────────────────────────────── */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--slate)', fontSize: '.88rem' }}>
          No tasks match the current filters.
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '.85rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(201,168,76,.12)' }}>
                {['Description', 'Period', 'FY', 'Due Date', 'Filed Date', 'Assigned To', 'Status'].map(h => (
                  <th key={h} style={{
                    padding: '.55rem .8rem', textAlign: 'left',
                    color: 'var(--slate)', fontWeight: 500,
                    fontSize: '.7rem', letterSpacing: '.05em',
                    textTransform: 'uppercase', whiteSpace: 'nowrap',
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((task, i) => (
                <tr key={task.id} style={{
                  borderBottom: '1px solid rgba(255,255,255,.04)',
                  animation: 'fadeUp .25s ease both',
                  animationDelay: `${i * 0.025}s`,
                }}>
                  <td style={{ padding: '.65rem .8rem', color: 'var(--cream)', maxWidth: 240 }}>
                    {task.description || task.service || '—'}
                  </td>
                  <td style={{ padding: '.65rem .8rem', color: 'var(--slate-light)', whiteSpace: 'nowrap' }}>
                    {task.period || '—'}
                  </td>
                  <td style={{ padding: '.65rem .8rem', color: 'var(--slate)', whiteSpace: 'nowrap', fontSize: '.78rem' }}>
                    {task.fy || '—'}
                  </td>
                  <td style={{ padding: '.65rem .8rem', color: 'var(--slate-light)', whiteSpace: 'nowrap' }}>
                    {task.dueDate ? format(toDate(task.dueDate), 'dd MMM yyyy') : '—'}
                  </td>
                  <td style={{ padding: '.65rem .8rem', color: 'var(--slate-light)', whiteSpace: 'nowrap' }}>
                    {task.filedDate ? format(toDate(task.filedDate), 'dd MMM yyyy') : '—'}
                  </td>
                  <td style={{ padding: '.65rem .8rem' }}>
                    <AssigneeCell uid={task.assignedTo} />
                  </td>
                  <td style={{ padding: '.65rem .8rem' }}>
                    <StatusBadge task={task} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
