import React, { useState, useEffect, useMemo } from 'react';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';
import { fetchAllAuditLogs } from '../hooks/useAuditLog';
import { useNavigate } from 'react-router-dom';
import {
  Activity, Users, LogOut, RefreshCw, Search,
  Shield, Clock, Eye, LogIn, ChevronDown, ChevronUp,
} from 'lucide-react';

const EVENT_LABELS = {
  LOGIN:            { label: 'Logged In',      color: '#4ecca3', icon: '🔐' },
  LOGOUT:           { label: 'Logged Out',     color: '#8a9bb5', icon: '🚪' },
  VIEW_DASHBOARD:   { label: 'Dashboard',      color: '#6fa9e8', icon: '📊' },
  VIEW_GST:         { label: 'GST Page',       color: '#c9a84c', icon: '🧾' },
  VIEW_IT:          { label: 'Income Tax',     color: '#3a7bd5', icon: '📋' },
  VIEW_TDS:         { label: 'TDS Page',       color: '#2a9d68', icon: '📄' },
  VIEW_CALENDAR:    { label: 'Calendar',       color: '#9b72cf', icon: '📅' },
  VIEW_AUDIT:       { label: 'Audit Log',      color: '#e8a83a', icon: '🔍' },
};

function fmtTs(ts) {
  if (!ts) return '—';
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: true,
  });
}

export default function AdminPanel({ user }) {
  const [logs,     setLogs]     = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState('');
  const [eventF,   setEventF]   = useState('all');
  const [sortDir,  setSortDir]  = useState('desc');
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const navigate = useNavigate();

  async function loadLogs() {
    setLoading(true);
    try {
      const data = await fetchAllAuditLogs(500);
      setLogs(data);
      setLastRefresh(new Date());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadLogs(); }, []);

  async function handleLogout() {
    await signOut(auth);
    navigate('/admin/login');
  }

  // ── Stats ─────────────────────────────────────────────────
  const stats = useMemo(() => {
    const uniqueClients = new Set(logs.map(l => l.email)).size;
    const logins        = logs.filter(l => l.event === 'LOGIN').length;
    const today         = logs.filter(l => {
      if (!l.timestamp) return false;
      const d = l.timestamp.toDate ? l.timestamp.toDate() : new Date(l.timestamp);
      return d.toDateString() === new Date().toDateString();
    }).length;
    return { total: logs.length, uniqueClients, logins, today };
  }, [logs]);

  // ── Filter & sort ─────────────────────────────────────────
  const filtered = useMemo(() => {
    return logs
      .filter(l => {
        if (eventF !== 'all' && l.event !== eventF) return false;
        if (search) {
          const hay = `${l.email} ${l.name} ${l.event} ${l.detail}`.toLowerCase();
          if (!hay.includes(search.toLowerCase())) return false;
        }
        return true;
      })
      .sort((a, b) => {
        const ta = a.timestamp?.toDate ? a.timestamp.toDate() : new Date(a.timestamp || 0);
        const tb = b.timestamp?.toDate ? b.timestamp.toDate() : new Date(b.timestamp || 0);
        return sortDir === 'desc' ? tb - ta : ta - tb;
      });
  }, [logs, search, eventF, sortDir]);

  // ── Activity by client ────────────────────────────────────
  const byClient = useMemo(() => {
    const map = {};
    logs.forEach(l => {
      if (!map[l.email]) map[l.email] = { email: l.email, name: l.name, count: 0, lastSeen: null };
      map[l.email].count++;
      const ts = l.timestamp?.toDate ? l.timestamp.toDate() : new Date(l.timestamp || 0);
      if (!map[l.email].lastSeen || ts > map[l.email].lastSeen) map[l.email].lastSeen = ts;
    });
    return Object.values(map).sort((a, b) => (b.lastSeen||0) - (a.lastSeen||0));
  }, [logs]);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--navy)', display: 'flex' }}>

      {/* ── Sidebar ───────────────────────────────────────── */}
      <aside style={{
        width: 220, background: 'var(--navy-mid)',
        borderRight: '1px solid rgba(201,168,76,.1)',
        display: 'flex', flexDirection: 'column', padding: '1.5rem 0', flexShrink: 0,
      }}>
        <div style={{ padding: '0 1.5rem 1.25rem', borderBottom: '1px solid rgba(201,168,76,.08)' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', color: 'var(--gold)' }}>
            ComplianceDesk
          </div>
          <div style={{ fontSize: '.7rem', color: '#6fa9e8', marginTop: '.2rem', letterSpacing: '.08em', textTransform: 'uppercase' }}>
            Admin Panel
          </div>
        </div>

        <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid rgba(201,168,76,.06)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '.6rem' }}>
            <div style={{
              width: 32, height: 32,
              background: 'linear-gradient(135deg, #1e3050, #3a7bd5)',
              borderRadius: '50%', display: 'flex', alignItems: 'center',
              justifyContent: 'center', fontSize: '.75rem', fontWeight: 700, color: '#fff',
            }}>
              {(user?.email?.[0] || 'A').toUpperCase()}
            </div>
            <div>
              <div style={{ fontSize: '.8rem', color: 'var(--cream)', fontWeight: 500 }}>Admin</div>
              <div style={{ fontSize: '.68rem', color: 'var(--slate)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 130 }}>
                {user?.email}
              </div>
            </div>
          </div>
        </div>

        <nav style={{ flex: 1, padding: '1rem 0' }}>
          {[
            { icon: <Activity size={15}/>, label: 'Audit Trail' },
            { icon: <Users size={15}/>,    label: 'Client Activity' },
          ].map((item, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: '.7rem',
              padding: '.7rem 1.5rem', fontSize: '.85rem',
              color: i === 0 ? 'var(--gold)' : 'var(--slate-light)',
              background: i === 0 ? 'rgba(201,168,76,.08)' : 'transparent',
              borderLeft: i === 0 ? '2px solid var(--gold)' : '2px solid transparent',
            }}>
              {item.icon}{item.label}
            </div>
          ))}
        </nav>

        <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid rgba(201,168,76,.08)' }}>
          <button onClick={handleLogout} className="btn btn-outline"
            style={{ width: '100%', fontSize: '.82rem', gap: '.5rem' }}>
            <LogOut size={14}/> Sign Out
          </button>
        </div>
      </aside>

      {/* ── Main ──────────────────────────────────────────── */}
      <main style={{ flex: 1, padding: '2rem', overflowY: 'auto', minWidth: 0 }}>

        {/* Header */}
        <div className="fade-up" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.75rem' }}>
          <div>
            <h1 style={{ fontSize: '1.7rem', color: 'var(--cream)' }}>Audit Trail</h1>
            <p style={{ color: 'var(--slate)', fontSize: '.82rem', marginTop: '.2rem' }}>
              Last refreshed: {lastRefresh.toLocaleTimeString('en-IN')}
            </p>
          </div>
          <button onClick={loadLogs} className="btn btn-outline" disabled={loading}
            style={{ gap: '.5rem', fontSize: '.85rem' }}>
            <RefreshCw size={14} style={{ animation: loading ? 'spin .7s linear infinite' : 'none' }}/>
            Refresh
          </button>
        </div>

        {/* Stats */}
        <div className="fade-up fade-up-1" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '1rem', marginBottom: '1.75rem' }}>
          {[
            { label: 'Total Events',    value: stats.total,         color: 'var(--cream)',  icon: <Activity size={18}/> },
            { label: 'Unique Clients',  value: stats.uniqueClients, color: '#6fa9e8',       icon: <Users size={18}/> },
            { label: 'Total Logins',    value: stats.logins,        color: '#4ecca3',       icon: <LogIn size={18}/> },
            { label: "Today's Events",  value: stats.today,         color: '#e8a83a',       icon: <Clock size={18}/> },
          ].map(s => (
            <div key={s.label} className="card" style={{ padding: '1.1rem 1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '.6rem', marginBottom: '.5rem' }}>
                <div style={{ color: s.color, opacity: .8 }}>{s.icon}</div>
                <div style={{ fontSize: '.72rem', color: 'var(--slate)', textTransform: 'uppercase', letterSpacing: '.05em' }}>{s.label}</div>
              </div>
              <div style={{ fontSize: '1.8rem', fontFamily: 'var(--font-display)', color: s.color }}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* Client Activity Summary */}
        <div className="fade-up fade-up-2" style={{ marginBottom: '1.75rem' }}>
          <h2 style={{ fontSize: '1.1rem', color: 'var(--cream)', marginBottom: '1rem' }}>Client Activity Summary</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px,1fr))', gap: '.75rem' }}>
            {byClient.map(c => (
              <div key={c.email} className="card" style={{ padding: '1rem 1.1rem', display: 'flex', alignItems: 'center', gap: '.85rem' }}>
                <div style={{
                  width: 36, height: 36, borderRadius: '50%',
                  background: 'linear-gradient(135deg, var(--gold-dim), var(--gold))',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '.8rem', fontWeight: 700, color: 'var(--navy)', flexShrink: 0,
                }}>
                  {(c.name || c.email)?.[0]?.toUpperCase()}
                </div>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontSize: '.85rem', color: 'var(--cream)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {c.name || c.email}
                  </div>
                  <div style={{ fontSize: '.72rem', color: 'var(--slate)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {c.email}
                  </div>
                  <div style={{ fontSize: '.7rem', color: 'var(--slate)', marginTop: '.2rem' }}>
                    Last seen: {c.lastSeen ? c.lastSeen.toLocaleDateString('en-IN', { day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit' }) : '—'}
                  </div>
                </div>
                <div style={{
                  background: 'var(--navy-light)', borderRadius: 8,
                  padding: '.3rem .6rem', fontSize: '.78rem',
                  color: 'var(--gold)', fontWeight: 600, flexShrink: 0,
                }}>
                  {c.count}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Filters */}
        <div className="fade-up fade-up-3" style={{ display: 'flex', gap: '.75rem', flexWrap: 'wrap', marginBottom: '1rem', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: 180 }}>
            <Search size={13} style={{ position: 'absolute', left: '.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--slate)' }}/>
            <input placeholder="Search by email, event…" value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft: '2.2rem' }}/>
          </div>
          <select value={eventF} onChange={e => setEventF(e.target.value)}
            style={{ width: 'auto', minWidth: 150 }}>
            <option value="all">All Events</option>
            {Object.entries(EVENT_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v.icon} {v.label}</option>
            ))}
          </select>
          <button className="btn btn-outline" onClick={() => setSortDir(d => d==='desc'?'asc':'desc')}
            style={{ padding: '.6rem 1rem', fontSize: '.82rem', gap: '.4rem' }}>
            Time {sortDir === 'desc' ? <ChevronDown size={13}/> : <ChevronUp size={13}/>}
          </button>
        </div>

        <div style={{ fontSize: '.78rem', color: 'var(--slate)', marginBottom: '.75rem' }}>
          {filtered.length} of {logs.length} events
        </div>

        {/* Log table */}
        <div className="fade-up fade-up-4 card" style={{ padding: 0, overflow: 'hidden' }}>
          {loading ? (
            <div style={{ padding: '3rem', textAlign: 'center' }}>
              <div className="spinner" style={{ margin: '0 auto 1rem' }}/>
              <p style={{ color: 'var(--slate)', fontSize: '.88rem' }}>Loading audit logs…</p>
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--slate)', fontSize: '.88rem' }}>
              No events found.
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '.85rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(201,168,76,.12)' }}>
                    {['Time', 'Client', 'Email', 'Event', 'Detail'].map(h => (
                      <th key={h} style={{
                        padding: '.65rem 1rem', textAlign: 'left',
                        color: 'var(--slate)', fontWeight: 500,
                        fontSize: '.72rem', letterSpacing: '.05em', textTransform: 'uppercase', whiteSpace: 'nowrap',
                      }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((log, i) => {
                    const ev = EVENT_LABELS[log.event] || { label: log.event, color: '#8a9bb5', icon: '•' };
                    return (
                      <tr key={log.id} style={{ borderBottom: '1px solid rgba(255,255,255,.04)' }}>
                        <td style={{ padding: '.7rem 1rem', color: 'var(--slate)', whiteSpace: 'nowrap', fontSize: '.78rem' }}>
                          {fmtTs(log.timestamp)}
                        </td>
                        <td style={{ padding: '.7rem 1rem', color: 'var(--cream)', whiteSpace: 'nowrap' }}>
                          {log.name || '—'}
                        </td>
                        <td style={{ padding: '.7rem 1rem', color: 'var(--slate-light)', fontSize: '.8rem' }}>
                          {log.email}
                        </td>
                        <td style={{ padding: '.7rem 1rem', whiteSpace: 'nowrap' }}>
                          <span style={{
                            display: 'inline-flex', alignItems: 'center', gap: '.35rem',
                            fontSize: '.72rem', fontWeight: 600, letterSpacing: '.04em',
                            textTransform: 'uppercase', padding: '.25rem .7rem', borderRadius: 99,
                            background: `${ev.color}20`, color: ev.color,
                          }}>
                            {ev.icon} {ev.label}
                          </span>
                        </td>
                        <td style={{ padding: '.7rem 1rem', color: 'var(--slate)', fontSize: '.78rem' }}>
                          {log.detail || '—'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
