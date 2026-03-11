import { collection, addDoc, query, orderBy, limit, getDocs, where, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../firebase';

// ── Plain async helper (usable anywhere) ─────────────────────────────────
export async function logEvent(user, event, detail = '') {
  if (!user?.email) return;
  try {
    await addDoc(collection(db, 'auditLogs'), {
      email:     user.email,
      name:      user.displayName || user.email,
      uid:       user.uid,
      event,
      detail:    typeof detail === 'string' ? detail : JSON.stringify(detail),
      timestamp: serverTimestamp(),
      userAgent: navigator.userAgent,
    });
  } catch (e) {
    console.warn('Audit log failed:', e.message);
  }
}

// ── React hook — returns a bound logEvent that auto-injects the current user
export function useAuditLog(user) {
  // Accept user as param, or fall back to auth.currentUser
  function log(event, detail = '') {
    const u = user || auth.currentUser;
    return logEvent(u, event, detail);
  }
  return { logEvent: log };
}

// ── Admin: read all audit logs ────────────────────────────────────────────
export async function fetchAllAuditLogs(limitCount = 200) {
  const q = query(
    collection(db, 'auditLogs'),
    orderBy('timestamp', 'desc'),
    limit(limitCount)
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

// ── Client: read own audit logs ───────────────────────────────────────────
export async function fetchMyAuditLogs(email, limitCount = 30) {
  const q = query(
    collection(db, 'auditLogs'),
    where('email', '==', email),
    orderBy('timestamp', 'desc'),
    limit(limitCount)
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}
