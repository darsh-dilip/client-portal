import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth } from '../firebase';
import { ShieldCheck } from 'lucide-react';

const provider = new GoogleAuthProvider();

export default function LoginPage() {
  const [stage,  setStage]  = useState('idle');
  const [errMsg, setErrMsg] = useState('');
  const navigate = useNavigate();

  async function handleGoogleSignIn() {
    setStage('loading');
    try {
      await signInWithPopup(auth, provider);
      navigate('/dashboard');
    } catch (err) {
      setStage('error');
      setErrMsg(err.message);
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--navy)',
      padding: '1.5rem',
      position: 'relative',
      overflow: 'hidden',
    }}>

      {[600, 400, 220].map(s => (
        <div key={s} style={{
          position: 'absolute',
          width: s, height: s,
          borderRadius: '50%',
          border: `1px solid rgba(201,168,76,${s === 220 ? .13 : s === 400 ? .08 : .04})`,
          top: '50%', left: '50%',
          transform: 'translate(-50%,-50%)',
          pointerEvents: 'none',
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

        <div style={{ textAlign: 'center', marginBottom: '2.25rem' }}>
          <div style={{
            width: 54, height: 54,
            background: 'linear-gradient(135deg, var(--gold-dim), var(--gold))',
            borderRadius: 16,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 1.1rem',
            boxShadow: '0 8px 24px rgba(201,168,76,.25)',
          }}>
            <ShieldCheck size={26} color="var(--navy)" />
          </div>
          <h1 style={{ fontSize: '1.65rem', color: 'var(--gold)', marginBottom: '.3rem' }}>
            ComplianceDesk
          </h1>
          <p style={{ color: 'var(--slate)', fontSize: '.88rem' }}>
            Client Portal · Secure Access
          </p>
        </div>

        <div style={{
          background: 'rgba(201,168,76,.06)',
          border: '1px solid rgba(201,168,76,.15)',
          borderRadius: 'var(--radius-md)',
          padding: '1rem 1.1rem',
          marginBottom: '1.75rem',
          fontSize: '.82rem',
          color: 'var(--slate-light)',
          lineHeight: 1.6,
        }}>
          Sign in with the Google account linked to your email on file with us.
          You will only see your own compliance data.
        </div>

        {stage === 'error' && (
          <div style={{
            background: 'var(--red-bg)',
            border: '1px solid rgba(201,76,76,.3)',
            borderRadius: 'var(--radius-sm)',
            padding: '.85rem 1rem',
            marginBottom: '1.25rem',
            fontSize: '.82rem',
            color: '#e87070',
          }}>
            {errMsg}
          </div>
        )}

        {stage === 'loading' ? (
          <div style={{ textAlign: 'center', padding: '1rem 0' }}>
            <div className="spinner" style={{ margin: '0 auto 1rem' }} />
            <p style={{ color: 'var(--slate-light)', fontSize: '.88rem' }}>Signing you in...</p>
          </div>
        ) : (
          <button
            onClick={handleGoogleSignIn}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.85rem',
              padding: '0.85rem 1.5rem',
              background: '#fff',
              color: '#1f1f1f',
              border: 'none',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.95rem',
              fontWeight: 600,
              fontFamily: 'var(--font-body)',
              cursor: 'pointer',
              transition: 'all .2s',
              boxShadow: '0 2px 8px rgba(0,0,0,.3)',
            }}
            onMouseOver={e => e.currentTarget.style.transform = 'translateY(-1px)'}
            onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}
          >
            <svg width="20" height="20" viewBox="0 0 48 48">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
            </svg>
            Continue with Google
          </button>
        )}

        <div style={{
          marginTop: '1.75rem',
          paddingTop: '1.25rem',
          borderTop: '1px solid rgba(201,168,76,.08)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '.5rem',
          fontSize: '.72rem',
          color: 'var(--slate)',
        }}>
          <ShieldCheck size={12} />
          256-bit encrypted · Read-only access · Secured by Google
        </div>
      </div>
    </div>
  );
}
