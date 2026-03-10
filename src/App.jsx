import React from 'react';
import {
  BrowserRouter, Routes, Route, Navigate, useLocation
} from 'react-router-dom';
import { isSignInWithEmailLink } from 'firebase/auth';
import { auth } from './firebase';
import { useAuth } from './hooks/useAuth';
import { useClientData } from './hooks/useClientData';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import { GSTPage, ITPage, TDSPage } from './pages/FilingPages';
import CalendarPage from './pages/CalendarPage';

// ── Auth guard ──────────────────────────────────────────────
function RequireAuth({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <FullPageLoader />;
  if (!user)   return <Navigate to="/login" state={{ from: location }} replace />;
  return children;
}

// ── Authenticated shell: fetches data once and passes down ──
function AuthenticatedApp() {
  const { user, loading: authLoading } = useAuth();
  const { tasks, client, loading: dataLoading, error } = useClientData(user?.email);

  if (authLoading || dataLoading) return <FullPageLoader />;

  if (error) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#e87070', padding: '2rem', textAlign: 'center' }}>
      <div>
        <div style={{ fontSize: '1.2rem', marginBottom: '.5rem' }}>Unable to load data</div>
        <div style={{ fontSize: '.85rem', color: 'var(--slate)' }}>{error}</div>
      </div>
    </div>
  );

  return (
    <Layout user={user} client={client}>
      <Routes>
        <Route path="/dashboard" element={<DashboardPage tasks={tasks} client={client} />} />
        <Route path="/gst"       element={<GSTPage tasks={tasks} />} />
        <Route path="/it"        element={<ITPage  tasks={tasks} />} />
        <Route path="/tds"       element={<TDSPage tasks={tasks} />} />
        <Route path="/calendar"  element={<CalendarPage tasks={tasks} />} />
        <Route path="*"          element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Layout>
  );
}

export default function App() {
  // If the URL is a magic-link callback, render Login so it can handle it
  const isMagicLink = isSignInWithEmailLink(auth, window.location.href);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login"         element={<LoginPage />} />
        <Route path="/auth/callback" element={<LoginPage />} />
        <Route path="/*" element={
          isMagicLink
            ? <LoginPage />
            : <RequireAuth><AuthenticatedApp /></RequireAuth>
        } />
      </Routes>
    </BrowserRouter>
  );
}

function FullPageLoader() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '1.25rem',
      background: 'var(--navy)',
    }}>
      <div style={{
        fontFamily: 'var(--font-display)',
        fontSize: '1.4rem',
        color: 'var(--gold)',
      }}>
        ComplianceDesk
      </div>
      <div className="spinner" />
    </div>
  );
}
