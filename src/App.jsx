import React, { useEffect, useState } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebase';
import { useAdmin } from './hooks/useAdmin';
import { useClientData } from './hooks/useClientData';
import { useAuditLog } from './hooks/useAuditLog';

import Layout        from './components/Layout';
import LoginPage     from './pages/LoginPage';
import AdminLoginPage from './pages/AdminLoginPage';
import AdminPanel    from './pages/AdminPanel';
import DashboardPage from './pages/DashboardPage';
import { GSTPage, ITPage, TDSPage } from './pages/FilingPages';
import CalendarPage  from './pages/CalendarPage';
import TimelinePage  from './pages/TimelinePage';
import AllTasksPage  from './pages/AllTasksPage';
import HealthPage    from './pages/HealthPage';
import DocumentsPage from './pages/DocumentsPage';
import AlertsPage    from './pages/AlertsPage';

function ClientApp({ user }) {
  const { client, tasks, loading, error } = useClientData(user);
  const { logEvent } = useAuditLog();

  useEffect(() => {
    if (user && !loading) logEvent('LOGIN', { detail: 'Session started' });
  }, [user, loading]);

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--navy)' }}>
      <div style={{ textAlign: 'center' }}>
        <div className="spinner" style={{ margin: '0 auto 1rem' }} />
        <p style={{ color: 'var(--slate)', fontSize: '.88rem' }}>Loading your compliance data…</p>
      </div>
    </div>
  );

  if (error) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--navy)' }}>
      <div style={{ textAlign: 'center', maxWidth: 400, padding: '2rem' }}>
        <div style={{ fontSize: '1.5rem', color: '#e87070', marginBottom: '.75rem' }}>⚠️ Access Error</div>
        <p style={{ color: 'var(--slate)' }}>{error}</p>
        <p style={{ color: 'var(--slate)', fontSize: '.82rem', marginTop: '.75rem' }}>Make sure your email is registered as a client. Contact your CA if this persists.</p>
      </div>
    </div>
  );

  return (
    <Layout user={user} client={client}>
      <Routes>
        <Route path="/dashboard"  element={<DashboardPage tasks={tasks} client={client} />} />
        <Route path="/timeline"   element={<TimelinePage  tasks={tasks} client={client} />} />
        <Route path="/gst"        element={<GSTPage       tasks={tasks} />} />
        <Route path="/it"         element={<ITPage        tasks={tasks} />} />
        <Route path="/tds"        element={<TDSPage       tasks={tasks} />} />
        <Route path="/calendar"   element={<CalendarPage  tasks={tasks} />} />
        <Route path="/all-tasks"  element={<AllTasksPage  tasks={tasks} />} />
        <Route path="/health"     element={<HealthPage    tasks={tasks} client={client} />} />
        <Route path="/documents"  element={<DocumentsPage />} />
        <Route path="/alerts"     element={<AlertsPage    user={user} client={client} />} />
        <Route path="*"           element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Layout>
  );
}

function AdminApp({ user }) {
  return (
    <Routes>
      <Route path="*" element={<AdminPanel user={user} />} />
    </Routes>
  );
}

export default function App() {
  const [user,    setUser]    = useState(undefined); // undefined = loading
  const [checked, setChecked] = useState(false);
  const isAdmin = useAdmin(user);

  useEffect(() => {
    return onAuthStateChanged(auth, u => {
      setUser(u);
      setChecked(true);
    });
  }, []);

  if (!checked) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--navy)' }}>
      <div className="spinner" />
    </div>
  );

  return (
    <Routes>
      <Route path="/login"       element={!user ? <LoginPage />      : <Navigate to="/dashboard" replace />} />
      <Route path="/admin/login" element={!user ? <AdminLoginPage /> : <Navigate to="/admin" replace />} />
      <Route path="/admin/*"
        element={
          !user     ? <Navigate to="/admin/login" replace /> :
          !isAdmin  ? <Navigate to="/dashboard"   replace /> :
          <AdminApp user={user} />
        }
      />
      <Route path="/*"
        element={
          !user    ? <Navigate to="/login" replace /> :
          isAdmin  ? <Navigate to="/admin" replace /> :
          <ClientApp user={user} />
        }
      />
    </Routes>
  );
}
