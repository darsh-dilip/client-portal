import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';
import { useAuditLog } from '../hooks/useAuditLog';
import { LayoutDashboard, GitBranch, Receipt, TrendingUp, FileText, Calendar, ListChecks, ShieldCheck, FileStack, Bell, LogOut } from 'lucide-react';

const NAV = [
  { path: '/dashboard', label: 'Dashboard',  icon: <LayoutDashboard size={16}/>, event: 'VIEW_DASHBOARD' },
  { path: '/timeline',  label: 'Timeline',   icon: <GitBranch size={16}/>,       event: 'VIEW_TIMELINE'  },
  { path: '/gst',       label: 'GST Filings',icon: <Receipt size={16}/>,         event: 'VIEW_GST'       },
  { path: '/it',        label: 'Income Tax', icon: <TrendingUp size={16}/>,      event: 'VIEW_IT'        },
  { path: '/tds',       label: 'TDS Returns',icon: <FileText size={16}/>,        event: 'VIEW_TDS'       },
  { path: '/calendar',  label: 'Calendar',   icon: <Calendar size={16}/>,        event: 'VIEW_CALENDAR'  },
  { path: '/all-tasks', label: 'All Tasks',  icon: <ListChecks size={16}/>,      event: 'VIEW_ALL_TASKS' },
  { path: '/health',    label: 'Health',     icon: <ShieldCheck size={16}/>,     event: 'VIEW_HEALTH'    },
  { path: '/documents', label: 'Documents',  icon: <FileStack size={16}/>,       event: 'VIEW_DOCS'      },
  { path: '/alerts',    label: 'Alerts',     icon: <Bell size={16}/>,            event: 'VIEW_ALERTS'    },
];

export default function Layout({ children, user, client }) {
  const navigate = useNavigate();
  // FIX: pass user so logEvent can auto-bind it
  const { logEvent } = useAuditLog(user);

  async function handleLogout() {
    await logEvent('LOGOUT', 'Client signed out');
    await signOut(auth);
    navigate('/login');
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--navy)' }}>
      {/* ── Sidebar ─────────────────────────────────────────────── */}
      <aside style={{ width: 196, flexShrink: 0, background: 'var(--navy-mid)', borderRight: '1px solid rgba(201,168,76,.08)', display: 'flex', flexDirection: 'column', padding: '1.25rem 0' }}>
        {/* Logo */}
        <div style={{ padding: '0 1.1rem 1rem', borderBottom: '1px solid rgba(201,168,76,.08)' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', color: 'var(--gold)' }}>ComplianceDesk</div>
          <div style={{ fontSize: '.65rem', color: 'var(--slate)', marginTop: '.1rem', textTransform: 'uppercase', letterSpacing: '.08em' }}>Client Portal</div>
        </div>

        {/* User info */}
        <div style={{ padding: '.85rem 1.1rem', borderBottom: '1px solid rgba(201,168,76,.06)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '.55rem' }}>
            <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg, var(--gold-dim), var(--gold))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '.68rem', fontWeight: 700, color: 'var(--navy)', flexShrink: 0 }}>
              {(client?.name || user?.displayName || user?.email || 'C')[0].toUpperCase()}
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: '.8rem', color: 'var(--cream)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {client?.name || user?.displayName || 'Client'}
              </div>
              <div style={{ fontSize: '.65rem', color: 'var(--slate)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.email}</div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '.75rem 0', overflowY: 'auto' }}>
          {NAV.map(item => (
            <NavLink key={item.path} to={item.path}
              onClick={() => logEvent(item.event, item.path)}
              style={({ isActive }) => ({
                display: 'flex', alignItems: 'center', gap: '.6rem',
                padding: '.55rem 1.1rem',
                fontSize: '.8rem',
                color: isActive ? 'var(--gold)' : 'var(--slate-light)',
                background: isActive ? 'rgba(201,168,76,.08)' : 'transparent',
                borderLeft: isActive ? '2px solid var(--gold)' : '2px solid transparent',
                textDecoration: 'none',
                fontWeight: isActive ? 600 : 400,
                transition: 'all .15s',
              })}>
              {item.icon}{item.label}
            </NavLink>
          ))}
        </nav>

        {/* Sign out */}
        <div style={{ padding: '.85rem 1.1rem', borderTop: '1px solid rgba(201,168,76,.08)' }}>
          <button onClick={handleLogout}
            style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '.6rem', padding: '.5rem .6rem', background: 'none', border: '1px solid rgba(255,255,255,.07)', borderRadius: 'var(--radius-sm)', color: 'var(--slate)', cursor: 'pointer', fontSize: '.78rem', fontFamily: 'var(--font-body)' }}>
            <LogOut size={13}/> Sign Out
          </button>
        </div>
      </aside>

      {/* ── Main ────────────────────────────────────────────────── */}
      <main style={{ flex: 1, padding: '1.75rem 2rem', overflowY: 'auto', minWidth: 0 }}>
        {children}
      </main>
    </div>
  );
}
