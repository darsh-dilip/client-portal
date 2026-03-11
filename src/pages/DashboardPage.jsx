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
  { key: 'completed',   label: 'Filed',       color: '#4ecca3', bg: 'rgba(78,204,163,.09)',  border: 'rgba(78,204,163,.25)'  },
  { key: 'overdue',     label: 'Overdue',      color: '#e87070', bg: 'rgba(232,112,112,.09)', border: 'rgba(232,112,112,.25)' },
  { key: 'in-progress', label: 'In Progress',  color: '#9b72cf', bg: 'rgba(155,114,207,.09)', border: 'rgba(155,114,207,.25)' },
  { key: 'pending',     label: 'Pending',      color: '#c9a84c', bg: 'rgba(201,168,76,.09)',  border: 'rgba(201,168,76,.25)'  },
];

// ── Score ring ─────────────────────────────────────────────────────────────
function ScoreRing({ score }) {
  const { grade, color } = scoreToGrade(score);
  const r = 44, circ = 2 * Math.PI * r, dash = ((score || 0) / 100) * circ;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', background: 'var(--navy-mid)', border: '1px solid rgba(201,168,76,.1)', borderRadius: 'var(--radius-lg)', padding: '1rem 1.25rem' }}>
      <svg width={104} height={104} viewBox="0 0 104 104">
        <circle cx={52} cy={52} r={r} fill="none" stroke="rgba(255,255,255,.07)" strokeWidth={9} />
        <circle cx={52} cy={52} r={r} fill="none" stroke={color} strokeWidth={9}
          strokeDasharray={`${dash} ${circ - dash}`} strokeLinecap="round" transform="rotate(-90 52 52)" />
        <text x={52} y={49} textAnchor="middle" fill={color} fontSize={22} fontWeight={700} fontFamily="var(--font-display)">{score ?? '—'}</text>
        <text x={52} y={62} textAnchor="middle" fill="var(--slate)" fontSize={8} letterSpacing={1}>OUT OF 100</text>
      </svg>
      <div>
        <div style={{ fontSize: '.65rem', color: 'var(--slate)', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: '.2rem' }}>Compliance Score</div>
        <div style={{ fontSize: '1.6rem', fontFamily: 'var(--font-display)', color }}>Grade {grade}</div>
      </div>
    </div>
  );
}

// ── Assignee card ──────────────────────────────────────────────────────────
function AssigneeCard({ assignedTo }) {
  const staff = useUser(assignedTo);
  const [show, setShow] = useState(false);
  if (!assignedTo) return null;
  return (
    <div style={{ background: 'var(--navy-mid)', border: '1px solid rgba(201,168,76,.1)', borderRadius: 'var(--radius-lg)', padding: '.85rem 1.1rem' }}>
      <div style={{ fontSize: '.62rem', color: 'var(--slate)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: '.5rem' }}>Your CA</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '.65rem' }}>
        <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'linear-gradient(135deg,#1e3050,#3a7bd5)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '.72rem', fontWeight: 700, color: '#fff', flexShrink: 0 }}>
          {staff?.init || (staff?.name?.[0] || 'CA').toUpperCase()}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: '.88rem', color: 'var(--cream)', fontWeight: 600 }}>{staff?.name || 'Your CA'}</div>
          <div style={{ fontSize: '.7rem', color: 'var(--slate)', textTransform: 'capitalize' }}>{staff?.role || ''}</div>
        </div>
        <button onClick={() => setShow(v => !v)}
          style={{ background: 'rgba(201,168,76,.1)', border: '1px solid rgba(201,168,76,.2)', borderRadius: 7, padding: '4px 10px', color: 'var(--gold)', cursor: 'pointer', fontSize: '.7rem', whiteSpace: 'nowrap' }}>
          {show ? 'Hide' : 'Contact'}
        </button>
      </div>
      {show && (
        <div style={{ marginTop: '.65rem', paddingTop: '.65rem', borderTop: '1px solid rgba(255,255,255,.06)', display: 'flex', flexDirection: 'column', gap: '.35rem' }}>
          {staff?.email && <a href={`mailto:${staff.email}`} style={{ display: 'flex', alignItems: 'center', gap: '.4rem', color: 'var(--slate-light)', fontSize: '.78rem', textDecoration: 'none' }}><Mail size={12} style={{ color: 'var(--gold)' }} />{staff.email}</a>}
          {staff?.phone && <a href={`tel:${staff.phone}`}   style={{ display: 'flex', alignItems: 'center', gap: '.4rem', color: 'var(--slate-light)', fontSize: '.78rem', textDecoration: 'none' }}><Phone size={12} style={{ color: 'var(--gold)' }} />{staff.phone}</a>}
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
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.75)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }} onClick={onClose}>
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

// ── Full-style calendar (same as CalendarPage) ─────────────────────────────
const DOW = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
const STATUS_COLOR = { completed: '#4ecca3', 'in-progress': '#9b72cf', pending: '#e8a83a', overdue: '#e87070' };

function DashboardCalendar({ tasks }) {
  const [current, setCurrent] = useState(new Date(now.getFullYear(), now.getMonth(), 1));
  const navigate = useNavigate();
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

  return (
    <div style={{ background: 'var(--navy-mid)', border: '1px solid rgba(201,168,76,.1)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
      {/* Nav */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '.85rem 1.1rem', borderBottom: '1px solid rgba(201,168,76,.1)' }}>
        <button onClick={() => setCurrent(d => subMonths(d, 1))} style={{ background: 'none', border: 'none', color: 'var(--slate)', cursor: 'pointer' }}><ChevronLeft size={16}/></button>
        <div style={{ fontSize: '.95rem', fontFamily: 'var(--font-display)', color: 'var(--cream)', fontWeight: 600 }}>{format(current, 'MMMM yyyy')}</div>
        <button onClick={() => setCurrent(d => addMonths(d, 1))} style={{ background: 'none', border: 'none', color: 'var(--slate)', cursor: 'pointer' }}><ChevronRight size={16}/></button>
      </div>

      {/* DOW headers */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', borderBottom: '1px solid rgba(255,255,255,.05)' }}>
        {DOW.map(d => <div key={d} style={{ padding: '.4rem', textAlign: 'center', fontSize: '.65rem', color: 'var(--slate)', fontWeight: 600, letterSpacing: '.04em' }}>{d}</div>)}
      </div>

      {/* Day grid — identical rendering to CalendarPage */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)' }}>
        {Array.from({ length: padStart }).map((_, i) => (
          <div key={`p${i}`} style={{ minHeight: 72, borderRight: '1px solid rgba(255,255,255,.03)' }} />
        ))}
        {days.map((day, i) => {
          const key      = format(day, 'yyyy-MM-dd');
          const dayTasks = taskMap[key] || [];
          const today    = isToday(day);
          const past     = isBefore(day, now) && !today;
          const col      = (padStart + i) % 7;

          return (
            <div key={key}
              onClick={() => dayTasks.length && navigate('/calendar')}
              style={{
                minHeight: 72, padding: '.35rem .4rem',
                borderTop: '1px solid rgba(255,255,255,.03)',
                borderRight: col < 6 ? '1px solid rgba(255,255,255,.03)' : 'none',
                background: today ? 'rgba(201,168,76,.06)' : 'transparent',
                cursor: dayTasks.length ? 'pointer' : 'default',
              }}>
              <div style={{ fontSize: '.75rem', fontWeight: today ? 700 : 400, color: today ? 'var(--gold)' : past ? 'rgba(138,155,181,.4)' : 'var(--slate-light)', marginBottom: '.2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                {format(day, 'd')}
                {today && <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--gold)', display: 'block' }} />}
              </div>
              {dayTasks.slice(0, 3).map(t => {
                const eff = getEffectiveStatus(t);
                const c   = STATUS_COLOR[eff] || '#8a9bb5';
                const tc  = TYPE_COLOR[t.type] || '#8a9bb5';
                return (
                  <div key={t.id} title={`${t.description || t.service} · ${formatRawStatus(t.status)}`}
                    style={{ fontSize: '.58rem', background: `${c}1a`, color: c, borderLeft: `2px solid ${tc}`, borderRadius: '0 3px 3px 0', padding: '.1rem .3rem', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {t.type} · {t.period || (t.description || '').slice(0,10)}
                  </div>
                );
              })}
              {dayTasks.length > 3 && <div style={{ fontSize: '.52rem', color: 'var(--slate)' }}>+{dayTasks.length - 3}</div>}
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

  const lineData = useMemo(() => {
    const m = {};
    tasks.filter(t => getEffectiveStatus(t) === 'completed').forEach(t => {
      if (!t.dueDate) return;
      const key = format(toDate(t.dueDate), 'MMM yy');
      m[key] = (m[key] || 0) + 1;
    });
    return Object.entries(m).map(([name, count]) => ({ name, count })).slice(-8);
  }, [tasks]);

  const pieData = useMemo(() => {
    const m = {};
    tasks.forEach(t => { const k = t.type || 'OTHER'; m[k] = (m[k] || 0) + 1; });
    return Object.entries(m).filter(([, v]) => v > 0).map(([name, value]) => ({ name, value }));
  }, [tasks]);

  const upcoming = useMemo(() => {
    const cutoff = new Date(); cutoff.setDate(cutoff.getDate() + 30);
    return tasks
      .filter(t => { if (!t.dueDate) return false; const d = toDate(t.dueDate); return d >= now && d <= cutoff && getEffectiveStatus(t) !== 'completed'; })
      .sort((a, b) => toDate(a.dueDate) - toDate(b.dueDate)).slice(0, 6);
  }, [tasks]);

  return (
    <div className="fade-up">
      {/* Header */}
      <div style={{ marginBottom: '1.1rem' }}>
        <h1 style={{ fontSize: '1.55rem', color: 'var(--cream)' }}>Good day, {client?.name?.split(' ')[0] || 'there'}</h1>
        <p style={{ fontSize: '.78rem', color: 'var(--slate)', marginTop: '.1rem' }}>
          Here's your compliance overview · {now.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
      </div>

      {/* ── Main row: LEFT panel | RIGHT calendar ────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '1.1rem', marginBottom: '1.1rem' }}>

        {/* LEFT: 2x2 tiles + score + CA */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '.85rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.75rem' }}>
            {TILE_CFG.map(cfg => (
              <button key={cfg.key} onClick={() => setModalCfg(cfg)}
                style={{ padding: '.85rem', background: cfg.bg, border: `1px solid ${cfg.border}`, borderRadius: 'var(--radius-md)', textAlign: 'left', cursor: 'pointer', transition: 'transform .15s' }}
                onMouseOver={e => e.currentTarget.style.transform = 'scale(1.04)'}
                onMouseOut={e => e.currentTarget.style.transform = ''}>
                <div style={{ fontSize: '.6rem', color: 'var(--slate)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: '.25rem' }}>{cfg.label}</div>
                <div style={{ fontSize: '2rem', fontFamily: 'var(--font-display)', color: cfg.color }}>{counts[cfg.key] || 0}</div>
              </button>
            ))}
          </div>
          <ScoreRing score={score} />
          <AssigneeCard assignedTo={client?.assignedTo} />
        </div>

        {/* RIGHT: Full calendar */}
        <DashboardCalendar tasks={tasks} />
      </div>

      {/* ── Charts ───────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '1.1rem', marginBottom: '1.1rem' }}>
        <div style={{ background: 'var(--navy-mid)', border: '1px solid rgba(201,168,76,.1)', borderRadius: 'var(--radius-lg)', padding: '1rem' }}>
          <div style={{ fontSize: '.68rem', color: 'var(--slate)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: '.65rem' }}>Filings Completed</div>
          {lineData.length === 0
            ? <div style={{ height: 130, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--slate)', fontSize: '.82rem' }}>No filed tasks yet</div>
            : <ResponsiveContainer width="100%" height={130}>
                <LineChart data={lineData} margin={{ top: 4, right: 8, bottom: 0, left: -28 }}>
                  <XAxis dataKey="name" tick={{ fill: 'var(--slate)', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: 'var(--slate)', fontSize: 10 }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip contentStyle={{ background: '#0f1c2e', border: '1px solid rgba(201,168,76,.2)', borderRadius: 8, fontSize: '.76rem' }} labelStyle={{ color: '#e8dfc8' }} itemStyle={{ color: '#c9a84c' }} />
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
              <Tooltip contentStyle={{ background: '#0f1c2e', border: '1px solid rgba(201,168,76,.2)', borderRadius: 8, fontSize: '.76rem' }} />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.5rem', justifyContent: 'center', marginTop: '.35rem' }}>
            {pieData.map(e => (
              <div key={e.name} style={{ display: 'flex', alignItems: 'center', gap: '.25rem', fontSize: '.67rem', color: 'var(--slate)' }}>
                <div style={{ width: 7, height: 7, borderRadius: '50%', background: TYPE_COLOR[e.name] || '#8a9bb5' }} />{e.name} ({e.value})
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Due next 30 days ─────────────────────────────────── */}
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
                  <div style={{ width: 30, height: 30, borderRadius: 7, background: `${col}1a`, border: `1px solid ${col}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '.62rem', fontWeight: 700, color: col, flexShrink: 0 }}>{days}d</div>
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
