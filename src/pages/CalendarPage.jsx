import React, { useMemo, useState } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, addMonths, subMonths, isBefore } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { getEffectiveStatus, formatRawStatus, toDate } from '../utils/compliance';

const TYPE_COLOR = { GST: '#c9a84c', IT: '#6fa9e8', TDS: '#4ecca3', OTHER: '#8a9bb5' };

const STATUS_COLOR = {
  completed:     '#4ecca3',
  'in-progress': '#9b72cf',
  pending:       '#e8a83a',
  overdue:       '#e87070',
};

const LEGEND = [
  { color: '#4ecca3', label: 'Filed' },
  { color: '#9b72cf', label: 'In Progress' },
  { color: '#e8a83a', label: 'Pending' },
  { color: '#e87070', label: 'Overdue' },
];

export default function CalendarPage({ tasks }) {
  const [current, setCurrent] = useState(new Date());
  const now   = new Date();
  const start = startOfMonth(current);
  const end   = endOfMonth(current);
  const days  = eachDayOfInterval({ start, end });
  const padStart = start.getDay();

  const taskMap = useMemo(() => {
    const m = {};
    tasks.forEach(t => {
      const d = toDate(t.dueDate);
      if (!d || d.getTime() === 0) return;
      if (!isSameMonth(d, current)) return;
      const k = format(d, 'yyyy-MM-dd');
      if (!m[k]) m[k] = [];
      m[k].push(t);
    });
    return m;
  }, [tasks, current]);

  const monthTasks = useMemo(() =>
    tasks.filter(t => {
      const d = toDate(t.dueDate);
      return d && isSameMonth(d, current);
    }).sort((a, b) => toDate(a.dueDate) - toDate(b.dueDate))
  , [tasks, current]);

  const DOW = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

  return (
    <div>
      {/* ── Header with legend inline ───────────────────────── */}
      <div className="fade-up" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', color: 'var(--cream)' }}>Compliance Calendar</h1>
          <p style={{ fontSize: '.78rem', color: 'var(--slate)', marginTop: '.15rem' }}>All filing due dates at a glance</p>
        </div>
        {/* Legend in header */}
        <div style={{ display: 'flex', gap: '.85rem', alignItems: 'center', flexWrap: 'wrap' }}>
          {LEGEND.map(l => (
            <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: '.35rem', fontSize: '.75rem', color: 'var(--slate-light)' }}>
              <div style={{ width: 9, height: 9, borderRadius: 3, background: l.color, flexShrink: 0 }} />
              {l.label}
            </div>
          ))}
          {Object.entries(TYPE_COLOR).map(([k, v]) => (
            <div key={k} style={{ display: 'flex', alignItems: 'center', gap: '.35rem', fontSize: '.75rem', color: 'var(--slate)' }}>
              <div style={{ width: 9, height: 2, background: v, borderRadius: 1 }} />
              {k}
            </div>
          ))}
        </div>
      </div>

      <div className="fade-up fade-up-1" style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '1.25rem' }}>

        {/* ── Calendar grid ─────────────────────────────────── */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          {/* Month nav */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '.9rem 1.25rem', borderBottom: '1px solid rgba(201,168,76,.1)' }}>
            <button className="btn btn-outline" style={{ padding: '.35rem .6rem' }} onClick={() => setCurrent(d => subMonths(d, 1))}>
              <ChevronLeft size={15} />
            </button>
            <h2 style={{ fontSize: '1rem', fontFamily: 'var(--font-display)' }}>
              {format(current, 'MMMM yyyy')}
            </h2>
            <button className="btn btn-outline" style={{ padding: '.35rem .6rem' }} onClick={() => setCurrent(d => addMonths(d, 1))}>
              <ChevronRight size={15} />
            </button>
          </div>

          {/* DOW headers */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', borderBottom: '1px solid rgba(255,255,255,.05)' }}>
            {DOW.map(d => (
              <div key={d} style={{ padding: '.4rem', textAlign: 'center', fontSize: '.68rem', color: 'var(--slate)', fontWeight: 600, letterSpacing: '.04em' }}>{d}</div>
            ))}
          </div>

          {/* Days — only render actual days + leading padding, no trailing empty rows */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)' }}>
            {Array.from({ length: padStart }).map((_, i) => (
              <div key={`pad-${i}`} style={{ minHeight: 72, borderRight: '1px solid rgba(255,255,255,.03)' }} />
            ))}
            {days.map((day, i) => {
              const key      = format(day, 'yyyy-MM-dd');
              const dayTasks = taskMap[key] || [];
              const today    = isToday(day);
              const past     = isBefore(day, now) && !today;
              const col      = (padStart + i) % 7;

              return (
                <div key={key} style={{
                  minHeight: 72,
                  padding: '.35rem .4rem',
                  borderTop: '1px solid rgba(255,255,255,.03)',
                  borderRight: col < 6 ? '1px solid rgba(255,255,255,.03)' : 'none',
                  background: today ? 'rgba(201,168,76,.06)' : 'transparent',
                }}>
                  <div style={{ fontSize: '.78rem', fontWeight: today ? 700 : 400, color: today ? 'var(--gold)' : past ? 'var(--slate)' : 'var(--slate-light)', marginBottom: '.2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    {format(day, 'd')}
                    {today && <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--gold)', display: 'block' }} />}
                  </div>
                  {dayTasks.slice(0, 3).map(t => {
                    const eff = getEffectiveStatus(t);
                    const c   = STATUS_COLOR[eff] || '#8a9bb5';
                    const tc  = TYPE_COLOR[t.type] || '#8a9bb5';
                    return (
                      <div key={t.id} title={`${t.description || t.service} · ${formatRawStatus(t.status)}`}
                        style={{ fontSize: '.6rem', background: `${c}1a`, color: c, borderLeft: `2px solid ${tc}`, borderRadius: '0 3px 3px 0', padding: '.1rem .3rem', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {t.type} · {t.period || (t.description || '').slice(0, 10)}
                      </div>
                    );
                  })}
                  {dayTasks.length > 3 && <div style={{ fontSize: '.55rem', color: 'var(--slate)' }}>+{dayTasks.length - 3} more</div>}
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Sidebar ───────────────────────────────────────── */}
        <div className="card" style={{ padding: '1rem', overflowY: 'auto', maxHeight: 560 }}>
          <div style={{ fontSize: '.72rem', color: 'var(--slate)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: '.85rem', fontWeight: 600 }}>
            {format(current, 'MMMM')} — {monthTasks.length} Filing{monthTasks.length !== 1 ? 's' : ''}
          </div>

          {monthTasks.length === 0 ? (
            <p style={{ color: 'var(--slate)', fontSize: '.85rem' }}>No filings this month.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '.55rem' }}>
              {monthTasks.map(t => {
                const due = toDate(t.dueDate);
                const eff = getEffectiveStatus(t);
                const c   = STATUS_COLOR[eff] || '#8a9bb5';
                return (
                  <div key={t.id} style={{ padding: '.65rem .8rem', background: 'var(--navy-light)', borderRadius: 'var(--radius-sm)', borderLeft: `3px solid ${c}` }}>
                    <div style={{ fontSize: '.83rem', color: 'var(--cream)', fontWeight: 500, marginBottom: '.2rem' }}>
                      {t.description || t.service || t.type}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '.5rem' }}>
                      <span style={{ fontSize: '.7rem', color: 'var(--slate)' }}>
                        {t.period} · {format(due, 'dd MMM')}
                      </span>
                      <span style={{ fontSize: '.62rem', fontWeight: 600, color: c, background: `${c}1a`, border: `1px solid ${c}33`, borderRadius: 99, padding: '1px 7px', whiteSpace: 'nowrap' }}>
                        {formatRawStatus(t.status)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
