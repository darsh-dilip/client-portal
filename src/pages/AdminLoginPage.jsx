import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase';
import { ShieldCheck, Lock, Mail } from 'lucide-react';

export default function AdminLoginPage() {
  const [email,   setEmail]   = useState('');
  const [pass,    setPass]    = useState('');
  const [loading, setLoading] = useState(false);
  const [errMsg,  setErrMsg]  = useState('');
  const navigate = useNavigate();

  async function handleLogin(e) {
    e.preventDefault();
    setLoading(true);
    setErrMsg('');
    try {
      await signInWithEmailAndPassword(auth, email, pass);
      navigate('/admin');
    } catch (err) {
      setErrMsg('Invalid email or password.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', background: 'var(--navy)',
      padding: '1.5rem', position: 'relative', overflow: 'hidden',
    }}>
      {[600, 400, 220].map(s => (
        <div key={s} style={{
          position: 'absolute', width: s, height: s, borderRadius: '50%',
          border: `1px solid rgba(201,168,76,${s===220?.13:s===400?.08:.04})`,
          top: '50%', left: '50%', transform: 'translate(-50%,-50%)', pointerEvents: 'none',
        }} />
      ))}

      <div className="fade-up" style={{
        width: '100%', maxWidth: 400,
        background: 'var(--navy-mid)',
        border: '1px solid rgba(201,168,76,.15)',
        borderRadius: 'var(--radius-xl)',
        padding: '2.5rem',
        boxShadow: '0 24px 64px rgba(0,0,0,.6)',
      }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            width: 54, height: 54,
            background: 'linear-gradient(135deg, #1e3050, #3a7bd5)',
            borderRadius: 16, display: 'flex', alignItems: 'center',
            justifyContent: 'center', margin: '0 auto 1rem',
            boxShadow: '0 8px 24px rgba(58,123,213,.25)',
          }}>
            <ShieldCheck size={26} color="#fff" />
          </div>
          <h1 style={{ fontSize: '1.5rem', color: 'var(--gold)', marginBottom: '.3rem' }}>Admin Panel</h1>
          <p style={{ color: 'var(--slate)', fontSize: '.85rem' }}>ComplianceDesk · Internal Access Only</p>
        </div>

        {errMsg && (
          <div style={{
            background: 'var(--red-bg)', border: '1px solid rgba(201,76,76,.3)',
            borderRadius: 'var(--radius-sm)', padding: '.85rem 1rem',
            marginBottom: '1.25rem', fontSize: '.82rem', color: '#e87070',
          }}>{errMsg}</div>
        )}

        <form onSubmit={handleLogin}>
          <label style={{ display: 'block', marginBottom: '.4rem', fontSize: '.78rem', color: 'var(--slate)', textTransform: 'uppercase', letterSpacing: '.05em' }}>
            Admin Email
          </label>
          <div style={{ position: 'relative', marginBottom: '1rem' }}>
            <Mail size={14} style={{ position: 'absolute', left: '.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--slate)' }} />
            <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
              placeholder="admin@yourfirm.com" style={{ paddingLeft: '2.3rem' }} />
          </div>

          <label style={{ display: 'block', marginBottom: '.4rem', fontSize: '.78rem', color: 'var(--slate)', textTransform: 'uppercase', letterSpacing: '.05em' }}>
            Password
          </label>
          <div style={{ position: 'relative', marginBottom: '1.5rem' }}>
            <Lock size={14} style={{ position: 'absolute', left: '.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--slate)' }} />
            <input type="password" required value={pass} onChange={e => setPass(e.target.value)}
              placeholder="••••••••" style={{ paddingLeft: '2.3rem' }} />
          </div>

          <button type="submit" className="btn btn-gold" style={{ width: '100%' }} disabled={loading}>
            {loading ? <><div className="spinner" style={{width:16,height:16}}/> Signing in…</> : 'Sign In to Admin Panel'}
          </button>
        </form>

        <div style={{
          marginTop: '1.75rem', paddingTop: '1.25rem',
          borderTop: '1px solid rgba(201,168,76,.08)',
          textAlign: 'center', fontSize: '.72rem', color: 'var(--slate)',
        }}>
          <a href="/login" style={{ color: 'var(--slate)', textDecoration: 'underline' }}>
            ← Client login
          </a>
        </div>
      </div>
    </div>
  );
}
