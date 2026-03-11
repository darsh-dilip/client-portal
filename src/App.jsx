import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { auth } from './firebase';
import { useAuth } from './hooks/useAuth';
import { useAdmin } from './hooks/useAdmin';
import { useClientData } from './hooks/useClientData';
import { logEvent } from './hooks/useAuditLog';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import AdminLoginPage from './pages/AdminLoginPage';
import AdminPanel from './pages/AdminPanel';
import DashboardPage from './pages/DashboardPage';
import { GSTPage, ITPage, TDSPage } from './pages/FilingPages';
import CalendarPage from './pages/CalendarPage';
import TimelinePage from './pages/TimelinePage';

function RequireAuth({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <FullPageLoader />;
  if (!user)   return <Navigate to="/login" state={{ from: location }} replace />;
  return children;
}

function RequireAdmin({ children }) {
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, loading: adminLoading } = useAdmin(user);
  if (authLoading || adminLoading) return <FullPageLoader />;
  if (!user || !isAdmin) return <Navigate to="/admin/login" replace />;
  return children;
}

function AuthenticatedApp() {
  const { user, loading: authLoading } = useAuth();
  const { tasks, client, loading: dataLoading, error } = useClientData(user?.email);

  useEffect(() => {
    if (user) logEvent(user, 'LOGIN', 'Signed in via Google');
  }, [user?.uid]);

  if (authLoading || dataLoading) return <FullPageLoader />;
  if (error) return <ErrorScreen title="Connection Error" message={error} email={user?.email} />;
  if (!client) return (
    <ErrorScreen
      title="Account Not Found"
      email={user?.email}
      message={`No client profile found for ${user?.email}. Please ask your CA to add this exact email to your client record.`}
    />
  );

  return (
    <Layout user={user} client={client}>
      <Routes>
        <Route path="/dashboard" element={<DashboardPage tasks={tasks} client={client} />} />
        <Route path="/timeline"  element={<TimelinePage  tasks={tasks} client={client} />} />
        <Route path="/gst"       element={<GSTPage tasks={tasks} />} />
        <Route path="/it"        element={<ITPage  tasks={tasks} />} />
        <Route path="/tds"       element={<TDSPage tasks={tasks} />} />
        <Route path="/calendar"  element={<CalendarPage tasks={tasks} />} />
        <Route path="*"          element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Layout>
  );
}

function AdminPanelWrapper() {
  const { user } = useAuth();
  return <AdminPanel user={user} />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login"       element={<LoginPage />} />
        <Route path="/admin/login" element={<AdminLoginPage />} />
        <Route path="/admin" element={<RequireAdmin><AdminPanelWrapper /></RequireAdmin>} />
        <Route path="/*" element={<RequireAuth><AuthenticatedApp /></RequireAuth>} />
      </Routes>
    </BrowserRouter>
  );
}

function ErrorScreen({ title, message, email }) {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--navy)', padding: '2rem' }}>
      <div style={{ maxWidth: 460, width: '100%', background: 'var(--navy-mid)', border: '1px solid rgba(201,168,76,.15)', borderRadius: 'var(--radius-xl)', padding: '2.5rem', boxShadow: '0 24px 64px rgba(0,0,0,.6)', textAlign: 'center' }}>
        <div style={{ width: 56, height: 56, background: 'var(--amber-bg)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem', fontSize: '1.5rem' }}>⚠️</div>
        <h2 style={{ fontSize: '1.4rem', color: 'var(--cream)', marginBottom: '.5rem', fontFamily: 'var(--font-display)' }}>{title}</h2>
        <p style={{ color: 'var(--slate)', fontSize: '.88rem', lineHeight: 1.7, marginBottom: '1.5rem' }}>{message}</p>
        {email && (
          <div style={{ background: 'var(--navy-light)', border: '1px solid rgba(201,168,76,.15)', borderRadius: 'var(--radius-md)', padding: '1rem', marginBottom: '1.75rem' }}>
            <div style={{ fontSize: '.72rem', color: 'var(--slate)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: '.4rem' }}>Logged in as</div>
            <div style={{ fontSize: '.95rem', color: 'var(--gold)', fontWeight: 500 }}>{email}</div>
          </div>
        )}
        <button onClick={() => auth.signOut().then(() => window.location.href = '/login')}
          style={{ background: 'transparent', border: '1px solid rgba(138,155,181,.3)', borderRadius: 'var(--radius-sm)', color: 'var(--slate-light)', padding: '.65rem 1.5rem', cursor: 'pointer', fontSize: '.88rem', fontFamily: 'var(--font-body)' }}>
          Sign out & try a different account
        </button>
      </div>
    </div>
  );
}

function FullPageLoader() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1.25rem', background: 'var(--navy)' }}>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', color: 'var(--gold)' }}>ComplianceDesk</div>
      <div className="spinner" />
    </div>
  );
}
