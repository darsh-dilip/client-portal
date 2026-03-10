import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  sendSignInLinkToEmail,
  isSignInWithEmailLink,
  signInWithEmailLink,
} from 'firebase/auth';
import { auth } from '../firebase';
import { Mail, ArrowRight, CheckCircle, ShieldCheck } from 'lucide-react';

const ACTION_CODE_SETTINGS = {
  url: window.location.origin + '/auth/callback',
  handleCodeInApp: true,
};

export default function LoginPage() {
  const [email,   setEmail]   = useState('');
  const [stage,   setStage]   = useState('input');   // input | sent | verifying | error
  const [errMsg,  setErrMsg]  = useState('');
  const navigate = useNavigate();

  // ── Handle the magic-link callback ────────────────────────
  useEffect(() => {
    if (!isSignInWithEmailLink(auth, window.location.href)) return;

    setStage('verifying');
    let emailForSignIn = window.localStorage.getItem('emailForSignIn');

    if (!emailForSignIn) {
      emailForSignIn = window.prompt('Please confirm your email address:');
    }

    signInWithEmailLink(auth, emailForSignIn, window.location.href)
      .then(() => {
        window.localStorage.removeItem('emailForSignIn');
        navigate('/dashboard');
      })
      .catch(err => {
        setStage('error');
        setErrMsg(err.message);
      });
  }, [navigate]);

  // ── Send magic link ────────────────────────────────────────
  async function handleSend(e) {
    e.preventDefault();
    if (!email) return;

    setStage('verifying');
    try {
      await sendSignInLinkToEmail(auth, email, ACTION_CODE_SETTINGS);
      window.localStorage.setItem('emailForSignIn', email);
      setStage('sent');
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

      {/* ── Background decorative rings ─── */}
      <div style={{
        position: 'absolute',
        width: 600, height: 600,
        borderRadius: '50%',
        border: '1px solid rgba(201,168,76,.06)',
        top: '50%', left: '50%',
        transform: 'translate(-50%,-50%)',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute',
        width: 400, height: 400,
        borderRadius: '50%',
        border: '1px solid rgba(201,168,76,.09)',
        top: '50%', left: '50%',
        transform: 'translate(-50%,-50%)',
        pointerEvents: 'none',
      }} />

      <div className="fade-up" style={{
        width: '100%', maxWidth: 420,
        background: 'var(--navy-mid)',
        border: '1px solid rgba(201,168,76,.15)',
        borderRadius: 'var(--radius-xl)',
        padding: '2.5rem',
        boxShadow: '0 24px 64px rgba(0,0,0,.6)',
        position: 'relative',
      }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            width: 52, height: 52,
            background: 'linear-gradient(135deg, var(--gold-dim), var(--gold))',
            borderRadius: 14,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 1rem',
          }}>
            <ShieldCheck size={24} color="var(--navy)" />
          </div>
          <h1 style={{ fontSize: '1.6rem', color: 'var(--gold)', marginBottom: '.3rem' }}>
            ComplianceDesk
          </h1>
          <p style={{ color: 'var(--slate)', fontSize: '.88rem' }}>
            Client Portal · Secure Access
          </p>
        </div>

        {/* ── Stage: input ─────────────────────────────────── */}
        {stage === 'input' && (
          <form onSubmit={handleSend}>
            <label style={{ display: 'block', marginBottom: '.5rem', fontSize: '.82rem', color: 'var(--slate)', letterSpacing: '.04em', textTransform: 'uppercase' }}>
              Your Email Address
            </label>
            <div style={{ position: 'relative', marginBottom: '1.25rem' }}>
              <Mail size={15} style={{ position: 'absolute', left: '.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--slate)' }} />
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="yourname@example.com"
                style={{ paddingLeft: '2.3rem' }}
              />
            </div>
            <button type="submit" className="btn btn-gold" style={{ width: '100%' }}>
              Send Magic Link
              <ArrowRight size={16} />
            </button>
            <p style={{ marginTop: '1rem', fontSize: '.78rem', color: 'var(--slate)', textAlign: 'center', lineHeight: 1.6 }}>
              A secure sign-in link will be sent to your email.<br />
              No password needed.
            </p>
          </form>
        )}

        {/* ── Stage: verifying ─────────────────────────────── */}
        {stage === 'verifying' && (
          <div style={{ textAlign: 'center', padding: '1rem 0' }}>
            <div className="spinner" style={{ margin: '0 auto 1rem' }} />
            <p style={{ color: 'var(--slate-light)' }}>Processing…</p>
          </div>
        )}

        {/* ── Stage: sent ──────────────────────────────────── */}
        {stage === 'sent' && (
          <div className="fade-up" style={{ textAlign: 'center' }}>
            <div style={{
              width: 60, height: 60,
              background: 'var(--green-bg)',
              borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 1.25rem',
              animation: 'pulse-ring 2s infinite',
            }}>
              <CheckCircle size={26} color="#4ecca3" />
            </div>
            <h2 style={{ fontSize: '1.3rem', marginBottom: '.5rem' }}>Check Your Inbox</h2>
            <p style={{ color: 'var(--slate)', fontSize: '.88rem', lineHeight: 1.7 }}>
              A magic sign-in link has been sent to<br />
              <strong style={{ color: 'var(--gold-light)' }}>{email}</strong>.<br />
              Click the link to access your portal.
            </p>
            <p style={{ marginTop: '1rem', fontSize: '.75rem', color: 'var(--slate)' }}>
              Link expires in 1 hour · Check spam if not received
            </p>
            <button
              className="btn btn-outline"
              style={{ marginTop: '1.5rem', fontSize: '.82rem' }}
              onClick={() => setStage('input')}
            >
              Use a different email
            </button>
          </div>
        )}

        {/* ── Stage: error ─────────────────────────────────── */}
        {stage === 'error' && (
          <div className="fade-up">
            <div style={{
              background: 'var(--red-bg)',
              border: '1px solid rgba(201,76,76,.3)',
              borderRadius: 'var(--radius-md)',
              padding: '1rem',
              marginBottom: '1rem',
              fontSize: '.85rem',
              color: '#e87070',
            }}>
              {errMsg}
            </div>
            <button
              className="btn btn-gold"
              style={{ width: '100%' }}
              onClick={() => { setStage('input'); setErrMsg(''); }}
            >
              Try Again
            </button>
          </div>
        )}

        {/* Security badge */}
        <div style={{
          marginTop: '2rem',
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
          256-bit encrypted · Read-only access · OTP-secured
        </div>
      </div>
    </div>
  );
}
