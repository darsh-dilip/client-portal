import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';
import {
  LayoutDashboard, FileText, Receipt, TrendingUp,
  Calendar, LogOut, Menu, X, ChevronRight
} from 'lucide-react';

const NAV = [
  { to: '/dashboard',  icon: LayoutDashboard, label: 'Dashboard'     },
  { to: '/gst',        icon: Receipt,          label: 'GST Filings'   },
  { to: '/it',         icon: TrendingUp,       label: 'Income Tax'    },
  { to: '/tds',        icon: FileText,         label: 'TDS Returns'   },
  { to: '/calendar',   icon: Calendar,         label: 'Calendar'      },
];

export default function Layout({ user, client, children }) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  async function handleLogout() {
    await signOut(auth);
    navigate('/login');
  }

  const initials = (client?.name || user?.email || '?')
    .split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>

      {/* ── Mobile overlay ───────────────────────────────────── */}
      {open && (
        <div
          onClick={() => setOpen(false)}
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(0,0,0,.6)', zIndex: 40
          }}
        />
      )}

      {/* ── Sidebar ──────────────────────────────────────────── */}
      <aside style={{
        width: 240,
        background: 'var(--navy-mid)',
        borderRight: '1px solid rgba(201,168,76,.1)',
        display: 'flex',
        flexDirection: 'column',
        padding: '1.5rem 0',
        position: 'fixed',
        top: 0, bottom: 0, left: 0,
        zIndex: 50,
        transform: open ? 'translateX(0)' : undefined,
        transition: 'transform .25s',
      }}
      className="sidebar"
      >
        {/* Logo */}
        <div style={{ padding: '0 1.5rem 1.5rem', borderBottom: '1px solid rgba(201,168,76,.1)' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', color: 'var(--gold)' }}>
            ComplianceDesk
          </div>
          <div style={{ fontSize: '.72rem', color: 'var(--slate)', marginTop: '.2rem', letterSpacing: '.08em', textTransform: 'uppercase' }}>
            Client Portal
          </div>
        </div>

        {/* Client info */}
        <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid rgba(201,168,76,.08)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem' }}>
            <div style={{
              width: 38, height: 38,
              background: 'linear-gradient(135deg, var(--gold-dim), var(--gold))',
              borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '.8rem', fontWeight: 600, color: 'var(--navy)',
              flexShrink: 0,
            }}>
              {initials}
            </div>
            <div style={{ overflow: 'hidden' }}>
              <div style={{ fontSize: '.85rem', fontWeight: 500, color: 'var(--cream)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {client?.name || 'Client'}
              </div>
              <div style={{ fontSize: '.72rem', color: 'var(--slate)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {user?.email}
              </div>
            </div>
          </div>
        </div>

        {/* Nav links */}
        <nav style={{ flex: 1, padding: '1rem 0', overflowY: 'auto' }}>
          {NAV.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              onClick={() => setOpen(false)}
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                gap: '.75rem',
                padding: '.7rem 1.5rem',
                fontSize: '.88rem',
                fontWeight: isActive ? 600 : 400,
                color: isActive ? 'var(--gold)' : 'var(--slate-light)',
                background: isActive ? 'rgba(201,168,76,.08)' : 'transparent',
                borderLeft: isActive ? '2px solid var(--gold)' : '2px solid transparent',
                transition: 'all .15s',
              })}
            >
              <Icon size={16} />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Logout */}
        <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid rgba(201,168,76,.08)' }}>
          <button
            onClick={handleLogout}
            className="btn btn-outline"
            style={{ width: '100%', justifyContent: 'flex-start', gap: '.6rem', fontSize: '.85rem' }}
          >
            <LogOut size={15} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* ── Main content ─────────────────────────────────────── */}
      <div style={{ flex: 1, marginLeft: 240, display: 'flex', flexDirection: 'column', minWidth: 0 }}
           className="main-content">
        {/* Mobile top bar */}
        <header style={{
          display: 'none',
          alignItems: 'center',
          padding: '1rem 1.25rem',
          borderBottom: '1px solid rgba(201,168,76,.1)',
          background: 'var(--navy-mid)',
        }} className="mobile-header">
          <button onClick={() => setOpen(true)} style={{ background: 'none', border: 'none', color: 'var(--cream)', cursor: 'pointer' }}>
            <Menu size={22} />
          </button>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', color: 'var(--gold)', marginLeft: '.75rem' }}>
            ComplianceDesk
          </div>
        </header>

        <main style={{ flex: 1, padding: '2rem', overflowY: 'auto' }}>
          {children}
        </main>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .sidebar { transform: translateX(-100%); }
          .sidebar.open { transform: translateX(0); }
          .main-content { margin-left: 0 !important; }
          .mobile-header { display: flex !important; }
          main { padding: 1.25rem !important; }
        }
      `}</style>
    </div>
  );
}
