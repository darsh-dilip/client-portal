import { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';

export function useIsAdmin(user) {
  const [isAdmin,  setIsAdmin]  = useState(false);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    if (!user?.email) { setLoading(false); return; }

    async function check() {
      try {
        const q    = query(
          collection(db, 'adminUsers'),
          where('email', '==', user.email)
        );
        const snap = await getDocs(q);
        setIsAdmin(!snap.empty);
      } catch {
        setIsAdmin(false);
      } finally {
        setLoading(false);
      }
    }
    check();
  }, [user?.email]);

  return { isAdmin, loading };
}
