import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import { format, isAfter, isBefore, addDays } from 'date-fns';
import {
  CheckCircle2, Clock, AlertTriangle, FileText,
  ChevronRight, TrendingUp, Receipt, AlignLeft, Calendar
} from 'lucide-react';
import ComplianceScore from '../components/ComplianceScore';
import { calcComplianceScore, getStatusColor, friendlyStatus } from '../utils/compliance';

const TYPE_COLORS = {
  GST: '#c9a84c',
  IT:  '#3a7bd5',
  TDS: '#2a9d68',
  other: '#8a9bb5',
};

export default function DashboardPage({ tasks, client }) {
  const score = useMemo(() => calcComplianceScore(tasks), [tasks]);
  const now   = new Date();

  // ── Summary counts ─────────────────────────────────────────
  const summary = useMemo(() => {
    let completed = 0, pending = 0, overdue = 0, inProgress = 0;
    tasks.forEach(t => {
      const due = toDate(t.dueDate);
      const isOD = isBefore(due, now) && t.status !== 'completed';
      if (t.status === 'completed')   completed++;
      else if (isOD)                  overdue++;
      else if (t.status === 'in-progress') inProgress++;
      else                            pending++;
    });
    return { completed, pending, overdue, inProgress, total: tasks.length };
  }, [tasks]);

  // ── Upcoming tasks (next 30 days) ──────────────────────────
  const upcoming = useMemo(() => {
    const soon = addDays(now, 30);
    return tasks
      .filter(t => {
        if (t.status === 'completed') return false;
        const d = toDate(t.dueDate);
        return isAfter(d, now) && isBefore(d, soon);
      })
      .sort((a, b) => toDate(a.dueDate) - toDate(b.dueDate))
      .slice(0, 5);
  }, [tasks]);

  // ── Overdue tasks ──────────────────────────────────────────
  const overdueList = useMemo(() => {
    return tasks.filter(t => {
      const d = toDate(t.dueDate);
      return isBefore(d, now) && t.status !== 'completed';
    }).sort((a, b) => toDate(a.dueDate) - toDate(b.dueDate));
  }, [tasks]);

  // ── Pie data ──────────────────────────────────────────────
  const pieData = useMemo(() => {
    const map = {};
    tasks.forEach(t => {
      const k = (t.type || 'other').toUpperCase();
      map[k] = (map[k] || 0) + 1;
    });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [tasks]);

  // ── Bar data by month ──────────────────────────────────────
  const barData = useMemo(() => {
    const map = {};
    tasks.filter(t => t.status === 'completed').forEach(t => {
      const d = toDate(t.filedDate || t.dueDate);
      const key = format(d, 'MMM yy');
      map[key] = (map[key] || 0) + 1;
    });
    return Object.entries(map).slice(-6).map(([month, count]) => ({ month, count }));
  }, [tasks]);

  if (!tasks.length) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--slate)' }}>
        <FileText size={40} style={{ margin: '0 auto 1rem', opacity: .4 }} />
        <p>No compliance data available yet.</p>
      </div>
    );
  }

  return (
    <div>
      {/* ── Page header ─────────────────────────────────────── */}
      <div className="fade-up" style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.8rem', color: 'var(--cream)', marginBottom: '.3rem' }}>
          Good day, {client?.name?.split(' ')[0] || 'Client'}
        </h1>
        <p style={{ color: 'var(--slate)', fontSize: '.9rem' }}>
          Here's your compliance overview · {format(now, 'dd MMMM yyyy')}
        </p>
      </div>

      {/* ── Top row: Score + Summary cards ──────────────────── */}
      <div className="fade-up fade-up-1" style={{
        display: 'grid',
        gridTemplateColumns: 'auto 1fr',
        gap: '1.5rem',
        marginBottom: '1.5rem',
        alignItems: 'stretch',
      }}>
        {/* Score ring */}
        <div className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem 2.5rem' }}>
          <ComplianceScore score={score} />
        </div>

        {/* Summary cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
          <SummaryCard
            icon={<CheckCircle2 size={20} />}
            label="Filed"
            value={summary.completed}
            color="#4ecca3"
            bg="var(--green-bg)"
          />
          <SummaryCard
            icon={<AlertTriangle size={20} />}
            label="Overdue"
            value={summary.overdue}
            color="#e87070"
            bg="var(--red-bg)"
          />
          <SummaryCard
            icon={<Clock size={20} />}
            label="In Progress"
            value={summary.inProgress}
            color="#6fa9e8"
            bg="var(--blue-bg)"
          />
          <SummaryCard
            icon={<FileText size={20} />}
            label="Pending"
            value={summary.pending}
            color="#e8a83a"
            bg="var(--amber-bg)"
          />
        </div>
      </div>

      {/* ── Overdue alert ────────────────────────────────────── */}
      {overdueList.length > 0 && (
        <div className="fade-up fade-up-2" style={{
          background: 'var(--red-bg)',
          border: '1px solid rgba(201,76,76,.3)',
          borderRadius: 'var(--radius-md)',
          padding: '1rem 1.25rem',
          marginBottom: '1.5rem',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '.75rem',
        }}>
          <AlertTriangle size={18} color="#e87070" style={{ flexShrink: 0, marginTop: '.15rem' }} />
          <div>
            <div style={{ color: '#e87070', fontWeight: 600, marginBottom: '.2rem', fontSize: '.88rem' }}>
              {overdueList.length} Overdue Filing{overdueList.length > 1 ? 's' : ''} — Action Required
            </div>
            <div style={{ color: '#c87070', fontSize: '.8rem', lineHeight: 1.6 }}>
              {overdueList.slice(0, 3).map(t => (
                <span key={t.id} style={{ marginRight: '.5rem' }}>
                  {t.description || t.type} ({t.period})
                </span>
              ))}
              {overdueList.length > 3 && <span>+{overdueList.length - 3} more</span>}
            </div>
          </div>
        </div>
      )}

      {/* ── Charts row ───────────────────────────────────────── */}
      <div className="fade-up fade-up-3" style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '1.5rem',
        marginBottom: '1.5rem',
      }}>
        {/* Bar chart */}
        <div className="card">
          <div style={{ fontSize: '.82rem', color: 'var(--slate)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: '1rem' }}>
            Filings Completed (Last 6 Months)
          </div>
          {barData.length ? (
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={barData} barSize={22}>
                <XAxis dataKey="month" tick={{ fill: '#8a9bb5', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#8a9bb5', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: 'var(--navy-light)', border: 'none', borderRadius: 8, fontSize: 12 }} />
                <Bar dataKey="count" fill="var(--gold)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ height: 160, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--slate)', fontSize: '.85rem' }}>
              No data yet
            </div>
          )}
        </div>

        {/* Pie chart */}
        <div className="card">
          <div style={{ fontSize: '.82rem', color: 'var(--slate)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: '1rem' }}>
            Filings by Type
          </div>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={40} outerRadius={65} dataKey="value" paddingAngle={3}>
                {pieData.map((entry, i) => (
                  <Cell key={entry.name} fill={TYPE_COLORS[entry.name] || TYPE_COLORS.other} />
                ))}
              </Pie>
              <Legend
                iconType="circle"
                iconSize={8}
                formatter={(v) => <span style={{ color: 'var(--slate-light)', fontSize: 11 }}>{v}</span>}
              />
              <Tooltip contentStyle={{ background: 'var(--navy-light)', border: 'none', borderRadius: 8, fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Upcoming due ─────────────────────────────────────── */}
      <div className="fade-up fade-up-4">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <h2 style={{ fontSize: '1.1rem', color: 'var(--cream)' }}>Due in Next 30 Days</h2>
          <Link to="/calendar" style={{ fontSize: '.82rem', color: 'var(--gold)', display: 'flex', alignItems: 'center', gap: '.25rem' }}>
            Full Calendar <ChevronRight size={14} />
          </Link>
        </div>

        {upcoming.length === 0 ? (
          <div className="card" style={{ color: 'var(--slate)', fontSize: '.88rem', textAlign: 'center' }}>
            🎉 No upcoming due dates in the next 30 days
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '.6rem' }}>
            {upcoming.map(task => {
              const due  = toDate(task.dueDate);
              const days = Math.ceil((due - now) / 86400000);
              const urgent = days <= 7;
              return (
                <div key={task.id} className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem 1.25rem' }}>
                  <div style={{
                    width: 42, height: 42,
                    background: urgent ? 'var(--amber-bg)' : 'var(--navy-light)',
                    borderRadius: 'var(--radius-sm)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                    fontSize: '.72rem', fontWeight: 700,
                    color: urgent ? '#e8a83a' : 'var(--slate)',
                    lineHeight: 1.2,
                    textAlign: 'center',
                  }}>
                    {days}d
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 500, color: 'var(--cream)', fontSize: '.9rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {task.description || task.type}
                    </div>
                    <div style={{ fontSize: '.78rem', color: 'var(--slate)', marginTop: '.15rem' }}>
                      {task.period} · Due {format(due, 'dd MMM yyyy')}
                    </div>
                  </div>
                  <TypeBadge type={task.type} />
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function SummaryCard({ icon, label, value, color, bg }) {
  return (
    <div className="card" style={{ padding: '1.25rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem', marginBottom: '.5rem' }}>
        <div style={{ color, background: bg, padding: '.5rem', borderRadius: 8 }}>
          {icon}
        </div>
        <div style={{ fontSize: '.78rem', color: 'var(--slate)', textTransform: 'uppercase', letterSpacing: '.05em' }}>
          {label}
        </div>
      </div>
      <div style={{ fontSize: '2rem', fontFamily: 'var(--font-display)', color }}>
        {value}
      </div>
    </div>
  );
}

function TypeBadge({ type }) {
  const t = (type || '').toUpperCase();
  const colorMap = { GST: 'amber', IT: 'blue', TDS: 'green' };
  return <span className={`badge badge-${colorMap[t] || 'slate'}`}>{t || 'OTHER'}</span>;
}

function toDate(val) {
  if (!val) return new Date(0);
  if (val.toDate) return val.toDate();
  return new Date(val);
}
