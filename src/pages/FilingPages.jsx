import React, { useMemo } from 'react';
import TaskTable from '../components/TaskTable';
import ComplianceScore from '../components/ComplianceScore';
import { calcComplianceScore } from '../utils/compliance';
import { Receipt } from 'lucide-react';

export function GSTPage({ tasks }) {
  const gstTasks = useMemo(() => tasks.filter(t => (t.type || '').toUpperCase() === 'GST'), [tasks]);
  const score    = useMemo(() => calcComplianceScore(gstTasks), [gstTasks]);

  return (
    <FilingPage
      icon={<Receipt size={22} color="var(--gold)" />}
      title="GST Filings"
      subtitle="GSTR-1, GSTR-3B, GSTR-9 and other GST returns"
      tasks={gstTasks}
      score={score}
      accentColor="var(--gold)"
    />
  );
}

export function ITPage({ tasks }) {
  const itTasks = useMemo(() => tasks.filter(t => (t.type || '').toUpperCase() === 'IT'), [tasks]);
  const score   = useMemo(() => calcComplianceScore(itTasks), [itTasks]);

  return (
    <FilingPage
      icon={<span style={{ fontSize: '1.2rem' }}>📊</span>}
      title="Income Tax"
      subtitle="ITR filings, advance tax, and income tax compliances"
      tasks={itTasks}
      score={score}
      accentColor="#6fa9e8"
    />
  );
}

export function TDSPage({ tasks }) {
  const tdsTasks = useMemo(() => tasks.filter(t => (t.type || '').toUpperCase() === 'TDS'), [tasks]);
  const score    = useMemo(() => calcComplianceScore(tdsTasks), [tdsTasks]);

  return (
    <FilingPage
      icon={<span style={{ fontSize: '1.2rem' }}>🧾</span>}
      title="TDS Returns"
      subtitle="Form 24Q, 26Q, 27Q and TDS/TCS compliances"
      tasks={tdsTasks}
      score={score}
      accentColor="#4ecca3"
    />
  );
}

function FilingPage({ icon, title, subtitle, tasks, score, accentColor }) {
  // Status breakdown
  const breakdown = useMemo(() => {
    const m = { completed: 0, 'in-progress': 0, pending: 0, overdue: 0 };
    tasks.forEach(t => { if (m[t.status] !== undefined) m[t.status]++; });
    return m;
  }, [tasks]);

  if (!tasks.length) {
    return (
      <div>
        <PageHeader icon={icon} title={title} subtitle={subtitle} />
        <div className="card" style={{ textAlign: 'center', padding: '4rem', color: 'var(--slate)' }}>
          No {title} tasks found for your account.
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader icon={icon} title={title} subtitle={subtitle} />

      {/* ── Summary + Score row ─── */}
      <div className="fade-up fade-up-1" style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4,1fr) auto',
        gap: '1rem',
        marginBottom: '1.75rem',
        alignItems: 'stretch',
      }}>
        <MiniStat label="Total"       value={tasks.length}           color="var(--cream)" />
        <MiniStat label="Filed"       value={breakdown.completed}    color="#4ecca3"       />
        <MiniStat label="In Progress" value={breakdown['in-progress']} color="#6fa9e8"     />
        <MiniStat label="Overdue"     value={breakdown.overdue}      color="#e87070"       />
        <div className="card" style={{ display: 'flex', alignItems: 'center', padding: '1rem 1.75rem' }}>
          <ComplianceScore score={score} />
        </div>
      </div>

      {/* ── Table ─── */}
      <div className="fade-up fade-up-2 card">
        <TaskTable tasks={tasks} title={title} />
      </div>
    </div>
  );
}

function PageHeader({ icon, title, subtitle }) {
  return (
    <div className="fade-up" style={{ marginBottom: '1.75rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
      <div style={{
        width: 46, height: 46,
        background: 'var(--navy-light)',
        borderRadius: 12,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        border: '1px solid rgba(201,168,76,.15)',
      }}>
        {icon}
      </div>
      <div>
        <h1 style={{ fontSize: '1.6rem', color: 'var(--cream)' }}>{title}</h1>
        <p style={{ fontSize: '.82rem', color: 'var(--slate)', marginTop: '.1rem' }}>{subtitle}</p>
      </div>
    </div>
  );
}

function MiniStat({ label, value, color }) {
  return (
    <div className="card" style={{ padding: '1.1rem 1.25rem' }}>
      <div style={{ fontSize: '.72rem', color: 'var(--slate)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: '.4rem' }}>
        {label}
      </div>
      <div style={{ fontSize: '1.8rem', fontFamily: 'var(--font-display)', color }}>
        {value}
      </div>
    </div>
  );
}
