import React, { useState, useEffect } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Bell, BellOff, ShieldOff } from 'lucide-react';

// Task service types that can have alerts toggled
const ALERT_TYPES = [
  { key: 'gst_monthly',    label: 'GST Monthly Digest',       desc: 'Monthly email on 1st with all GST due dates',          type: 'GST',   icon: '🧾' },
  { key: 'gst_reminder',   label: 'GST 5-Day Reminder',        desc: 'Reminder 5 days before each GST due date',             type: 'GST',   icon: '⏰' },
  { key: 'it_monthly',     label: 'Income Tax Monthly Digest', desc: 'Monthly email on 1st with all IT due dates',           type: 'IT',    icon: '📋' },
  { key: 'it_reminder',    label: 'Income Tax 5-Day Reminder', desc: 'Reminder 5 days before each IT due date',              type: 'IT',    icon: '⏰' },
  { key: 'tds_monthly',    label: 'TDS Monthly Digest',        desc: 'Monthly email on 1st with all TDS due dates',          type: 'TDS',   icon: '📄' },
  { key: 'tds_reminder',   label: 'TDS 5-Day Reminder',        desc: 'Reminder 5 days before each TDS due date',             type: 'TDS',   icon: '⏰' },
  { key: 'other_monthly',  label: 'Other Filings Digest',      desc: 'Monthly email on 1st with other due dates',            type: 'OTHER', icon: '📬' },
];

const TYPE_COLOR = { GST: '#c9a84c', IT: '#6fa9e8', TDS: '#4ecca3', OTHER: '#8a9bb5' };

// ── Animated toggle switch ─────────────────────────────────────────────────
function Toggle({ on, onChange, disabled }) {
  return (
    <button
      onClick={() => !disabled && onChange(!on)}
      disabled={disabled}
      style={{
        width: 46, height: 26, borderRadius: 13, border: 'none', cursor: disabled ? 'not-allowed' : 'pointer',
        background: on ? '#4ecca3' : 'rgba(255,255,255,.12)',
        position: 'relative', flexShrink: 0,
        transition: 'background .25s',
        opacity: disabled ? .4 : 1,
      }}>
      <div style={{
        width: 20, height: 20, borderRadius: '50%', background: '#fff',
        position: 'absolute', top: 3,
        left: on ? 23 : 3,
        transition: 'left .25s cubic-bezier(.34,1.56,.64,1)',
        boxShadow: '0 1px 4px rgba(0,0,0,.35)',
      }}/>
    </button>
  );
}

export default function AlertsPage({ user, client }) {
  const [prefs,   setPrefs]   = useState(null);
  const [saving,  setSaving]  = useState(false);
  const [saved,   setSaved]   = useState(false);
  const [loading, setLoading] = useState(true);

  const clientSuppressed = ['on_hold', 'on hold', 'discontinued'].includes((client?.clientStatus || '').toLowerCase());

  useEffect(() => {
    if (!user?.uid) return;
    getDoc(doc(db, 'alertPrefs', user.uid))
      .then(snap => {
        if (snap.exists()) setPrefs(snap.data());
        else {
          // Default: all on
          const defaults = {};
          ALERT_TYPES.forEach(a => { defaults[a.key] = true; });
          setPrefs(defaults);
        }
      })
      .catch(() => {
        const defaults = {};
        ALERT_TYPES.forEach(a => { defaults[a.key] = true; });
        setPrefs(defaults);
      })
      .finally(() => setLoading(false));
  }, [user?.uid]);

  async function handleToggle(key, val) {
    const next = { ...prefs, [key]: val };
    setPrefs(next);
    setSaving(true);
    try {
      await setDoc(doc(db, 'alertPrefs', user.uid), next, { merge: true });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch(e) {
      console.error('Failed to save prefs:', e);
    } finally {
      setSaving(false);
    }
  }

  const typeGroups = {};
  ALERT_TYPES.forEach(a => {
    if (!typeGroups[a.type]) typeGroups[a.type] = [];
    typeGroups[a.type].push(a);
  });

  return (
    <div>
      <div className="fade-up" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', marginBottom: '1.1rem', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '.85rem' }}>
          <div style={{ width: 40, height: 40, background: 'var(--navy-light)', border: '1px solid rgba(201,168,76,.15)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Bell size={20} color="var(--gold)" />
          </div>
          <div>
            <h1 style={{ fontSize: '1.5rem', color: 'var(--cream)' }}>Email Alerts</h1>
            <p style={{ fontSize: '.78rem', color: 'var(--slate)', marginTop: '.1rem' }}>Choose which reminders you want to receive</p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '.65rem', fontSize: '.78rem' }}>
          {saving && <span style={{ color: 'var(--slate)' }}>Saving…</span>}
          {saved  && <span style={{ color: '#4ecca3' }}>✓ Saved</span>}
        </div>
      </div>

      {/* Client suppression banner */}
      {clientSuppressed && (
        <div className="fade-up" style={{ display: 'flex', alignItems: 'center', gap: '.85rem', background: 'rgba(232,112,112,.08)', border: '1px solid rgba(232,112,112,.25)', borderRadius: 'var(--radius-md)', padding: '.85rem 1.1rem', marginBottom: '1.25rem' }}>
          <ShieldOff size={18} color="#e87070" />
          <div>
            <div style={{ fontSize: '.88rem', color: '#e87070', fontWeight: 600, marginBottom: '.1rem' }}>Alerts suppressed</div>
            <div style={{ fontSize: '.78rem', color: 'var(--slate)' }}>Your account status is <strong style={{ color: '#e87070' }}>{client?.clientStatus}</strong> — no email alerts will be sent while this status is active.</div>
          </div>
        </div>
      )}

      {/* How alerts work */}
      <div className="fade-up fade-up-1" style={{ background: 'rgba(201,168,76,.05)', border: '1px solid rgba(201,168,76,.15)', borderRadius: 'var(--radius-md)', padding: '.85rem 1.1rem', marginBottom: '1.25rem' }}>
        <div style={{ fontSize: '.8rem', color: 'var(--gold)', fontWeight: 600, marginBottom: '.4rem' }}>📧 How alerts work</div>
        <div style={{ fontSize: '.78rem', color: 'var(--slate-light)', lineHeight: 1.7 }}>
          <strong>Monthly digest</strong> — Sent on the 1st of each month with a calendar view of all due dates.<br/>
          <strong>5-day reminder</strong> — Sent 5 days before each filing due date (skipped if already filed).
        </div>
      </div>

      {loading ? (
        <div style={{ padding: '3rem', textAlign: 'center' }}><div className="spinner" style={{ margin: '0 auto' }} /></div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
          {Object.entries(typeGroups).map(([type, items]) => {
            const col = TYPE_COLOR[type] || '#8a9bb5';
            return (
              <div key={type} className="fade-up card" style={{ padding: '1.1rem 1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', marginBottom: '1rem', paddingBottom: '.8rem', borderBottom: '1px solid rgba(255,255,255,.06)' }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: col }} />
                  <span style={{ fontSize: '.85rem', color: col, fontWeight: 600 }}>{type === 'OTHER' ? 'Other Filings' : type + ' Alerts'}</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '.75rem' }}>
                  {items.map(alert => {
                    const isOn = prefs?.[alert.key] ?? true;
                    return (
                      <div key={alert.key} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '.75rem .85rem', background: 'var(--navy-light)', borderRadius: 'var(--radius-md)', border: `1px solid ${isOn && !clientSuppressed ? col + '25' : 'rgba(255,255,255,.05)'}`, transition: 'border-color .25s' }}>
                        <span style={{ fontSize: '1.15rem', flexShrink: 0 }}>{alert.icon}</span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: '.88rem', color: 'var(--cream)', fontWeight: 500 }}>{alert.label}</div>
                          <div style={{ fontSize: '.72rem', color: 'var(--slate)', marginTop: '.15rem' }}>{alert.desc}</div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '.6rem', flexShrink: 0 }}>
                          {isOn && !clientSuppressed
                            ? <Bell size={13} color={col} />
                            : <BellOff size={13} color="var(--slate)" />}
                          <Toggle on={isOn} onChange={val => handleToggle(alert.key, val)} disabled={clientSuppressed} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
