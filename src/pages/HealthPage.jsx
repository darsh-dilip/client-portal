import React, { useMemo } from 'react';
import { ShieldCheck, TrendingDown, TrendingUp, AlertCircle, CheckCircle2 } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { calcComplianceScore, scoreToGrade, getEffectiveStatus, toDate } from '../utils/compliance';
import { format, startOfMonth, subMonths } from 'date-fns';

export default function HealthPage({ tasks, client }) {
  // Build month-over-month score trend (last 6 months)
  const trend = useMemo(() => {
    const months = Array.from({ length: 6 }, (_, i) => {
      const d = subMonths(new Date(), 5 - i);
      return { key: format(d, 'yyyy-MM'), label: format(d, 'MMM yy'), date: d };
    });

    return months.map(m => {
      const monthTasks = tasks.filter(t => {
        if (!t.dueDate) return false;
        const dy = t.dueDate.slice(0, 7);
        return dy <= m.key; // tasks due up to and including this month
      });
      const score = calcComplianceScore(monthTasks);
      return { name: m.label, score: score ?? 0 };
    });
  }, [tasks]);

  const currentScore = useMemo(() => calcComplianceScore(tasks), [tasks]);
  const prevScore    = trend[trend.length - 2]?.score ?? currentScore;
  const scoreDelta   = (currentScore ?? 0) - (prevScore ?? 0);
  const { grade, color } = scoreToGrade(currentScore);

  // What's dragging score down
  const draggers = useMemo(() => {
    const r = [];
    const overdue = tasks.filter(t => getEffectiveStatus(t) === 'overdue');
    const dataPending = tasks.filter(t => (t.status || '').toLowerCase() === 'data_pending');
    const pending = tasks.filter(t => getEffectiveStatus(t) === 'pending');

    if (overdue.length)     r.push({ icon: '🔴', label: `${overdue.length} overdue filing${overdue.length > 1 ? 's' : ''}`, severity: 'high', tasks: overdue });
    if (dataPending.length) r.push({ icon: '🟡', label: `${dataPending.length} task${dataPending.length > 1 ? 's' : ''} awaiting data`, severity: 'medium', tasks: dataPending });
    if (pending.length)     r.push({ icon: '🔵', label: `${pending.length} task${pending.length > 1 ? 's' : ''} still pending`, severity: 'low', tasks: pending });
    return r;
  }, [tasks]);

  // Filed on time vs late
  const filingStats = useMemo(() => {
    const filed = tasks.filter(t => getEffectiveStatus(t) === 'completed');
    const onTime = filed.filter(t => {
      if (!t.filedDate || !t.dueDate) return true;
      return toDate(t.filedDate) <= toDate(t.dueDate);
    });
    return { filed: filed.length, onTime: onTime.length, late: filed.length - onTime.length };
  }, [tasks]);

  const SEV_STYLE = {
    high:   { bg: 'rgba(232,112,112,.08)', border: 'rgba(232,112,112,.25)', color: '#e87070' },
    medium: { bg: 'rgba(201,168,76,.08)',  border: 'rgba(201,168,76,.25)',  color: '#c9a84c' },
    low:    { bg: 'rgba(111,169,232,.08)', border: 'rgba(111,169,232,.25)', color: '#6fa9e8' },
  };

  const r = 46, circ = 2 * Math.PI * r, dash = ((currentScore || 0) / 100) * circ;

  return (
    <div>
      <div className="fade-up" style={{ marginBottom: '1.1rem', display: 'flex', alignItems: 'center', gap: '.85rem' }}>
        <div style={{ width: 40, height: 40, background: 'var(--navy-light)', border: '1px solid rgba(201,168,76,.15)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <ShieldCheck size={20} color="var(--gold)" />
        </div>
        <div>
          <h1 style={{ fontSize: '1.5rem', color: 'var(--cream)' }}>Compliance Health</h1>
          <p style={{ fontSize: '.78rem', color: 'var(--slate)', marginTop: '.1rem' }}>Score trend and what's impacting your compliance</p>
        </div>
      </div>

      {/* ── Top row ── */}
      <div className="fade-up fade-up-1" style={{ display: 'grid', gridTemplateColumns: 'auto 1fr auto', gap: '1.25rem', marginBottom: '1.25rem', alignItems: 'stretch' }}>

        {/* Score ring */}
        <div className="card" style={{ padding: '1.5rem 2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '.5rem', minWidth: 190 }}>
          <svg width={110} height={110} viewBox="0 0 110 110">
            <circle cx={55} cy={55} r={r} fill="none" stroke="rgba(255,255,255,.07)" strokeWidth={9} />
            <circle cx={55} cy={55} r={r} fill="none" stroke={color} strokeWidth={9}
              strokeDasharray={`${dash} ${circ - dash}`} strokeLinecap="round" transform="rotate(-90 55 55)" />
            <text x={55} y={52} textAnchor="middle" fill={color} fontSize={22} fontWeight={700} fontFamily="var(--font-display)">{currentScore ?? '—'}</text>
            <text x={55} y={64} textAnchor="middle" fill="var(--slate)" fontSize={8} letterSpacing={1}>OUT OF 100</text>
          </svg>
          <div style={{ fontSize: '1.5rem', fontFamily: 'var(--font-display)', color }}>Grade {grade}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '.35rem', fontSize: '.78rem' }}>
            {scoreDelta >= 0
              ? <TrendingUp size={14} color="#4ecca3" />
              : <TrendingDown size={14} color="#e87070" />}
            <span style={{ color: scoreDelta >= 0 ? '#4ecca3' : '#e87070', fontWeight: 600 }}>
              {scoreDelta >= 0 ? '+' : ''}{scoreDelta} pts
            </span>
            <span style={{ color: 'var(--slate)' }}>vs last month</span>
          </div>
        </div>

        {/* 6-month trend chart */}
        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ fontSize: '.7rem', color: 'var(--slate)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: '.85rem' }}>Score Trend — Last 6 Months</div>
          <ResponsiveContainer width="100%" height={120}>
            <LineChart data={trend} margin={{ top: 4, right: 8, bottom: 0, left: -28 }}>
              <XAxis dataKey="name" tick={{ fill: 'var(--slate)', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'var(--slate)', fontSize: 10 }} axisLine={false} tickLine={false} domain={[0, 100]} />
              <ReferenceLine y={75} stroke="rgba(78,204,163,.2)" strokeDasharray="4 3" />
              <ReferenceLine y={50} stroke="rgba(232,112,112,.15)" strokeDasharray="4 3" />
              <Tooltip
                contentStyle={{ background: '#0f1c2e', border: '1px solid rgba(201,168,76,.2)', borderRadius: 8, fontSize: '.76rem' }}
                labelStyle={{ color: '#e8dfc8' }}
                itemStyle={{ color: color }}
                formatter={v => [`${v} / 100`, 'Score']}
              />
              <Line type="monotone" dataKey="score" stroke={color} strokeWidth={2.5}
                dot={{ fill: color, r: 4 }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Filing accuracy */}
        <div className="card" style={{ padding: '1.25rem', minWidth: 170 }}>
          <div style={{ fontSize: '.7rem', color: 'var(--slate)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: '1rem' }}>Filing Accuracy</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '.75rem' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.78rem', marginBottom: '.3rem' }}>
                <span style={{ color: '#4ecca3' }}>On Time</span>
                <span style={{ color: 'var(--cream)', fontWeight: 600 }}>{filingStats.onTime}</span>
              </div>
              <div style={{ height: 5, background: 'rgba(255,255,255,.07)', borderRadius: 3, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: filingStats.filed > 0 ? `${(filingStats.onTime/filingStats.filed)*100}%` : '0%', background: '#4ecca3' }}/>
              </div>
            </div>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.78rem', marginBottom: '.3rem' }}>
                <span style={{ color: '#c9a84c' }}>Late</span>
                <span style={{ color: 'var(--cream)', fontWeight: 600 }}>{filingStats.late}</span>
              </div>
              <div style={{ height: 5, background: 'rgba(255,255,255,.07)', borderRadius: 3, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: filingStats.filed > 0 ? `${(filingStats.late/filingStats.filed)*100}%` : '0%', background: '#c9a84c' }}/>
              </div>
            </div>
            <div style={{ fontSize: '.7rem', color: 'var(--slate)', marginTop: '.2rem', borderTop: '1px solid rgba(255,255,255,.06)', paddingTop: '.65rem' }}>
              {filingStats.filed} total filed
            </div>
          </div>
        </div>
      </div>

      {/* ── What's dragging score down ── */}
      {draggers.length > 0 && (
        <div className="fade-up fade-up-2 card" style={{ marginBottom: '1.25rem' }}>
          <div style={{ fontSize: '.7rem', color: 'var(--slate)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: '1rem' }}>What's Dragging Your Score Down</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '.75rem' }}>
            {draggers.map((d, i) => {
              const sty = SEV_STYLE[d.severity];
              return (
                <div key={i} style={{ background: sty.bg, border: `1px solid ${sty.border}`, borderRadius: 'var(--radius-md)', padding: '.85rem 1.1rem', display: 'flex', alignItems: 'flex-start', gap: '.85rem' }}>
                  <span style={{ fontSize: '1.1rem', lineHeight: 1 }}>{d.icon}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '.88rem', color: sty.color, fontWeight: 600, marginBottom: '.4rem' }}>{d.label}</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.4rem' }}>
                      {d.tasks.slice(0, 6).map(t => (
                        <span key={t.id} style={{ fontSize: '.68rem', padding: '2px 8px', borderRadius: 99, background: `${sty.color}15`, color: sty.color, border: `1px solid ${sty.color}33` }}>
                          {t.description || t.service} · {t.period}
                        </span>
                      ))}
                      {d.tasks.length > 6 && <span style={{ fontSize: '.68rem', color: 'var(--slate)' }}>+{d.tasks.length - 6} more</span>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {draggers.length === 0 && (
        <div className="fade-up fade-up-2 card" style={{ padding: '2.5rem', textAlign: 'center' }}>
          <CheckCircle2 size={36} color="#4ecca3" style={{ margin: '0 auto .75rem' }} />
          <div style={{ fontSize: '1.05rem', color: '#4ecca3', fontWeight: 600, marginBottom: '.35rem' }}>Excellent compliance!</div>
          <div style={{ fontSize: '.85rem', color: 'var(--slate)' }}>No overdue or pending issues dragging your score.</div>
        </div>
      )}
    </div>
  );
}
