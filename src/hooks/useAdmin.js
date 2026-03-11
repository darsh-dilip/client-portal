import { useMemo } from 'react';

// Checks admin purely from env variable — no Firestore read needed
// Add VITE_ADMIN_EMAILS=email1@x.com,email2@x.com in Vercel env vars
export function useAdmin(user) {
  const isAdmin = useMemo(() => {
    if (!user?.email) return false;
    const adminEmails = (import.meta.env.VITE_ADMIN_EMAILS || '')
      .split(',')
      .map(e => e.trim().toLowerCase())
      .filter(Boolean);
    return adminEmails.includes(user.email.toLowerCase());
  }, [user?.email]);

  return { isAdmin, loading: false };
}
