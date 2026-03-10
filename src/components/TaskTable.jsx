import React, { useState, useMemo } from 'react';
import { format } from 'date-fns';
import { getStatusColor, friendlyStatus } from '../utils/compliance';
import { ChevronDown, ChevronUp, Search } from 'lucide-react';

export default function TaskTable({ tasks, title }) {
  const [search,   setSearch]   = useState('');
  const [statusF,  setStatusF]  = useState('all');
  const [periodF,  setPeriodF]  = useState('all');
  const [sortDir,  setSortDir]  = useState('asc');

  const periods = useMemo(() => {
    const s = new Set(tasks.map(t => t.period).filter(Boolean));
    return ['all', ...Array.from(s).sort()];
  }, [tasks]);

  const filtered = useMemo(() => {
    return tasks
      .filter(t => {
        if (statusF !== 'all' && t.status !== statusF) return false;
        if (periodF !== 'all' && t.period !== periodF) return false;
        if (search) {
          const hay = `${t.description || ''} ${t.type || ''} ${t.period || ''}`.toLowerCase();
          if (!hay.includes(search.toLowerCase())) return false;
        }
        return true;
      })
      .sort((a, b) => {
        const da = toDate(a.dueDate);
        const db2 = toDate(b.dueDate);
        return sortDir === 'asc' ? da - db2 : db2 - da;
      });
  }, [tasks, search, statusF, periodF, sortDir]);

  return (
    <div>
      {/* ── Filters ─────────────────────────────────────────── */}
      <div style={{
        display: 'flex', gap: '.75rem', flexWrap: 'wrap',
        marginBottom: '1.25rem', alignItems: 'center'
      }}>
        <div style={{ position: 'relative', flex: '1', minWidth: 180 }}>
          <Search size={14} style={{ position: 'absolute', left: '.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--slate)' }} />
          <input
            placeholder="Search tasks…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ paddingLeft: '2.2rem' }}
          />
        </div>

        <select value={statusF} onChange={e => setStatusF(e.target.value)} style={{ width: 'auto', minWidth: 130 }}>
          <option value="all">All Status</option>
          <option value="completed">Filed</option>
          <option value="in-progress">In Progress</option>
          <option value="pending">Pending</option>
          <option value="overdue">Overdue</option>
        </select>

        <select value={periodF} onChange={e => setPeriodF(e.target.value)} style={{ width: 'auto', minWidth: 130 }}>
          {periods.map(p => (
            <option key={p} value={p}>{p === 'all' ? 'All Periods' : p}</option>
          ))}
        </select>

        <button
          className="btn btn-outline"
          onClick={() => setSortDir(d => d === 'asc' ? 'desc' : 'asc')}
          style={{ whiteSpace: 'nowrap', padding: '.6rem 1rem', fontSize: '.82rem' }}
        >
          Due Date {sortDir === 'asc' ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
        </button>
      </div>

      {/* ── Count ────────────────────────────────────────────── */}
      <div style={{ fontSize: '.8rem', color: 'var(--slate)', marginBottom: '.75rem' }}>
        {filtered.length} of {tasks.length} task{tasks.length !== 1 ? 's' : ''}
      </div>

      {/* ── Table ────────────────────────────────────────────── */}
      {filtered.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem', color: 'var(--slate)' }}>
          No tasks found.
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '.88rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(201,168,76,.12)' }}>
                {['Description', 'Period', 'Due Date', 'Filed Date', 'Status'].map(h => (
                  <th key={h} style={{
                    padding: '.6rem .8rem',
                    textAlign: 'left',
                    color: 'var(--slate)',
                    fontWeight: 500,
                    fontSize: '.78rem',
                    letterSpacing: '.05em',
                    textTransform: 'uppercase',
                    whiteSpace: 'nowrap',
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((task, i) => (
                <tr key={task.id}
                  style={{
                    borderBottom: '1px solid rgba(255,255,255,.04)',
                    animation: `fadeUp .3s ease both`,
                    animationDelay: `${i * 0.03}s`,
                  }}
                >
                  <td style={{ padding: '.75rem .8rem', color: 'var(--cream)', maxWidth: 260 }}>
                    {task.description || task.type || '—'}
                  </td>
                  <td style={{ padding: '.75rem .8rem', color: 'var(--slate-light)', whiteSpace: 'nowrap' }}>
                    {task.period || '—'}
                  </td>
                  <td style={{ padding: '.75rem .8rem', color: 'var(--slate-light)', whiteSpace: 'nowrap' }}>
                    {task.dueDate ? format(toDate(task.dueDate), 'dd MMM yyyy') : '—'}
                  </td>
                  <td style={{ padding: '.75rem .8rem', color: 'var(--slate-light)', whiteSpace: 'nowrap' }}>
                    {task.filedDate ? format(toDate(task.filedDate), 'dd MMM yyyy') : '—'}
                  </td>
                  <td style={{ padding: '.75rem .8rem' }}>
                    <span className={`badge badge-${getStatusColor(task.status)}`}>
                      {friendlyStatus(task.status)}
                    </span>
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

function toDate(val) {
  if (!val) return new Date(0);
  if (val.toDate) return val.toDate();
  return new Date(val);
}
