import { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';

export function useClientData(email) {
  const [tasks,   setTasks]   = useState([]);
  const [client,  setClient]  = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  useEffect(() => {
    if (!email) return;

    async function fetchData() {
      setLoading(true);
      setError(null);
      try {
        // ── Fetch tasks belonging to this client ────────────────
        const tRef = collection(db, 'tasks');
        const tq   = query(tRef, where('clientEmail', '==', email));
        const tSnap = await getDocs(tq);
        const taskList = tSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        setTasks(taskList);

        // ── Fetch client profile ────────────────────────────────
        const cRef  = collection(db, 'clients');
        const cq    = query(cRef, where('email', '==', email));
        const cSnap = await getDocs(cq);
        if (!cSnap.empty) setClient({ id: cSnap.docs[0].id, ...cSnap.docs[0].data() });
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [email]);

  return { tasks, client, loading, error };
}
