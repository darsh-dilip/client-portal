import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';
import { useAuditLog } from '../hooks/useAuditLog';
import { LayoutDashboard, GitBranch, Receipt, TrendingUp, FileText, Calendar, ListChecks, ShieldCheck, FileStack, Bell, LogOut, AlertTriangle } from 'lucide-react';

const NAV = [
  { path: '/dashboard', label: 'Dashboard',  icon: <LayoutDashboard size={15}/>, event: 'VIEW_DASHBOARD' },
  { path: '/timeline',  label: 'Timeline',   icon: <GitBranch size={15}/>,       event: 'VIEW_TIMELINE'  },
  { path: '/gst',       label: 'GST Filings',icon: <Receipt size={15}/>,         event: 'VIEW_GST'       },
  { path: '/it',        label: 'Income Tax', icon: <TrendingUp size={15}/>,      event: 'VIEW_IT'        },
  { path: '/tds',       label: 'TDS Returns',icon: <FileText size={15}/>,        event: 'VIEW_TDS'       },
  { path: '/calendar',  label: 'Calendar',   icon: <Calendar size={15}/>,        event: 'VIEW_CALENDAR'  },
  { path: '/all-tasks', label: 'All Tasks',  icon: <ListChecks size={15}/>,      event: 'VIEW_ALL_TASKS' },
  { path: '/health',    label: 'Health',     icon: <ShieldCheck size={15}/>,     event: 'VIEW_HEALTH'    },
  { path: '/documents', label: 'Documents',  icon: <FileStack size={15}/>,       event: 'VIEW_DOCS'      },
  { path: '/alerts',    label: 'Alerts',     icon: <Bell size={15}/>,            event: 'VIEW_ALERTS'    },
];

function statusBadgeConfig(clientStatus) {
  const s = (clientStatus || '').toLowerCase().trim();
  if (s === 'active') return {
    label: 'Active',
    color: '#4ecca3',
    bg: 'rgba(78,204,163,.12)',
    border: 'rgba(78,204,163,.35)',
    dot: '#4ecca3',
    disclaimer: null,
  };
  if (s === 'on_hold' || s === 'on hold') return {
    label: 'On Hold',
    color: '#c9a84c',
    bg: 'rgba(201,168,76,.12)',
    border: 'rgba(201,168,76,.35)',
    dot: '#c9a84c',
    disclaimer: true,
  };
  if (['discontinued','stopped','inactive'].includes(s)) return {
    label: s === 'stopped' ? 'Stopped' : 'Discontinued',
    color: '#e87070',
    bg: 'rgba(232,112,112,.12)',
    border: 'rgba(232,112,112,.35)',
    dot: '#e87070',
    disclaimer: true,
  };
  return null;
}

export default function Layout({ children, user, client }) {
  const navigate = useNavigate();
  const { logEvent } = useAuditLog(user);

  async function handleLogout() {
    await logEvent('LOGOUT', 'Client signed out');
    await signOut(auth);
    navigate('/login');
  }

  const badge = statusBadgeConfig(client?.clientStatus);
  const showDisclaimer = badge?.disclaimer;

  return (
    <div style={{ display:'flex', minHeight:'100vh', background:'var(--navy)' }}>
      {/* ── Sidebar ───────────────────────────────────────────── */}
      <aside style={{ width:210, flexShrink:0, background:'var(--navy-mid)', borderRight:'1px solid rgba(201,168,76,.08)', display:'flex', flexDirection:'column' }}>

        {/* BizExpress Logo */}
        <div style={{ padding:'1rem 1rem .85rem', borderBottom:'1px solid rgba(201,168,76,.08)' }}>
          <a href="https://bizexpress.in" target="_blank" rel="noopener noreferrer"
            style={{ display:'block', background:'#fff', borderRadius:8, padding:'7px 10px', textAlign:'center' }}>
            <img
              src="https://bizexpress.in/wp-content/uploads/2021/08/BizE-Logo-HD.png"
              alt="BizExpress"
              style={{ height:28, maxWidth:'100%', objectFit:'contain', display:'block', margin:'0 auto' }}
              onError={e => {
                // Fallback text if image fails to load
                e.target.style.display = 'none';
                e.target.parentElement.innerHTML = '<span style="font-weight:700;color:#0f1b2d;font-size:.9rem;letter-spacing:-.3px;">BizExpress</span>';
              }}
            />
          </a>
        </div>

        {/* Portal name + user info */}
        <div style={{ padding:'.85rem 1rem', borderBottom:'1px solid rgba(201,168,76,.06)' }}>
          <div style={{ fontFamily:'var(--font-display)', fontSize:'1rem', color:'var(--gold)', marginBottom:'.65rem' }}>
            ComplianceDesk
            <div style={{ fontSize:'.6rem', color:'var(--slate)', fontFamily:'var(--font-body)', textTransform:'uppercase', letterSpacing:'.08em', marginTop:'.1rem' }}>Client Portal</div>
          </div>

          {/* User info */}
          <div style={{ display:'flex', alignItems:'center', gap:'.5rem' }}>
            <div style={{ width:26, height:26, borderRadius:'50%', background:'linear-gradient(135deg,var(--gold-dim),var(--gold))', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'.65rem', fontWeight:700, color:'var(--navy)', flexShrink:0 }}>
              {(client?.name||user?.displayName||user?.email||'C')[0].toUpperCase()}
            </div>
            <div style={{ minWidth:0 }}>
              <div style={{ fontSize:'.8rem', color:'var(--cream)', fontWeight:500, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                {client?.name||user?.displayName||'Client'}
              </div>
              <div style={{ fontSize:'.63rem', color:'var(--slate)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{user?.email}</div>
            </div>
          </div>

          {/* Client status badge */}
          {badge && (
            <div style={{ marginTop:'.75rem' }}>
              <div style={{ display:'flex', alignItems:'center', gap:'.45rem', background:badge.bg, border:`1px solid ${badge.border}`, borderRadius:8, padding:'.45rem .75rem' }}>
                <div style={{ width:7, height:7, borderRadius:'50%', background:badge.dot, flexShrink:0, boxShadow:`0 0 5px ${badge.dot}` }}/>
                <span style={{ fontSize:'.75rem', fontWeight:700, color:badge.color, textTransform:'uppercase', letterSpacing:'.05em' }}>{badge.label}</span>
              </div>

              {/* Disclaimer for On Hold / Discontinued */}
              {showDisclaimer && (
                <div style={{ marginTop:'.55rem', background:'rgba(232,112,112,.06)', border:'1px solid rgba(232,112,112,.2)', borderRadius:7, padding:'.6rem .75rem', display:'flex', gap:'.4rem', alignItems:'flex-start' }}>
                  <AlertTriangle size={12} color="#e87070" style={{ flexShrink:0, marginTop:'.1rem' }}/>
                  <div style={{ fontSize:'.65rem', color:'rgba(240,200,200,.8)', lineHeight:1.5 }}>
                    Your compliances are currently on hold. Please contact your Sales / RM immediately to avoid penalties.{' '}
                    <strong style={{ color:'#e87070' }}>BizExpress will not be liable for any penalties arising due to this.</strong>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Nav */}
        <nav style={{ flex:1, padding:'.65rem 0', overflowY:'auto' }}>
          {NAV.map(item => (
            <NavLink key={item.path} to={item.path}
              onClick={() => logEvent(item.event, item.path)}
              style={({ isActive }) => ({
                display:'flex', alignItems:'center', gap:'.55rem',
                padding:'.5rem 1rem',
                fontSize:'.8rem',
                color: isActive ? 'var(--gold)' : 'var(--slate-light)',
                background: isActive ? 'rgba(201,168,76,.08)' : 'transparent',
                borderLeft: isActive ? '2px solid var(--gold)' : '2px solid transparent',
                textDecoration:'none',
                fontWeight: isActive ? 600 : 400,
                transition:'all .15s',
              })}>
              {item.icon}{item.label}
            </NavLink>
          ))}
        </nav>

        {/* Sign out */}
        <div style={{ padding:'.85rem 1rem', borderTop:'1px solid rgba(201,168,76,.08)' }}>
          <button onClick={handleLogout}
            style={{ width:'100%', display:'flex', alignItems:'center', gap:'.55rem', padding:'.5rem .6rem', background:'none', border:'1px solid rgba(255,255,255,.07)', borderRadius:'var(--radius-sm)', color:'var(--slate)', cursor:'pointer', fontSize:'.78rem', fontFamily:'var(--font-body)' }}>
            <LogOut size={13}/> Sign Out
          </button>
        </div>
      </aside>

      {/* ── Main ──────────────────────────────────────────────── */}
      <main style={{ flex:1, padding:'1.75rem 2rem', overflowY:'auto', minWidth:0 }}>
        {children}
      </main>
    </div>
  );
}
