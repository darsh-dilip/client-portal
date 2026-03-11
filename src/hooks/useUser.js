import { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';

const _cache = {};

export function useUser(uid) {
  const [user, setUser] = useState(_cache[uid] || null);

  useEffect(() => {
    if (!uid) return;
    if (_cache[uid]) { setUser(_cache[uid]); return; }
    getDoc(doc(db, 'users', uid)).then(snap => {
      const data = snap.exists()
        ? { uid, ...snap.data() }
        : { uid, name: 'Team Member', email: '', phone: '', init: '?' };
      _cache[uid] = data;
      setUser(data);
    }).catch(() => {});
  }, [uid]);

  return user;
}
