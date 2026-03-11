import React, { useState, useEffect, useMemo } from 'react';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';
import { fetchAllAuditLogs } from '../hooks/useAuditLog';
import { useAllData } from '../hooks/useAllData';
import { useNavigate } from 'react-router-dom';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, addMonths, subMonths, isBefore } from 'date-fns';
import { Activity, Users, LogOut, RefreshCw, Search, Clock, LogIn, ChevronDown, ChevronUp, AlertTriangle, BarChart2, Calendar, DollarSign, ShieldCheck } from 'lucide-react';
import { getEffectiveStatus, formatRawStatus, toDate, calcComplianceScore } from '../utils/compliance';

const TABS = [
  { key: 'audit',    label: 'Audit Trail',       icon: <Activity size={15}/> },
  { key: 'risk',     label: 'Risk Radar',         icon: <AlertTriangle size={15}/> },
  { key: 'workload', label: 'Team Workload',       icon: <Users size={15}/> },
  { key: 'analytics',label: 'Firm Analytics',     icon: <BarChart2 size={15}/> },
  { key: 'calendar', label: 'Master Calendar',    icon: <Calendar size={15}/> },
  { key: 'billing',  label: 'Billing Readiness',  icon: <DollarSign size={15}/> },
];

const EVENT_LABELS = {
  LOGIN:          { label:'Logged In',   color:'#4ecca3', icon:'🔐' },
  LOGOUT:         { label:'Logged Out',  color:'#8a9bb5', icon:'🚪' },
  VIEW_DASHBOARD: { label:'Dashboard',   color:'#6fa9e8', icon:'📊' },
  VIEW_GST:       { label:'GST',         color:'#c9a84c', icon:'🧾' },
  VIEW_IT:        { label:'Income Tax',  color:'#3a7bd5', icon:'📋' },
  VIEW_TDS:       { label:'TDS',         color:'#2a9d68', icon:'📄' },
  VIEW_CALENDAR:  { label:'Calendar',    color:'#9b72cf', icon:'📅' },
  VIEW_TIMELINE:  { label:'Timeline',    color:'#e8a83a', icon:'📈' },
};

const STATUS_COLOR = { completed:'#4ecca3','in-progress':'#9b72cf', pending:'#e8a83a', overdue:'#e87070' };
const TYPE_COLOR   = { GST:'#c9a84c', IT:'#6fa9e8', TDS:'#4ecca3', OTHER:'#8a9bb5' };

function fmtTs(ts) {
  if (!ts) return '—';
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleString('en-IN', { day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit', hour12:true });
}

// ── Risk Radar ─────────────────────────────────────────────────────────────
function RiskRadar({ clients, tasks }) {
  const ranked = useMemo(() => {
    const map = {};
    clients.forEach(c => { map[c.id] = { client: c, overdue: 0, total: 0 }; });
    tasks.forEach(t => {
      if (!map[t.clientId]) return;
      map[t.clientId].total++;
      if (getEffectiveStatus(t) === 'overdue') map[t.clientId].overdue++;
    });
    return Object.values(map).filter(r => r.overdue > 0).sort((a, b) => b.overdue - a.overdue);
  }, [clients, tasks]);

  return (
    <div>
      <h2 style={{ fontSize:'1.3rem', color:'var(--cream)', marginBottom:'.25rem' }}>Risk Radar</h2>
      <p style={{ fontSize:'.8rem', color:'var(--slate)', marginBottom:'1.25rem' }}>Clients with most overdue tasks — action required</p>
      {ranked.length === 0
        ? <div className="card" style={{ padding:'3rem', textAlign:'center', color:'var(--slate)' }}>🎉 No overdue tasks across any client!</div>
        : <div style={{ display:'flex', flexDirection:'column', gap:'.75rem' }}>
            {ranked.map((r, i) => {
              const pct = r.total > 0 ? Math.round((r.overdue/r.total)*100) : 0;
              const risk = pct >= 60 ? 'HIGH' : pct >= 30 ? 'MEDIUM' : 'LOW';
              const riskColor = pct >= 60 ? '#e87070' : pct >= 30 ? '#c9a84c' : '#4ecca3';
              return (
                <div key={r.client.id} className="card" style={{ padding:'1rem 1.25rem', display:'flex', alignItems:'center', gap:'1rem' }}>
                  <div style={{ fontSize:'1.2rem', fontFamily:'var(--font-display)', color:'var(--slate)', width:28, textAlign:'center' }}>#{i+1}</div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:'.65rem', marginBottom:'.3rem' }}>
                      <div style={{ fontSize:'.95rem', color:'var(--cream)', fontWeight:600 }}>{r.client.name}</div>
                      <span style={{ fontSize:'.6rem', fontWeight:700, padding:'2px 7px', borderRadius:99, background:`${riskColor}20`, color:riskColor, border:`1px solid ${riskColor}44` }}>{risk} RISK</span>
                    </div>
                    <div style={{ display:'flex', gap:'1.5rem', fontSize:'.75rem', color:'var(--slate)' }}>
                      <span>Constitution: {r.client.constitution || '—'}</span>
                      <span>Category: {r.client.category || '—'}</span>
                      <span>Status: <span style={{ color: r.client.clientStatus==='active'?'#4ecca3':'#e87070', textTransform:'capitalize' }}>{r.client.clientStatus}</span></span>
                    </div>
                    {/* Progress bar */}
                    <div style={{ marginTop:'.6rem', background:'rgba(255,255,255,.06)', borderRadius:4, height:5, overflow:'hidden' }}>
                      <div style={{ height:'100%', width:`${pct}%`, background:riskColor, borderRadius:4, transition:'width .4s' }}/>
                    </div>
                  </div>
                  <div style={{ textAlign:'center', flexShrink:0 }}>
                    <div style={{ fontSize:'1.8rem', fontFamily:'var(--font-display)', color:'#e87070' }}>{r.overdue}</div>
                    <div style={{ fontSize:'.65rem', color:'var(--slate)' }}>of {r.total} overdue</div>
                  </div>
                </div>
              );
            })}
          </div>
      }
    </div>
  );
}

// ── Team Workload ──────────────────────────────────────────────────────────
function TeamWorkload({ users, tasks }) {
  const workload = useMemo(() => {
    const map = {};
    tasks.forEach(t => {
      const uid = t.assignedTo; if (!uid) return;
      if (!map[uid]) map[uid] = { user: users[uid] || { name: uid, role:'', uid }, total:0, completed:0, overdue:0, pending:0, ip:0 };
      const s = getEffectiveStatus(t);
      map[uid].total++;
      if (s==='completed')    map[uid].completed++;
      else if (s==='overdue') map[uid].overdue++;
      else if (s==='in-progress') map[uid].ip++;
      else map[uid].pending++;
    });
    return Object.values(map).sort((a,b) => b.total - a.total);
  }, [users, tasks]);

  const maxTotal = Math.max(...workload.map(w => w.total), 1);

  return (
    <div>
      <h2 style={{ fontSize:'1.3rem', color:'var(--cream)', marginBottom:'.25rem' }}>Team Workload</h2>
      <p style={{ fontSize:'.8rem', color:'var(--slate)', marginBottom:'1.25rem' }}>Tasks assigned per team member</p>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(340px,1fr))', gap:'1rem' }}>
        {workload.map(w => {
          const u = w.user;
          const completionRate = w.total > 0 ? Math.round((w.completed/w.total)*100) : 0;
          return (
            <div key={u.uid||u.name} className="card" style={{ padding:'1.1rem' }}>
              <div style={{ display:'flex', alignItems:'center', gap:'.75rem', marginBottom:'1rem' }}>
                <div style={{ width:38, height:38, borderRadius:'50%', background:'linear-gradient(135deg,#1e3050,#3a7bd5)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'.8rem', fontWeight:700, color:'#fff', flexShrink:0 }}>
                  {(u.init || u.name?.[0] || '?').toUpperCase()}
                </div>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:'.9rem', color:'var(--cream)', fontWeight:600 }}>{u.name || u.uid}</div>
                  <div style={{ fontSize:'.72rem', color:'var(--slate)', textTransform:'capitalize' }}>{u.role || ''}{u.dept ? ` · ${u.dept}` : ''}</div>
                </div>
                <div style={{ textAlign:'right' }}>
                  <div style={{ fontSize:'1.4rem', fontFamily:'var(--font-display)', color:'var(--cream)' }}>{w.total}</div>
                  <div style={{ fontSize:'.65rem', color:'var(--slate)' }}>tasks</div>
                </div>
              </div>
              {/* Stacked bar */}
              <div style={{ height:8, borderRadius:4, overflow:'hidden', display:'flex', marginBottom:'.65rem' }}>
                {[
                  { val:w.completed, color:'#4ecca3' },
                  { val:w.ip,        color:'#9b72cf' },
                  { val:w.pending,   color:'#e8a83a' },
                  { val:w.overdue,   color:'#e87070' },
                ].map((seg,i) => seg.val > 0 && (
                  <div key={i} title={`${seg.val}`} style={{ flex:seg.val, background:seg.color, minWidth:2 }}/>
                ))}
              </div>
              <div style={{ display:'flex', gap:'.85rem', fontSize:'.7rem' }}>
                {[['Filed',w.completed,'#4ecca3'],['W.I.P',w.ip,'#9b72cf'],['Pending',w.pending,'#e8a83a'],['Overdue',w.overdue,'#e87070']].map(([l,v,c])=>(
                  <div key={l} style={{ display:'flex', alignItems:'center', gap:'.25rem', color:'var(--slate)' }}>
                    <div style={{ width:6, height:6, borderRadius:'50%', background:c }}/>
                    {l}: <span style={{ color:'var(--slate-light)', fontWeight:600 }}>{v}</span>
                  </div>
                ))}
              </div>
              <div style={{ marginTop:'.65rem', display:'flex', alignItems:'center', gap:'.5rem' }}>
                <div style={{ flex:1, height:4, background:'rgba(255,255,255,.07)', borderRadius:2, overflow:'hidden' }}>
                  <div style={{ height:'100%', width:`${completionRate}%`, background:'#4ecca3', transition:'width .4s' }}/>
                </div>
                <span style={{ fontSize:'.7rem', color:'#4ecca3', fontWeight:600, minWidth:35 }}>{completionRate}%</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Firm-wide Analytics ────────────────────────────────────────────────────
function FirmAnalytics({ clients, tasks }) {
  const stats = useMemo(() => {
    const thisMonth = new Date(); thisMonth.setDate(1);
    let filedThisMonth=0, totalThisMonth=0, overdue=0, total=0, filed=0, active=0;
    clients.forEach(c => { if (c.clientStatus==='active') active++; });
    tasks.forEach(t => {
      total++;
      const s=getEffectiveStatus(t);
      if (s==='completed') filed++;
      if (s==='overdue')   overdue++;
      if (t.dueDate) {
        const d=new Date(t.dueDate);
        if (d.getFullYear()===thisMonth.getFullYear() && d.getMonth()===thisMonth.getMonth()) {
          totalThisMonth++;
          if (s==='completed') filedThisMonth++;
        }
      }
    });
    const completionRate = total > 0 ? Math.round((filed/total)*100) : 0;
    const monthRate = totalThisMonth > 0 ? Math.round((filedThisMonth/totalThisMonth)*100) : 0;
    return { total, filed, overdue, active, totalClients:clients.length, filedThisMonth, totalThisMonth, completionRate, monthRate };
  }, [clients, tasks]);

  // Compliance score distribution
  const scoreDistrib = useMemo(() => {
    const buckets = { 'A (80-100)':0, 'B (60-79)':0, 'C (40-59)':0, 'D (<40)':0 };
    const clientTaskMap = {};
    tasks.forEach(t => {
      if (!t.clientId) return;
      if (!clientTaskMap[t.clientId]) clientTaskMap[t.clientId] = [];
      clientTaskMap[t.clientId].push(t);
    });
    Object.values(clientTaskMap).forEach(ts => {
      const s = calcComplianceScore(ts) || 0;
      if (s>=80) buckets['A (80-100)']++;
      else if (s>=60) buckets['B (60-79)']++;
      else if (s>=40) buckets['C (40-59)']++;
      else buckets['D (<40)']++;
    });
    return buckets;
  }, [tasks]);

  // Tasks by type
  const byType = useMemo(() => {
    const m={};
    tasks.forEach(t => { const k=t.type||'OTHER'; if(!m[k])m[k]={total:0,filed:0}; m[k].total++; if(getEffectiveStatus(t)==='completed')m[k].filed++; });
    return m;
  }, [tasks]);

  const statCards = [
    { label:'Active Clients', val:stats.active, sub:`of ${stats.totalClients} total`, color:'#6fa9e8' },
    { label:'Total Tasks',    val:stats.total,  sub:`${stats.filed} filed`,            color:'var(--cream)' },
    { label:'Overall Filed',  val:`${stats.completionRate}%`, sub:`${stats.filed} tasks`,  color:'#4ecca3' },
    { label:'Overdue',        val:stats.overdue, sub:'needs action',                   color:'#e87070' },
    { label:'This Month',     val:`${stats.monthRate}%`, sub:`${stats.filedThisMonth}/${stats.totalThisMonth} filed`, color:'#c9a84c' },
  ];

  return (
    <div>
      <h2 style={{ fontSize:'1.3rem', color:'var(--cream)', marginBottom:'.25rem' }}>Firm-wide Analytics</h2>
      <p style={{ fontSize:'.8rem', color:'var(--slate)', marginBottom:'1.25rem' }}>Overall compliance health across all clients</p>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:'.85rem', marginBottom:'1.5rem' }}>
        {statCards.map(s => (
          <div key={s.label} className="card" style={{ padding:'1rem' }}>
            <div style={{ fontSize:'.62rem', color:'var(--slate)', textTransform:'uppercase', letterSpacing:'.06em', marginBottom:'.3rem' }}>{s.label}</div>
            <div style={{ fontSize:'1.8rem', fontFamily:'var(--font-display)', color:s.color, marginBottom:'.15rem' }}>{s.val}</div>
            <div style={{ fontSize:'.7rem', color:'var(--slate)' }}>{s.sub}</div>
          </div>
        ))}
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem' }}>
        <div className="card" style={{ padding:'1.1rem' }}>
          <div style={{ fontSize:'.72rem', color:'var(--slate)', textTransform:'uppercase', letterSpacing:'.06em', marginBottom:'1rem' }}>Compliance Score Distribution</div>
          {Object.entries(scoreDistrib).map(([k,v]) => {
            const c = k.startsWith('A')?'#4ecca3':k.startsWith('B')?'#6fa9e8':k.startsWith('C')?'#c9a84c':'#e87070';
            const pct = stats.totalClients > 0 ? Math.round((v/stats.totalClients)*100) : 0;
            return (
              <div key={k} style={{ marginBottom:'.75rem' }}>
                <div style={{ display:'flex', justifyContent:'space-between', fontSize:'.78rem', color:'var(--slate-light)', marginBottom:'.3rem' }}>
                  <span>{k}</span><span style={{ color:c, fontWeight:600 }}>{v} clients</span>
                </div>
                <div style={{ height:6, background:'rgba(255,255,255,.06)', borderRadius:3, overflow:'hidden' }}>
                  <div style={{ height:'100%', width:`${pct}%`, background:c, transition:'width .5s' }}/>
                </div>
              </div>
            );
          })}
        </div>

        <div className="card" style={{ padding:'1.1rem' }}>
          <div style={{ fontSize:'.72rem', color:'var(--slate)', textTransform:'uppercase', letterSpacing:'.06em', marginBottom:'1rem' }}>Filing Rate by Type</div>
          {Object.entries(byType).map(([type, d]) => {
            const pct = d.total > 0 ? Math.round((d.filed/d.total)*100) : 0;
            const c = TYPE_COLOR[type]||'#8a9bb5';
            return (
              <div key={type} style={{ marginBottom:'.75rem' }}>
                <div style={{ display:'flex', justifyContent:'space-between', fontSize:'.78rem', color:'var(--slate-light)', marginBottom:'.3rem' }}>
                  <span style={{ color:c, fontWeight:600 }}>{type}</span>
                  <span>{pct}% filed · {d.filed}/{d.total}</span>
                </div>
                <div style={{ height:6, background:'rgba(255,255,255,.06)', borderRadius:3, overflow:'hidden' }}>
                  <div style={{ height:'100%', width:`${pct}%`, background:c, transition:'width .5s' }}/>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── Master Calendar ────────────────────────────────────────────────────────
const DOW = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

function MasterCalendar({ clients, tasks }) {
  const [current,    setCurrent]    = useState(new Date());
  const [clientF,    setClientF]    = useState('all');
  const [fyF,        setFyF]        = useState('all');
  const [hoverDay,   setHoverDay]   = useState(null);

  const fys = useMemo(() => [...new Set(tasks.map(t=>t.fy).filter(Boolean))].sort().reverse(), [tasks]);

  const filtered = useMemo(() => tasks.filter(t => {
    if (clientF !== 'all' && t.clientId !== clientF) return false;
    if (fyF     !== 'all' && t.fy       !== fyF)     return false;
    return true;
  }), [tasks, clientF, fyF]);

  const start    = startOfMonth(current);
  const days     = eachDayOfInterval({ start, end: endOfMonth(current) });
  const padStart = start.getDay();

  const taskMap = useMemo(() => {
    const m = {};
    filtered.forEach(t => {
      if (!t.dueDate) return;
      const d = toDate(t.dueDate);
      if (!isSameMonth(d, current)) return;
      const k = format(d, 'yyyy-MM-dd');
      if (!m[k]) m[k] = [];
      m[k].push(t);
    });
    return m;
  }, [filtered, current]);

  const monthTasks = useMemo(() =>
    filtered.filter(t => { const d=toDate(t.dueDate); return d && isSameMonth(d, current); })
      .sort((a,b) => toDate(a.dueDate)-toDate(b.dueDate))
  , [filtered, current]);

  return (
    <div>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:'1rem', marginBottom:'1.25rem' }}>
        <div>
          <h2 style={{ fontSize:'1.3rem', color:'var(--cream)', marginBottom:'.15rem' }}>Master Calendar</h2>
          <p style={{ fontSize:'.8rem', color:'var(--slate)' }}>All clients' due dates in one view</p>
        </div>
        <div style={{ display:'flex', gap:'.65rem', flexWrap:'wrap' }}>
          <select value={fyF}     onChange={e=>setFyF(e.target.value)}     style={{ width:'auto', minWidth:110 }}>
            <option value="all">All FY</option>
            {fys.map(f=><option key={f} value={f}>{f}</option>)}
          </select>
          <select value={clientF} onChange={e=>setClientF(e.target.value)} style={{ width:'auto', minWidth:160 }}>
            <option value="all">All Clients</option>
            {clients.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 280px', gap:'1.1rem' }}>
        <div className="card" style={{ padding:0, overflow:'hidden' }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'.85rem 1.1rem', borderBottom:'1px solid rgba(201,168,76,.1)' }}>
            <button onClick={()=>setCurrent(d=>subMonths(d,1))} className="btn btn-outline" style={{ padding:'.35rem .6rem' }}><ChevronDown size={14} style={{transform:'rotate(90deg)'}}/></button>
            <div style={{ fontSize:'.95rem', fontFamily:'var(--font-display)', color:'var(--cream)', fontWeight:600 }}>{format(current,'MMMM yyyy')}</div>
            <button onClick={()=>setCurrent(d=>addMonths(d,1))}  className="btn btn-outline" style={{ padding:'.35rem .6rem' }}><ChevronDown size={14} style={{transform:'rotate(-90deg)'}}/></button>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', borderBottom:'1px solid rgba(255,255,255,.05)' }}>
            {DOW.map(d=><div key={d} style={{ padding:'.4rem', textAlign:'center', fontSize:'.65rem', color:'var(--slate)', fontWeight:600 }}>{d}</div>)}
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', position:'relative' }}>
            {Array.from({length:padStart}).map((_,i)=><div key={`p${i}`} style={{ minHeight:68, borderRight:'1px solid rgba(255,255,255,.03)' }}/>)}
            {days.map((day,i) => {
              const key      = format(day,'yyyy-MM-dd');
              const dayTasks = taskMap[key]||[];
              const today    = isToday(day);
              const col      = (padStart+i)%7;
              return (
                <div key={key} onMouseEnter={()=>dayTasks.length&&setHoverDay(key)} onMouseLeave={()=>setHoverDay(null)}
                  style={{ minHeight:68, padding:'.3rem .35rem', borderTop:'1px solid rgba(255,255,255,.03)', borderRight:col<6?'1px solid rgba(255,255,255,.03)':'none', background:today?'rgba(201,168,76,.06)':'transparent', position:'relative' }}>
                  <div style={{ fontSize:'.72rem', color:today?'var(--gold)':'var(--slate-light)', fontWeight:today?700:400, marginBottom:'.15rem' }}>{format(day,'d')}</div>
                  {dayTasks.slice(0,3).map(t=>{
                    const eff=getEffectiveStatus(t), c=STATUS_COLOR[eff]||'#8a9bb5', tc=TYPE_COLOR[t.type]||'#8a9bb5';
                    return <div key={t.id} title={`${t._client?.name||''}: ${t.description||t.service}`} style={{ fontSize:'.55rem', background:`${c}18`, color:c, borderLeft:`2px solid ${tc}`, borderRadius:'0 3px 3px 0', padding:'.1rem .25rem', marginBottom:2, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                      {t._client?.name?.slice(0,8)||t.type}: {t.description?.slice(0,10)||t.service?.slice(0,10)}
                    </div>;
                  })}
                  {dayTasks.length>3&&<div style={{ fontSize:'.5rem', color:'var(--slate)' }}>+{dayTasks.length-3}</div>}
                  {hoverDay===key&&dayTasks.length>0&&(
                    <div style={{ position:'absolute', top:'100%', left:0, zIndex:50, background:'#0f1c2e', border:'1px solid rgba(201,168,76,.2)', borderRadius:8, padding:'.65rem .85rem', minWidth:200, boxShadow:'0 12px 32px rgba(0,0,0,.8)', zIndex:100 }}>
                      {dayTasks.map(t=>(
                        <div key={t.id} style={{ padding:'3px 0', fontSize:'.72rem', color:'#e8dfc8' }}>
                          <span style={{ color:STATUS_COLOR[getEffectiveStatus(t)], marginRight:'.3rem' }}>●</span>
                          <strong>{t._client?.name}</strong> · {t.description||t.service}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="card" style={{ padding:'1rem', overflowY:'auto', maxHeight:520 }}>
          <div style={{ fontSize:'.7rem', color:'var(--slate)', textTransform:'uppercase', letterSpacing:'.06em', marginBottom:'.85rem', fontWeight:600 }}>
            {format(current,'MMMM')} — {monthTasks.length} Filings
          </div>
          {monthTasks.length===0
            ? <p style={{ color:'var(--slate)', fontSize:'.82rem' }}>No filings this month.</p>
            : monthTasks.map(t=>{
                const d=toDate(t.dueDate), eff=getEffectiveStatus(t), c=STATUS_COLOR[eff]||'#8a9bb5';
                return (
                  <div key={t.id} style={{ padding:'.6rem .75rem', background:'var(--navy-light)', borderRadius:'var(--radius-sm)', borderLeft:`3px solid ${c}`, marginBottom:'.5rem' }}>
                    <div style={{ fontSize:'.78rem', color:'var(--cream)', fontWeight:600 }}>{t._client?.name||'—'}</div>
                    <div style={{ fontSize:'.72rem', color:'var(--slate)', marginTop:'.1rem' }}>{t.description||t.service} · {format(d,'dd MMM')}</div>
                    <div style={{ fontSize:'.65rem', marginTop:'.2rem', display:'flex', alignItems:'center', gap:'.4rem' }}>
                      <span style={{ color:c, background:`${c}18`, border:`1px solid ${c}33`, borderRadius:99, padding:'1px 6px', fontWeight:600 }}>{formatRawStatus(t.status)}</span>
                      <span style={{ color:TYPE_COLOR[t.type]||'#8a9bb5' }}>{t.type}</span>
                    </div>
                  </div>
                );
              })
          }
        </div>
      </div>
    </div>
  );
}

// ── Billing Readiness ──────────────────────────────────────────────────────
function BillingReadiness({ clients, tasks }) {
  const [search, setSearch] = useState('');

  const billingData = useMemo(() => {
    const map = {};
    clients.forEach(c => { map[c.id] = { client:c, completed:[], total:0 }; });
    tasks.forEach(t => {
      if (!map[t.clientId]) return;
      map[t.clientId].total++;
      if (getEffectiveStatus(t)==='completed') map[t.clientId].completed.push(t);
    });
    return Object.values(map)
      .filter(r => r.completed.length > 0)
      .sort((a,b) => b.completed.length - a.completed.length);
  }, [clients, tasks]);

  const totals = useMemo(() => ({
    clients: billingData.length,
    tasks: billingData.reduce((s,r) => s+r.completed.length, 0),
  }), [billingData]);

  const filtered = useMemo(() => {
    if (!search) return billingData;
    return billingData.filter(r => r.client.name.toLowerCase().includes(search.toLowerCase()));
  }, [billingData, search]);

  return (
    <div>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'1.25rem', flexWrap:'wrap', gap:'1rem' }}>
        <div>
          <h2 style={{ fontSize:'1.3rem', color:'var(--cream)', marginBottom:'.15rem' }}>Billing Readiness</h2>
          <p style={{ fontSize:'.8rem', color:'var(--slate)' }}>Completed tasks ready to bill · {totals.clients} clients · {totals.tasks} tasks</p>
        </div>
        <div style={{ position:'relative' }}>
          <Search size={13} style={{ position:'absolute', left:'.75rem', top:'50%', transform:'translateY(-50%)', color:'var(--slate)' }}/>
          <input placeholder="Search clients…" value={search} onChange={e=>setSearch(e.target.value)} style={{ paddingLeft:'2.2rem', minWidth:200 }}/>
        </div>
      </div>

      <div style={{ display:'flex', flexDirection:'column', gap:'1rem' }}>
        {filtered.map(r => (
          <div key={r.client.id} className="card" style={{ padding:'1.1rem' }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'.85rem' }}>
              <div>
                <div style={{ fontSize:'.95rem', color:'var(--cream)', fontWeight:600 }}>{r.client.name}</div>
                <div style={{ fontSize:'.72rem', color:'var(--slate)', marginTop:'.1rem' }}>{r.client.constitution} · {r.client.category ? `Category ${r.client.category}` : ''}</div>
              </div>
              <div style={{ textAlign:'right' }}>
                <div style={{ fontSize:'1.4rem', fontFamily:'var(--font-display)', color:'#4ecca3' }}>{r.completed.length}</div>
                <div style={{ fontSize:'.65rem', color:'var(--slate)' }}>tasks billable</div>
              </div>
            </div>
            <div style={{ display:'flex', flexWrap:'wrap', gap:'.45rem' }}>
              {r.completed.map(t=>(
                <span key={t.id} style={{ fontSize:'.68rem', padding:'3px 9px', borderRadius:99, background:'rgba(78,204,163,.1)', border:'1px solid rgba(78,204,163,.25)', color:'#4ecca3' }}>
                  {t.description||t.service} · {t.period}
                </span>
              ))}
            </div>
          </div>
        ))}
        {filtered.length===0&&<div className="card" style={{ padding:'3rem', textAlign:'center', color:'var(--slate)' }}>No clients match your search.</div>}
      </div>
    </div>
  );
}

// ── Audit Trail ────────────────────────────────────────────────────────────
function AuditTrail() {
  const [logs,    setLogs]    = useState([]);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState('');
  const [eventF,  setEventF]  = useState('all');
  const [sortDir, setSortDir] = useState('desc');
  const [lastRefresh, setLastRefresh] = useState(new Date());

  async function loadLogs() {
    setLoading(true);
    try { const d=await fetchAllAuditLogs(500); setLogs(d); setLastRefresh(new Date()); }
    catch(e){ console.error(e); } finally { setLoading(false); }
  }
  useEffect(()=>{ loadLogs(); },[]);

  const stats = useMemo(()=>{
    const uc=new Set(logs.map(l=>l.email)).size;
    const logins=logs.filter(l=>l.event==='LOGIN').length;
    const today=logs.filter(l=>{ if(!l.timestamp)return false; const d=l.timestamp.toDate?l.timestamp.toDate():new Date(l.timestamp); return d.toDateString()===new Date().toDateString(); }).length;
    return {total:logs.length,uc,logins,today};
  },[logs]);

  const byClient = useMemo(()=>{
    const m={};
    logs.forEach(l=>{ if(!m[l.email])m[l.email]={email:l.email,name:l.name,count:0,last:null}; m[l.email].count++; const ts=l.timestamp?.toDate?l.timestamp.toDate():new Date(l.timestamp||0); if(!m[l.email].last||ts>m[l.email].last)m[l.email].last=ts; });
    return Object.values(m).sort((a,b)=>(b.last||0)-(a.last||0));
  },[logs]);

  const filtered = useMemo(()=>logs.filter(l=>{
    if(eventF!=='all'&&l.event!==eventF)return false;
    if(search){const h=`${l.email} ${l.name} ${l.event} ${l.detail}`.toLowerCase();if(!h.includes(search.toLowerCase()))return false;}
    return true;
  }).sort((a,b)=>{
    const ta=a.timestamp?.toDate?a.timestamp.toDate():new Date(a.timestamp||0);
    const tb=b.timestamp?.toDate?b.timestamp.toDate():new Date(b.timestamp||0);
    return sortDir==='desc'?tb-ta:ta-tb;
  }),[logs,search,eventF,sortDir]);

  return (
    <div>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'1.5rem' }}>
        <div>
          <h2 style={{ fontSize:'1.3rem', color:'var(--cream)' }}>Audit Trail</h2>
          <p style={{ color:'var(--slate)', fontSize:'.78rem', marginTop:'.15rem' }}>Refreshed: {lastRefresh.toLocaleTimeString('en-IN')}</p>
        </div>
        <button onClick={loadLogs} className="btn btn-outline" disabled={loading} style={{ gap:'.5rem', fontSize:'.82rem' }}>
          <RefreshCw size={13} style={{ animation:loading?'spin .7s linear infinite':'none' }}/> Refresh
        </button>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'1rem', marginBottom:'1.5rem' }}>
        {[{label:'Total Events',val:stats.total,color:'var(--cream)'},{label:'Unique Clients',val:stats.uc,color:'#6fa9e8'},{label:'Total Logins',val:stats.logins,color:'#4ecca3'},{label:"Today's Events",val:stats.today,color:'#e8a83a'}].map(s=>(
          <div key={s.label} className="card" style={{ padding:'.9rem 1.1rem' }}>
            <div style={{ fontSize:'.62rem', color:'var(--slate)', textTransform:'uppercase', letterSpacing:'.06em', marginBottom:'.35rem' }}>{s.label}</div>
            <div style={{ fontSize:'1.7rem', fontFamily:'var(--font-display)', color:s.color }}>{s.val}</div>
          </div>
        ))}
      </div>

      {byClient.length>0&&(
        <div style={{ marginBottom:'1.5rem' }}>
          <div style={{ fontSize:'.72rem', color:'var(--slate)', textTransform:'uppercase', letterSpacing:'.06em', marginBottom:'.85rem' }}>Client Activity</div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(250px,1fr))', gap:'.65rem' }}>
            {byClient.map(c=>(
              <div key={c.email} className="card" style={{ padding:'.85rem 1rem', display:'flex', alignItems:'center', gap:'.75rem' }}>
                <div style={{ width:32,height:32,borderRadius:'50%',background:'linear-gradient(135deg,var(--gold-dim),var(--gold))',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'.72rem',fontWeight:700,color:'var(--navy)',flexShrink:0 }}>
                  {(c.name||c.email)[0].toUpperCase()}
                </div>
                <div style={{ minWidth:0,flex:1 }}>
                  <div style={{ fontSize:'.82rem',color:'var(--cream)',fontWeight:500,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>{c.name||c.email}</div>
                  <div style={{ fontSize:'.68rem',color:'var(--slate)' }}>Last: {c.last?c.last.toLocaleDateString('en-IN',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'}):'—'}</div>
                </div>
                <div style={{ background:'var(--navy-light)',borderRadius:7,padding:'.25rem .55rem',fontSize:'.75rem',color:'var(--gold)',fontWeight:600,flexShrink:0 }}>{c.count}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ display:'flex', gap:'.6rem', flexWrap:'wrap', marginBottom:'.85rem', alignItems:'center' }}>
        <div style={{ position:'relative', flex:1, minWidth:180 }}>
          <Search size={13} style={{ position:'absolute',left:'.75rem',top:'50%',transform:'translateY(-50%)',color:'var(--slate)' }}/>
          <input placeholder="Search by email, event…" value={search} onChange={e=>setSearch(e.target.value)} style={{ paddingLeft:'2.2rem' }}/>
        </div>
        <select value={eventF} onChange={e=>setEventF(e.target.value)} style={{ width:'auto',minWidth:140 }}>
          <option value="all">All Events</option>
          {Object.entries(EVENT_LABELS).map(([k,v])=><option key={k} value={k}>{v.icon} {v.label}</option>)}
        </select>
        <button className="btn btn-outline" onClick={()=>setSortDir(d=>d==='desc'?'asc':'desc')} style={{ padding:'.5rem .85rem',fontSize:'.8rem',gap:'.35rem' }}>
          Time {sortDir==='desc'?<ChevronDown size={12}/>:<ChevronUp size={12}/>}
        </button>
      </div>
      <div style={{ fontSize:'.75rem',color:'var(--slate)',marginBottom:'.65rem' }}>{filtered.length} of {logs.length} events</div>

      <div className="card" style={{ padding:0,overflow:'hidden' }}>
        {loading?(
          <div style={{ padding:'3rem',textAlign:'center' }}><div className="spinner" style={{ margin:'0 auto 1rem' }}/><p style={{ color:'var(--slate)',fontSize:'.85rem' }}>Loading…</p></div>
        ):filtered.length===0?(
          <div style={{ padding:'3rem',textAlign:'center',color:'var(--slate)',fontSize:'.85rem' }}>No events found.</div>
        ):(
          <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%',borderCollapse:'collapse',fontSize:'.83rem' }}>
              <thead>
                <tr style={{ borderBottom:'1px solid rgba(201,168,76,.12)' }}>
                  {['Time','Client','Email','Event','Detail'].map(h=>(
                    <th key={h} style={{ padding:'.55rem .9rem',textAlign:'left',color:'var(--slate)',fontWeight:500,fontSize:'.68rem',letterSpacing:'.05em',textTransform:'uppercase',whiteSpace:'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(log=>{
                  const ev=EVENT_LABELS[log.event]||{label:log.event,color:'#8a9bb5',icon:'•'};
                  return (
                    <tr key={log.id} style={{ borderBottom:'1px solid rgba(255,255,255,.04)' }}>
                      <td style={{ padding:'.65rem .9rem',color:'var(--slate)',whiteSpace:'nowrap',fontSize:'.76rem' }}>{fmtTs(log.timestamp)}</td>
                      <td style={{ padding:'.65rem .9rem',color:'var(--cream)',whiteSpace:'nowrap' }}>{log.name||'—'}</td>
                      <td style={{ padding:'.65rem .9rem',color:'var(--slate-light)',fontSize:'.78rem' }}>{log.email}</td>
                      <td style={{ padding:'.65rem .9rem',whiteSpace:'nowrap' }}>
                        <span style={{ display:'inline-flex',alignItems:'center',gap:'.3rem',fontSize:'.68rem',fontWeight:600,letterSpacing:'.04em',textTransform:'uppercase',padding:'.22rem .65rem',borderRadius:99,background:`${ev.color}18`,color:ev.color }}>
                          {ev.icon} {ev.label}
                        </span>
                      </td>
                      <td style={{ padding:'.65rem .9rem',color:'var(--slate)',fontSize:'.76rem' }}>{log.detail||'—'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ── AdminPanel shell ───────────────────────────────────────────────────────
export default function AdminPanel({ user }) {
  const [activeTab, setActiveTab] = useState('audit');
  const navigate = useNavigate();
  const { clients, tasks, users, loading, error } = useAllData();

  async function handleLogout() { await signOut(auth); navigate('/admin/login'); }

  return (
    <div style={{ minHeight:'100vh', background:'var(--navy)', display:'flex' }}>
      {/* Sidebar */}
      <aside style={{ width:220, background:'var(--navy-mid)', borderRight:'1px solid rgba(201,168,76,.1)', display:'flex', flexDirection:'column', padding:'1.5rem 0', flexShrink:0 }}>
        <div style={{ padding:'0 1.25rem 1.1rem', borderBottom:'1px solid rgba(201,168,76,.08)' }}>
          <div style={{ fontFamily:'var(--font-display)', fontSize:'1.15rem', color:'var(--gold)' }}>ComplianceDesk</div>
          <div style={{ fontSize:'.68rem', color:'#6fa9e8', marginTop:'.15rem', letterSpacing:'.08em', textTransform:'uppercase' }}>Admin Panel</div>
        </div>
        <div style={{ padding:'.85rem 1.25rem', borderBottom:'1px solid rgba(201,168,76,.06)' }}>
          <div style={{ display:'flex', alignItems:'center', gap:'.55rem' }}>
            <div style={{ width:30,height:30,background:'linear-gradient(135deg,#1e3050,#3a7bd5)',borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'.7rem',fontWeight:700,color:'#fff',flexShrink:0 }}>
              {(user?.email?.[0]||'A').toUpperCase()}
            </div>
            <div style={{ minWidth:0 }}>
              <div style={{ fontSize:'.78rem',color:'var(--cream)',fontWeight:500 }}>Admin</div>
              <div style={{ fontSize:'.65rem',color:'var(--slate)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>{user?.email}</div>
            </div>
          </div>
        </div>
        <nav style={{ flex:1, padding:'.85rem 0', overflowY:'auto' }}>
          {TABS.map(tab=>(
            <button key={tab.key} onClick={()=>setActiveTab(tab.key)}
              style={{ width:'100%', display:'flex', alignItems:'center', gap:'.65rem', padding:'.65rem 1.25rem', fontSize:'.82rem', fontWeight:activeTab===tab.key?600:400, color:activeTab===tab.key?'var(--gold)':'var(--slate-light)', background:activeTab===tab.key?'rgba(201,168,76,.08)':'transparent', borderLeft:activeTab===tab.key?'2px solid var(--gold)':'2px solid transparent', border:'none', cursor:'pointer', textAlign:'left', fontFamily:'var(--font-body)' }}>
              {tab.icon}{tab.label}
            </button>
          ))}
        </nav>
        <div style={{ padding:'.85rem 1.25rem', borderTop:'1px solid rgba(201,168,76,.08)' }}>
          <button onClick={handleLogout} className="btn btn-outline" style={{ width:'100%', fontSize:'.8rem', gap:'.5rem' }}>
            <LogOut size={13}/> Sign Out
          </button>
        </div>
      </aside>

      {/* Main */}
      <main style={{ flex:1, padding:'1.75rem 2rem', overflowY:'auto', minWidth:0 }}>
        {loading && activeTab!=='audit' ? (
          <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'60vh' }}>
            <div className="spinner" />
          </div>
        ) : error ? (
          <div style={{ color:'#e87070', padding:'2rem' }}>Error loading data: {error}</div>
        ) : (
          <>
            {activeTab==='audit'    && <AuditTrail/>}
            {activeTab==='risk'     && <RiskRadar    clients={clients} tasks={tasks}/>}
            {activeTab==='workload' && <TeamWorkload  users={users}    tasks={tasks}/>}
            {activeTab==='analytics'&& <FirmAnalytics clients={clients} tasks={tasks}/>}
            {activeTab==='calendar' && <MasterCalendar clients={clients} tasks={tasks}/>}
            {activeTab==='billing'  && <BillingReadiness clients={clients} tasks={tasks}/>}
          </>
        )}
      </main>
    </div>
  );
}
