import React, { useState, useMemo, useEffect } from 'react';
import { format } from 'date-fns';
import { ChevronDown, ChevronUp, Search, Download, Printer, Phone, Mail, X, ChevronRight } from 'lucide-react';
import { getEffectiveStatus, formatRawStatus, toDate, allFYs } from '../utils/compliance';
import { exportCSV, triggerPrint } from '../utils/export';
import { useUser } from '../hooks/useUser';

// Module-level name cache for CSV export
export const _nameCache = {};

const STATUS_STYLE = {
  completed:     { bg: 'rgba(78,204,163,.13)',  border: 'rgba(78,204,163,.3)',  color: '#4ecca3' },
  'in-progress': { bg: 'rgba(155,114,207,.13)', border: 'rgba(155,114,207,.3)', color: '#9b72cf' },
  pending:       { bg: 'rgba(201,168,76,.13)',  border: 'rgba(201,168,76,.3)',  color: '#c9a84c' },
  overdue:       { bg: 'rgba(232,112,112,.13)', border: 'rgba(232,112,112,.3)', color: '#e87070' },
};

function StatusBadge({ task }) {
  const eff = getEffectiveStatus(task);
  const raw = formatRawStatus(task.status);
  const sty = STATUS_STYLE[eff] || STATUS_STYLE.pending;
  return (
    <span style={{ display: 'inline-block', fontSize: '.68rem', fontWeight: 600, padding: '3px 9px', borderRadius: 99, whiteSpace: 'nowrap', textTransform: 'uppercase', letterSpacing: '.04em', background: sty.bg, border: `1px solid ${sty.border}`, color: sty.color }}>
      {raw}
    </span>
  );
}

// ── Assignee: simple button, expands row on click ─────────────────────────
function AssigneeCell({ uid, expanded, onToggle }) {
  const staff = useUser(uid);

  useEffect(() => {
    if (uid && staff?.name) _nameCache[uid] = staff.name;
  }, [uid, staff]);

  if (!uid) return <span style={{ color: 'var(--slate)', fontSize: '.78rem' }}>—</span>;

  return (
    <button onClick={onToggle} style={{
      display: 'inline-flex', alignItems: 'center', gap: '.35rem',
      background: expanded ? 'rgba(201,168,76,.12)' : 'rgba(255,255,255,.05)',
      border: expanded ? '1px solid rgba(201,168,76,.35)' : '1px solid rgba(255,255,255,.09)',
      borderRadius: 6, padding: '3px 8px',
      color: expanded ? 'var(--gold)' : 'var(--slate-light)',
      cursor: 'pointer', fontSize: '.78rem', fontFamily: 'var(--font-body)',
      transition: 'all .15s',
    }}>
      <div style={{ width: 18, height: 18, borderRadius: '50%', flexShrink: 0, background: 'linear-gradient(135deg,#1e3050,#3a7bd5)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '.55rem', fontWeight: 700, color: '#fff' }}>
        {staff?.init || (staff?.name?.[0] || '?').toUpperCase()}
      </div>
      {staff?.name?.split(' ')[0] || '…'}
      <ChevronRight size={10} style={{ transform: expanded ? 'rotate(90deg)' : 'none', transition: 'transform .15s' }}/>
    </button>
  );
}

// ── Expanded contact row — renders as a full-width <tr> below the task row ─
function ExpandedContact({ uid, colSpan }) {
  const staff = useUser(uid);
  if (!staff) return null;
  return (
    <tr>
      <td colSpan={colSpan} style={{ padding: 0 }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: '1.5rem',
          padding: '.6rem 1rem .6rem 2.5rem',
          background: 'rgba(201,168,76,.05)',
          borderBottom: '1px solid rgba(201,168,76,.1)',
          borderLeft: '3px solid rgba(201,168,76,.3)',
        }}>
          {/* Avatar + name */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '.55rem' }}>
            <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'linear-gradient(135deg,#1e3050,#3a7bd5)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '.7rem', fontWeight: 700, color: '#fff', flexShrink: 0 }}>
              {staff?.init || (staff?.name?.[0] || '?').toUpperCase()}
            </div>
            <div>
              <div style={{ fontSize: '.82rem', color: 'var(--cream)', fontWeight: 600 }}>{staff.name}</div>
              <div style={{ fontSize: '.68rem', color: 'var(--slate)', textTransform: 'capitalize' }}>{staff.role || ''}{staff.dept ? ` · ${staff.dept}` : ''}</div>
            </div>
          </div>
          {/* Email */}
          {staff.email && (
            <a href={`mailto:${staff.email}`} style={{ display: 'flex', alignItems: 'center', gap: '.4rem', color: 'var(--slate-light)', fontSize: '.8rem', textDecoration: 'none' }}
              onMouseOver={e => e.currentTarget.style.color = 'var(--gold)'}
              onMouseOut={e => e.currentTarget.style.color = 'var(--slate-light)'}>
              <Mail size={13} style={{ color: 'var(--gold)', flexShrink: 0 }}/>{staff.email}
            </a>
          )}
          {/* Phone */}
          {staff.phone && (
            <a href={`tel:${staff.phone}`} style={{ display: 'flex', alignItems: 'center', gap: '.4rem', color: 'var(--slate-light)', fontSize: '.8rem', textDecoration: 'none' }}
              onMouseOver={e => e.currentTarget.style.color = 'var(--gold)'}
              onMouseOut={e => e.currentTarget.style.color = 'var(--slate-light)'}>
              <Phone size={13} style={{ color: 'var(--gold)', flexShrink: 0 }}/>{staff.phone}
            </a>
          )}
          {!staff.email && !staff.phone && (
            <span style={{ fontSize: '.75rem', color: 'var(--slate)' }}>No contact info on file.</span>
          )}
        </div>
      </td>
    </tr>
  );
}

export default function TaskTable({ tasks, title = 'Tasks', externalStatus = null, onClearExternal }) {
  const [search,    setSearch]    = useState('');
  const [statusF,   setStatusF]   = useState('all');
  const [periodF,   setPeriodF]   = useState('all');
  const [fyF,       setFyF]       = useState('all');
  const [fromDt,    setFromDt]    = useState('');
  const [toDt,      setToDt]      = useState('');
  const [sortDir,   setSortDir]   = useState('asc');
  const [expanded,  setExpanded]  = useState(null); // task id

  useEffect(() => {
    if (externalStatus) setStatusF(externalStatus);
  }, [externalStatus]);

  const periods = useMemo(() => [...new Set(tasks.map(t => t.period).filter(Boolean))].sort(), [tasks]);
  const fys     = useMemo(() => allFYs(tasks), [tasks]);

  const filtered = useMemo(() => tasks.filter(t => {
    const eff = getEffectiveStatus(t);
    if (statusF !== 'all' && eff !== statusF)      return false;
    if (periodF !== 'all' && t.period !== periodF) return false;
    if (fyF     !== 'all' && t.fy     !== fyF)     return false;
    if (fromDt && t.dueDate && t.dueDate < fromDt) return false;
    if (toDt   && t.dueDate && t.dueDate > toDt)   return false;
    if (search) {
      const hay = `${t.description||''} ${t.service||''} ${t.type||''} ${t.period||''} ${t.status||''}`.toLowerCase();
      if (!hay.includes(search.toLowerCase())) return false;
    }
    return true;
  }).sort((a, b) => {
    const da = toDate(a.dueDate), db = toDate(b.dueDate);
    return sortDir === 'asc' ? da - db : db - da;
  }), [tasks, search, statusF, periodF, fyF, fromDt, toDt, sortDir]);

  function handleCSV() {
    exportCSV(
      `${title.replace(/\s+/g,'_')}_${new Date().toISOString().slice(0,10)}.csv`,
      filtered.map(t => [
        t.description || t.service || '',
        t.period || '', t.fy || '', t.dueDate || '', t.filedDate || '',
        formatRawStatus(t.status),
        _nameCache[t.assignedTo] || (t.assignedTo ? 'Team Member' : ''),
      ]),
      ['Description','Period','FY','Due Date','Filed Date','Status','Assigned To'],
    );
  }

  const COL_COUNT = 7;

  return (
    <div>
      {/* External filter pill */}
      {externalStatus && statusF === externalStatus && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', marginBottom: '.75rem' }}>
          <span style={{ fontSize: '.75rem', color: 'var(--slate)' }}>Filtered by:</span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '.4rem', fontSize: '.75rem', fontWeight: 600, padding: '3px 10px', borderRadius: 99, background: 'rgba(201,168,76,.12)', border: '1px solid rgba(201,168,76,.3)', color: 'var(--gold)' }}>
            {formatRawStatus(externalStatus)}
            <button onClick={() => { setStatusF('all'); onClearExternal?.(); }} style={{ background: 'none', border: 'none', color: 'var(--gold)', cursor: 'pointer', padding: 0, display: 'flex' }}><X size={12}/></button>
          </span>
        </div>
      )}

      {/* Filter bar */}
      <div style={{ display: 'flex', gap: '.5rem', flexWrap: 'wrap', marginBottom: '.8rem', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 150 }}>
          <Search size={13} style={{ position: 'absolute', left: '.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--slate)' }}/>
          <input placeholder="Search tasks…" value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft: '2.2rem' }}/>
        </div>
        <select value={statusF} onChange={e => { setStatusF(e.target.value); onClearExternal?.(); }} style={{ width: 'auto', minWidth: 115 }}>
          <option value="all">All Status</option>
          <option value="completed">Filed</option>
          <option value="pending">Pending</option>
          <option value="overdue">Overdue</option>
          <option value="in-progress">In Progress</option>
        </select>
        <select value={fyF}     onChange={e => setFyF(e.target.value)}     style={{ width: 'auto', minWidth: 105 }}>
          <option value="all">All FY</option>
          {fys.map(f => <option key={f} value={f}>{f}</option>)}
        </select>
        <select value={periodF} onChange={e => setPeriodF(e.target.value)} style={{ width: 'auto', minWidth: 125 }}>
          <option value="all">All Periods</option>
          {periods.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
        <input type="date" value={fromDt} onChange={e => setFromDt(e.target.value)} title="Due from" style={{ width: 'auto' }}/>
        <input type="date" value={toDt}   onChange={e => setToDt(e.target.value)}   title="Due to"   style={{ width: 'auto' }}/>
        <button className="btn btn-outline" onClick={() => setSortDir(d => d==='asc'?'desc':'asc')} style={{ padding: '.5rem .8rem', fontSize: '.78rem', gap: '.3rem', whiteSpace: 'nowrap' }}>
          Due {sortDir==='asc' ? <ChevronUp size={11}/> : <ChevronDown size={11}/>}
        </button>
        <button className="btn btn-outline" onClick={handleCSV} style={{ padding: '.5rem .8rem', fontSize: '.78rem', gap: '.3rem' }}>
          <Download size={12}/> CSV
        </button>
        <button className="btn btn-outline" onClick={() => triggerPrint(title)} style={{ padding: '.5rem .8rem', fontSize: '.78rem', gap: '.3rem' }}>
          <Printer size={12}/> Print
        </button>
      </div>

      <div style={{ fontSize: '.75rem', color: 'var(--slate)', marginBottom: '.6rem' }}>
        {filtered.length} of {tasks.length} task{tasks.length !== 1 ? 's' : ''}
      </div>

      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--slate)', fontSize: '.85rem' }}>No tasks match the current filters.</div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '.84rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(201,168,76,.12)' }}>
                {['Description','Period','FY','Due Date','Filed Date','Assigned To','Status'].map(h => (
                  <th key={h} style={{ padding: '.5rem .75rem', textAlign: 'left', color: 'var(--slate)', fontWeight: 500, fontSize: '.68rem', letterSpacing: '.05em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((task, i) => {
                const isExpanded = expanded === task.id;
                return (
                  <React.Fragment key={task.id}>
                    <tr style={{
                      borderBottom: isExpanded ? 'none' : '1px solid rgba(255,255,255,.04)',
                      background: isExpanded ? 'rgba(201,168,76,.03)' : 'transparent',
                      animation: 'fadeUp .22s ease both',
                      animationDelay: `${i * 0.022}s`,
                    }}>
                      <td style={{ padding: '.6rem .75rem', color: 'var(--cream)', maxWidth: 230 }}>{task.description || task.service || '—'}</td>
                      <td style={{ padding: '.6rem .75rem', color: 'var(--slate-light)', whiteSpace: 'nowrap' }}>{task.period || '—'}</td>
                      <td style={{ padding: '.6rem .75rem', color: 'var(--slate)', whiteSpace: 'nowrap', fontSize: '.76rem' }}>{task.fy || '—'}</td>
                      <td style={{ padding: '.6rem .75rem', color: 'var(--slate-light)', whiteSpace: 'nowrap' }}>{task.dueDate ? format(toDate(task.dueDate), 'dd MMM yyyy') : '—'}</td>
                      <td style={{ padding: '.6rem .75rem', color: 'var(--slate-light)', whiteSpace: 'nowrap' }}>{task.filedDate ? format(toDate(task.filedDate), 'dd MMM yyyy') : '—'}</td>
                      <td style={{ padding: '.6rem .75rem' }}>
                        <AssigneeCell
                          uid={task.assignedTo}
                          expanded={isExpanded}
                          onToggle={() => setExpanded(isExpanded ? null : task.id)}
                        />
                      </td>
                      <td style={{ padding: '.6rem .75rem' }}><StatusBadge task={task}/></td>
                    </tr>
                    {/* Inline expanded contact row */}
                    {isExpanded && <ExpandedContact uid={task.assignedTo} colSpan={COL_COUNT}/>}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
