import React, { useMemo, useState } from 'react';
import {
  format, startOfMonth, endOfMonth, eachDayOfInterval,
  isSameMonth, isSameDay, isToday, addMonths, subMonths,
  isBefore,
} from 'date-fns';
import { ChevronLeft, ChevronRight, Calendar as CalIcon } from 'lucide-react';
import { getStatusColor, friendlyStatus } from '../utils/compliance';

export default function CalendarPage({ tasks }) {
  const [current, setCurrent] = useState(new Date());

  const now    = new Date();
  const start  = startOfMonth(current);
  const end    = endOfMonth(current);
  const days   = eachDayOfInterval({ start, end });

  // Pad start to Sunday
  const padStart = start.getDay(); // 0=Sun

  // Build a map: dateString → tasks[]
  const taskMap = useMemo(() => {
    const m = {};
    tasks.forEach(t => {
      const d = toDate(t.dueDate);
      if (!d) return;
      const k = format(d, 'yyyy-MM-dd');
      if (!m[k]) m[k] = [];
      m[k].push(t);
    });
    return m;
  }, [tasks]);

  // Upcoming in this month
  const monthTasks = useMemo(() => {
    return tasks
      .filter(t => {
        const d = toDate(t.dueDate);
        return isSameMonth(d, current);
      })
      .sort((a, b) => toDate(a.dueDate) - toDate(b.dueDate));
  }, [tasks, current]);

  const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div>
      <div className="fade-up" style={{ marginBottom: '1.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{
            width: 46, height: 46,
            background: 'var(--navy-light)',
            border: '1px solid rgba(201,168,76,.15)',
            borderRadius: 12,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <CalIcon size={20} color="var(--gold)" />
          </div>
          <div>
            <h1 style={{ fontSize: '1.6rem', color: 'var(--cream)' }}>Compliance Calendar</h1>
            <p style={{ fontSize: '.82rem', color: 'var(--slate)' }}>All filing due dates at a glance</p>
          </div>
        </div>
      </div>

      <div className="fade-up fade-up-1" style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '1.5rem' }}>
        {/* ── Calendar grid ───────────────────────────────────── */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          {/* Month nav */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '1.1rem 1.5rem',
            borderBottom: '1px solid rgba(201,168,76,.1)',
          }}>
            <button
              className="btn btn-outline"
              style={{ padding: '.4rem .7rem' }}
              onClick={() => setCurrent(d => subMonths(d, 1))}
            >
              <ChevronLeft size={16} />
            </button>
            <h2 style={{ fontSize: '1.1rem', fontFamily: 'var(--font-display)' }}>
              {format(current, 'MMMM yyyy')}
            </h2>
            <button
              className="btn btn-outline"
              style={{ padding: '.4rem .7rem' }}
              onClick={() => setCurrent(d => addMonths(d, 1))}
            >
              <ChevronRight size={16} />
            </button>
          </div>

          {/* DOW headers */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', borderBottom: '1px solid rgba(255,255,255,.05)' }}>
            {DOW.map(d => (
              <div key={d} style={{
                padding: '.5rem',
                textAlign: 'center',
                fontSize: '.72rem',
                color: 'var(--slate)',
                fontWeight: 600,
                letterSpacing: '.04em',
              }}>
                {d}
              </div>
            ))}
          </div>

          {/* Days grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)' }}>
            {/* Pad */}
            {Array.from({ length: padStart }).map((_, i) => (
              <div key={`pad-${i}`} style={{ minHeight: 80 }} />
            ))}

            {days.map(day => {
              const key = format(day, 'yyyy-MM-dd');
              const dayTasks = taskMap[key] || [];
              const today = isToday(day);
              const past  = isBefore(day, now) && !today;

              return (
                <div key={key} style={{
                  minHeight: 80,
                  padding: '.4rem .5rem',
                  border: '1px solid rgba(255,255,255,.04)',
                  background: today ? 'rgba(201,168,76,.06)' : 'transparent',
                  position: 'relative',
                }}>
                  <div style={{
                    fontSize: '.82rem',
                    fontWeight: today ? 700 : 400,
                    color: today ? 'var(--gold)' : past ? 'var(--slate)' : 'var(--slate-light)',
                    marginBottom: '.25rem',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  }}>
                    {format(day, 'd')}
                    {today && (
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--gold)', display: 'block' }} />
                    )}
                  </div>
                  {dayTasks.slice(0, 3).map(t => (
                    <DayTask key={t.id} task={t} />
                  ))}
                  {dayTasks.length > 3 && (
                    <div style={{ fontSize: '.65rem', color: 'var(--slate)', marginTop: '.1rem' }}>
                      +{dayTasks.length - 3} more
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Sidebar: this month's tasks ─────────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="card" style={{ padding: '1rem 1.25rem' }}>
            <div style={{ fontSize: '.78rem', color: 'var(--slate)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: '.75rem' }}>
              {format(current, 'MMMM')} — {monthTasks.length} Filing{monthTasks.length !== 1 ? 's' : ''}
            </div>
            {monthTasks.length === 0 ? (
              <p style={{ color: 'var(--slate)', fontSize: '.85rem' }}>No filings this month.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '.6rem' }}>
                {monthTasks.map(t => {
                  const due  = toDate(t.dueDate);
                  const OD   = isBefore(due, now) && t.status !== 'completed';
                  return (
                    <div key={t.id} style={{
                      padding: '.75rem',
                      background: 'var(--navy-light)',
                      borderRadius: 'var(--radius-sm)',
                      borderLeft: `3px solid ${OD ? '#e87070' : t.status === 'completed' ? '#4ecca3' : 'var(--gold)'}`,
                    }}>
                      <div style={{ fontSize: '.85rem', color: 'var(--cream)', marginBottom: '.2rem', fontWeight: 500 }}>
                        {t.description || t.type}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '.72rem', color: 'var(--slate)' }}>
                          {t.period} · {format(due, 'dd MMM')}
                        </span>
                        <span className={`badge badge-${getStatusColor(OD ? 'overdue' : t.status)}`} style={{ fontSize: '.65rem', padding: '.15rem .5rem' }}>
                          {friendlyStatus(OD ? 'overdue' : t.status)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Legend */}
          <div className="card" style={{ padding: '1rem 1.25rem' }}>
            <div style={{ fontSize: '.78rem', color: 'var(--slate)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: '.75rem' }}>
              Legend
            </div>
            {[
              { color: '#4ecca3', label: 'Filed / Completed' },
              { color: '#6fa9e8', label: 'In Progress' },
              { color: '#e8a83a', label: 'Pending' },
              { color: '#e87070', label: 'Overdue' },
            ].map(({ color, label }) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '.6rem', marginBottom: '.4rem', fontSize: '.82rem', color: 'var(--slate-light)' }}>
                <div style={{ width: 10, height: 10, borderRadius: 3, background: color, flexShrink: 0 }} />
                {label}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function DayTask({ task }) {
  const now = new Date();
  const due = toDate(task.dueDate);
  const OD  = isBefore(due, now) && task.status !== 'completed';
  const status = OD ? 'overdue' : task.status;

  const colorMap = {
    completed:   '#4ecca3',
    'in-progress': '#6fa9e8',
    pending:     '#e8a83a',
    overdue:     '#e87070',
  };
  const c = colorMap[status] || '#8a9bb5';

  return (
    <div style={{
      fontSize: '.65rem',
      background: `${c}22`,
      color: c,
      borderRadius: 3,
      padding: '.1rem .3rem',
      marginBottom: '.1rem',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
    }}>
      {task.type?.toUpperCase()} · {task.period || task.description?.slice(0, 8)}
    </div>
  );
}

function toDate(val) {
  if (!val) return null;
  if (val.toDate) return val.toDate();
  return new Date(val);
}
