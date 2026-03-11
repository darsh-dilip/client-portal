import { collection, addDoc, query, orderBy, limit, getDocs, where, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';

// ── Write an audit event ───────────────────────────────────────────────────
export async function logEvent(user, event, detail = '') {
  if (!user?.email) return;
  try {
    await addDoc(collection(db, 'auditLogs'), {
      email:     user.email,
      name:      user.displayName || user.email,
      uid:       user.uid,
      event,               // e.g. "LOGIN", "VIEW_DASHBOARD", "VIEW_GST"
      detail,              // extra context
      timestamp: serverTimestamp(),
      userAgent: navigator.userAgent,
    });
  } catch (e) {
    // Silently fail — never break the app for audit errors
    console.warn('Audit log failed:', e.message);
  }
}

// ── Read audit logs (admin) ────────────────────────────────────────────────
export async function fetchAllAuditLogs(limitCount = 200) {
  const q = query(
    collection(db, 'auditLogs'),
    orderBy('timestamp', 'desc'),
    limit(limitCount)
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

// ── Read own audit logs (client) ───────────────────────────────────────────
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
