import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { ChevronLeft, ChevronRight, X, Phone, Mail } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, addMonths, subMonths, isBefore } from 'date-fns';
import { calcComplianceScore, scoreToGrade, getEffectiveStatus, formatRawStatus, toDate } from '../utils/compliance';
import { useUser } from '../hooks/useUser';

const now = new Date();
const TYPE_COLOR = { GST: '#c9a84c', IT: '#6fa9e8', TDS: '#4ecca3', OTHER: '#8a9bb5' };
const EFF_COLOR  = { completed: '#4ecca3', 'in-progress': '#9b72cf', pending: '#e8a83a', overdue: '#e87070' };

const TILE_CFG = [
  { key: 'completed',    label: 'Filed',       color: '#4ecca3', bg: 'rgba(78,204,163,.09)',  border: 'rgba(78,204,163,.25)'  },
  { key: 'overdue',      label: 'Overdue',      color: '#e87070', bg: 'rgba(232,112,112,.09)', border: 'rgba(232,112,112,.25)' },
  { key: 'in-progress',  label: 'In Progress',  color: '#9b72cf', bg: 'rgba(155,114,207,.09)', border: 'rgba(155,114,207,.25)' },
  { key: 'pending',      label: 'Pending',      color: '#c9a84c', bg: 'rgba(201,168,76,.09)',  border: 'rgba(201,168,76,.25)'  },
];

// ── Score ring ─────────────────────────────────────────────────────────────
function ScoreRing({ score }) {
  const { grade, color } = scoreToGrade(score);
  const r = 46, circ = 2 * Math.PI * r, dash = ((score || 0) / 100) * circ;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '.2rem' }}>
      <svg width={110} height={110} viewBox="0 0 110 110">
        <circle cx={55} cy={55} r={r} fill="none" stroke="rgba(255,255,255,.07)" strokeWidth={9} />
        <circle cx={55} cy={55} r={r} fill="none" stroke={color} strokeWidth={9}
          strokeDasharray={`${dash} ${circ - dash}`} strokeLinecap="round" transform="rotate(-90 55 55)" />
        <text x={55} y={52} textAnchor="middle" fill={color} fontSize={22} fontWeight={700} fontFamily="var(--font-display)">{score ?? '—'}</text>
        <text x={55} y={65} textAnchor="middle" fill="var(--slate)" fontSize={8} letterSpacing={1}>OUT OF 100</text>
      </svg>
      <div style={{ fontSize: '.6rem', color: 'var(--slate)', textTransform: 'uppercase', letterSpacing: '.08em' }}>Compliance Score</div>
      <div style={{ fontSize: '1rem', fontFamily: 'var(--font-display)', color }}>Grade {grade}</div>
    </div>
  );
}

// ── Assignee card ──────────────────────────────────────────────────────────
function AssigneeCard({ assignedTo }) {
  const staff = useUser(assignedTo);
  const [show, setShow] = useState(false);
  if (!assignedTo) return null;
  return (
    <div style={{ background: 'var(--navy-light)', border: '1px solid rgba(255,255,255,.06)', borderRadius: 'var(--radius-md)', padding: '.7rem .85rem' }}>
      <div style={{ fontSize: '.6rem', color: 'var(--slate)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: '.45rem' }}>Your CA</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '.6rem' }}>
        <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'linear-gradient(135deg,#1e3050,#3a7bd5)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '.68rem', fontWeight: 700, color: '#fff', flexShrink: 0 }}>
          {staff?.init || (staff?.name?.[0] || 'CA').toUpperCase()}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: '.83rem', color: 'var(--cream)', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{staff?.name || 'Your CA'}</div>
          <div style={{ fontSize: '.68rem', color: 'var(--slate)', textTransform: 'capitalize' }}>{staff?.role || ''}</div>
        </div>
        <button onClick={() => setShow(v => !v)}
          style={{ background: 'rgba(201,168,76,.1)', border: '1px solid rgba(201,168,76,.2)', borderRadius: 6, padding: '3px 8px', color: 'var(--gold)', cursor: 'pointer', fontSize: '.68rem' }}>
          {show ? 'Hide' : 'Contact'}
        </button>
      </div>
      {show && (
        <div style={{ marginTop: '.6rem', paddingTop: '.6rem', borderTop: '1px solid rgba(255,255,255,.06)', display: 'flex', flexDirection: 'column', gap: '.3rem' }}>
          {staff?.email && <a href={`mailto:${staff.email}`} style={{ display: 'flex', alignItems: 'center', gap: '.4rem', color: 'var(--slate-light)', fontSize: '.78rem', textDecoration: 'none' }}><Mail size={11} style={{ color: 'var(--gold)' }} />{staff.email}</a>}
          {staff?.phone && <a href={`tel:${staff.phone}`}   style={{ display: 'flex', alignItems: 'center', gap: '.4rem', color: 'var(--slate-light)', fontSize: '.78rem', textDecoration: 'none' }}><Phone size={11} style={{ color: 'var(--gold)' }} />{staff.phone}</a>}
          {!staff?.email && !staff?.phone && <div style={{ fontSize: '.75rem', color: 'var(--slate)' }}>No contact info on file.</div>}
        </div>
      )}
    </div>
  );
}

// ── Task modal (for clickable tiles) ──────────────────────────────────────
function TaskModal({ cfg, tasks, onClose }) {
  const matching = tasks.filter(t => getEffectiveStatus(t) === cfg.key);
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.72)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }} onClick={onClose}>
      <div style={{ background: 'var(--navy-mid)', border: `1px solid ${cfg.border}`, borderRadius: 'var(--radius-xl)', width: '100%', maxWidth: 500, maxHeight: '76vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }} onClick={e => e.stopPropagation()}>
        <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid rgba(255,255,255,.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontSize: '.95rem', color: cfg.color, fontWeight: 600 }}>{cfg.label} <span style={{ color: 'var(--slate)', fontWeight: 400 }}>({matching.length})</span></div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--slate)', cursor: 'pointer' }}><X size={16} /></button>
        </div>
        <div style={{ overflowY: 'auto', flex: 1 }}>
          {matching.length === 0
            ? <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--slate)' }}>No tasks.</div>
            : matching.map(t => (
              <div key={t.id} style={{ padding: '.7rem 1.25rem', borderBottom: '1px solid rgba(255,255,255,.04)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '.75rem' }}>
                <div>
                  <div style={{ fontSize: '.85rem', color: 'var(--cream)', fontWeight: 500 }}>{t.description || t.service}</div>
                  <div style={{ fontSize: '.7rem', color: 'var(--slate)', marginTop: '.1rem' }}>{t.period} · Due: {t.dueDate || '—'}</div>
                </div>
                <span style={{ fontSize: '.62rem', fontWeight: 600, color: cfg.color, background: cfg.bg, border: `1px solid ${cfg.border}`, borderRadius: 99, padding: '2px 8px', whiteSpace: 'nowrap' }}>{t.type}</span>
              </div>
            ))
          }
        </div>
      </div>
    </div>
  );
}

// ── Mini calendar ──────────────────────────────────────────────────────────
function MiniCalendar({ tasks }) {
  const [current, setCurrent] = useState(new Date(now.getFullYear(), now.getMonth(), 1));
  const navigate = useNavigate();
  const year = current.getFullYear(), month = current.getMonth();
  const start    = startOfMonth(current);
  const days     = eachDayOfInterval({ start, end: endOfMonth(current) });
  const padStart = start.getDay();

  const taskMap = useMemo(() => {
    const m = {};
    tasks.forEach(t => {
      if (!t.dueDate) return;
      const d = toDate(t.dueDate);
      if (!isSameMonth(d, current)) return;
      const k = format(d, 'yyyy-MM-dd');
      if (!m[k]) m[k] = [];
      m[k].push(t);
    });
    return m;
  }, [tasks, current]);

  const [hoverDay, setHoverDay] = useState(null);
  const DOW = ['Su','Mo','Tu','We','Th','Fr','Sa'];

  return (
    <div style={{ background: 'var(--navy-mid)', border: '1px solid rgba(201,168,76,.1)', borderRadius: 'var(--radius-lg)', padding: '1rem', height: '100%', boxSizing: 'border-box' }}>
      {/* Nav */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '.75rem' }}>
        <button onClick={() => setCurrent(d => subMonths(d, 1))} style={{ background: 'none', border: 'none', color: 'var(--slate)', cursor: 'pointer' }}><ChevronLeft size={15} /></button>
        <div style={{ fontSize: '.9rem', fontWeight: 600, color: 'var(--cream)', fontFamily: 'var(--font-display)' }}>{format(current, 'MMMM yyyy')}</div>
        <button onClick={() => setCurrent(d => addMonths(d, 1))} style={{ background: 'none', border: 'none', color: 'var(--slate)', cursor: 'pointer' }}><ChevronRight size={15} /></button>
      </div>

      {/* DOW headers */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', marginBottom: '.2rem' }}>
        {DOW.map(d => <div key={d} style={{ textAlign: 'center', fontSize: '.6rem', color: 'var(--slate)', fontWeight: 600, padding: '.15rem 0' }}>{d}</div>)}
      </div>

      {/* Days */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 2, position: 'relative' }}>
        {Array.from({ length: padStart }).map((_, i) => <div key={`e${i}`} />)}
        {days.map((day, i) => {
          const key      = format(day, 'yyyy-MM-dd');
          const dayTasks = taskMap[key] || [];
          const today    = isToday(day);
          const past     = isBefore(day, now) && !today;
          const hasTasks = dayTasks.length > 0;

          return (
            <div key={key} style={{ position: 'relative' }}
              onMouseEnter={() => hasTasks && setHoverDay(key)}
              onMouseLeave={() => setHoverDay(null)}
              onClick={() => hasTasks && navigate('/calendar')}>
              <div style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                padding: '3px 1px', borderRadius: 6, cursor: hasTasks ? 'pointer' : 'default',
                background: today ? 'rgba(201,168,76,.15)' : 'transparent',
                border: today ? '1px solid rgba(201,168,76,.3)' : '1px solid transparent',
              }}>
                <span style={{ fontSize: '.7rem', color: today ? 'var(--gold)' : past ? 'rgba(138,155,181,.5)' : 'var(--slate-light)', fontWeight: today ? 700 : 400 }}>{format(day, 'd')}</span>
                {hasTasks && (
                  <div style={{ display: 'flex', gap: 2, marginTop: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
                    {dayTasks.slice(0, 3).map((t, ti) => (
                      <div key={ti} style={{ width: 5, height: 5, borderRadius: '50%', background: EFF_COLOR[getEffectiveStatus(t)] || '#8a9bb5' }} />
                    ))}
                    {dayTasks.length > 3 && <div style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--slate)' }} />}
                  </div>
                )}
              </div>

              {/* Hover tooltip */}
              {hoverDay === key && (
                <div style={{ position: 'absolute', top: '100%', left: '50%', transform: 'translateX(-50%)', zIndex: 50, background: 'var(--navy-mid)', border: '1px solid rgba(201,168,76,.2)', borderRadius: 8, padding: '.5rem .75rem', minWidth: 170, boxShadow: '0 8px 24px rgba(0,0,0,.6)', marginTop: 4 }}>
                  {dayTasks.map(t => (
                    <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: '.4rem', padding: '2px 0', fontSize: '.7rem' }}>
                      <div style={{ width: 6, height: 6, borderRadius: '50%', background: EFF_COLOR[getEffectiveStatus(t)] || '#8a9bb5', flexShrink: 0 }} />
                      <span style={{ color: 'var(--cream)' }}>{t.description || t.service}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Main Dashboard ─────────────────────────────────────────────────────────
export default function DashboardPage({ tasks, client }) {
  const [modalCfg, setModalCfg] = useState(null);

  const counts = useMemo(() => {
    const m = { completed: 0, overdue: 0, 'in-progress': 0, pending: 0 };
    tasks.forEach(t => { const e = getEffectiveStatus(t); m[e] = (m[e] || 0) + 1; });
    return m;
  }, [tasks]);

  const score = useMemo(() => calcComplianceScore(tasks), [tasks]);

  // Line chart — filed tasks by month
  const lineData = useMemo(() => {
    const m = {};
    tasks.filter(t => getEffectiveStatus(t) === 'completed').forEach(t => {
      if (!t.dueDate) return;
      const d   = toDate(t.dueDate);
      const key = format(d, 'MMM yy');
      m[key] = (m[key] || 0) + 1;
    });
    return Object.entries(m).map(([name, count]) => ({ name, count })).slice(-8);
  }, [tasks]);

  // Pie chart
  const pieData = useMemo(() => {
    const m = {};
    tasks.forEach(t => { const k = t.type || 'OTHER'; m[k] = (m[k] || 0) + 1; });
    return Object.entries(m).filter(([, v]) => v > 0).map(([name, value]) => ({ name, value }));
  }, [tasks]);

  // Due in next 30 days
  const upcoming = useMemo(() => {
    const cutoff = new Date(); cutoff.setDate(cutoff.getDate() + 30);
    return tasks
      .filter(t => { if (!t.dueDate) return false; const d = toDate(t.dueDate); return d >= now && d <= cutoff && getEffectiveStatus(t) !== 'completed'; })
      .sort((a, b) => toDate(a.dueDate) - toDate(b.dueDate))
      .slice(0, 6);
  }, [tasks]);

  return (
    <div className="fade-up">
      <div style={{ marginBottom: '1.1rem' }}>
        <h1 style={{ fontSize: '1.55rem', color: 'var(--cream)' }}>Good day, {client?.name?.split(' ')[0] || 'there'}</h1>
        <p style={{ fontSize: '.78rem', color: 'var(--slate)', marginTop: '.1rem' }}>
          Here's your compliance overview · {now.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
      </div>

      {/* ── Top row: Calendar | Right panel ─────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '1.1rem', marginBottom: '1.1rem' }}>

        {/* Mini calendar */}
        <MiniCalendar tasks={tasks} />

        {/* Right: 2x2 tiles + score + assignee */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '.75rem' }}>
          {/* 2x2 tiles */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.75rem' }}>
            {TILE_CFG.map(cfg => (
              <button key={cfg.key}
                onClick={() => setModalCfg(cfg)}
                style={{ padding: '.75rem .85rem', background: cfg.bg, border: `1px solid ${cfg.border}`, borderRadius: 'var(--radius-md)', textAlign: 'left', cursor: 'pointer', transition: 'transform .15s' }}
                onMouseOver={e => e.currentTarget.style.transform = 'scale(1.04)'}
                onMouseOut={e => e.currentTarget.style.transform = ''}>
                <div style={{ fontSize: '.6rem', color: 'var(--slate)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: '.2rem' }}>{cfg.label}</div>
                <div style={{ fontSize: '1.8rem', fontFamily: 'var(--font-display)', color: cfg.color }}>{counts[cfg.key] || 0}</div>
              </button>
            ))}
          </div>

          {/* Score */}
          <div style={{ background: 'var(--navy-mid)', border: '1px solid rgba(201,168,76,.1)', borderRadius: 'var(--radius-lg)', padding: '.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ScoreRing score={score} />
          </div>

          {/* Assignee */}
          <AssigneeCard assignedTo={client?.assignedTo} />
        </div>
      </div>

      {/* ── Charts row ───────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '1.1rem', marginBottom: '1.1rem' }}>
        <div style={{ background: 'var(--navy-mid)', border: '1px solid rgba(201,168,76,.1)', borderRadius: 'var(--radius-lg)', padding: '1rem' }}>
          <div style={{ fontSize: '.68rem', color: 'var(--slate)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: '.65rem' }}>Filings Completed</div>
          {lineData.length === 0
            ? <div style={{ height: 130, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--slate)', fontSize: '.82rem' }}>No filed tasks yet</div>
            : <ResponsiveContainer width="100%" height={130}>
                <LineChart data={lineData} margin={{ top: 4, right: 8, bottom: 0, left: -28 }}>
                  <XAxis dataKey="name" tick={{ fill: 'var(--slate)', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: 'var(--slate)', fontSize: 10 }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip contentStyle={{ background: 'var(--navy-mid)', border: '1px solid rgba(201,168,76,.2)', borderRadius: 8, fontSize: '.76rem' }} labelStyle={{ color: 'var(--cream)' }} itemStyle={{ color: 'var(--gold)' }} />
                  <Line type="monotone" dataKey="count" stroke="#c9a84c" strokeWidth={2} dot={{ fill: '#c9a84c', r: 3 }} activeDot={{ r: 5 }} />
                </LineChart>
              </ResponsiveContainer>
          }
        </div>

        <div style={{ background: 'var(--navy-mid)', border: '1px solid rgba(201,168,76,.1)', borderRadius: 'var(--radius-lg)', padding: '1rem' }}>
          <div style={{ fontSize: '.68rem', color: 'var(--slate)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: '.65rem' }}>Filings by Type</div>
          <ResponsiveContainer width="100%" height={110}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={32} outerRadius={52} dataKey="value" paddingAngle={3}>
                {pieData.map(e => <Cell key={e.name} fill={TYPE_COLOR[e.name] || '#8a9bb5'} />)}
              </Pie>
              <Tooltip contentStyle={{ background: 'var(--navy-mid)', border: '1px solid rgba(201,168,76,.2)', borderRadius: 8, fontSize: '.76rem' }} />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.5rem', justifyContent: 'center', marginTop: '.35rem' }}>
            {pieData.map(e => (
              <div key={e.name} style={{ display: 'flex', alignItems: 'center', gap: '.25rem', fontSize: '.67rem', color: 'var(--slate)' }}>
                <div style={{ width: 7, height: 7, borderRadius: '50%', background: TYPE_COLOR[e.name] || '#8a9bb5' }} />
                {e.name} ({e.value})
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Due in next 30 days ──────────────────────────────── */}
      {upcoming.length > 0 && (
        <div style={{ background: 'var(--navy-mid)', border: '1px solid rgba(201,168,76,.1)', borderRadius: 'var(--radius-lg)', padding: '1rem' }}>
          <div style={{ fontSize: '.68rem', color: 'var(--slate)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: '.75rem' }}>Due in Next 30 Days</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(190px,1fr))', gap: '.6rem' }}>
            {upcoming.map(t => {
              const d    = toDate(t.dueDate);
              const days = Math.ceil((d - now) / 86400000);
              const eff  = getEffectiveStatus(t);
              const col  = EFF_COLOR[eff] || '#8a9bb5';
              const tc   = TYPE_COLOR[t.type] || '#8a9bb5';
              return (
                <div key={t.id} style={{ background: 'rgba(255,255,255,.03)', border: `1px solid ${col}33`, borderRadius: 'var(--radius-md)', padding: '.65rem .8rem', display: 'flex', gap: '.55rem', alignItems: 'center' }}>
                  <div style={{ width: 30, height: 30, borderRadius: 7, background: `${col}1a`, border: `1px solid ${col}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '.62rem', fontWeight: 700, color: col, flexShrink: 0 }}>
                    {days}d
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: '.78rem', color: 'var(--cream)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.description || t.service}</div>
                    <div style={{ fontSize: '.65rem', color: 'var(--slate)', marginTop: '.1rem' }}>{t.period} · {t.dueDate}</div>
                  </div>
                  <div style={{ width: 3, height: 28, borderRadius: 2, background: tc, flexShrink: 0, marginLeft: 'auto' }} />
                </div>
              );
            })}
          </div>
        </div>
      )}

      {modalCfg && <TaskModal cfg={modalCfg} tasks={tasks} onClose={() => setModalCfg(null)} />}
    </div>
  );
}
