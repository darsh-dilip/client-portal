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
        // ── Try fetching tasks with clientEmail field ─────────
        // Adjust field name below if your internal app uses something different
        const EMAIL_FIELD = 'clientEmail'; // ← change if needed

        const tRef  = collection(db, 'tasks');
        const tq    = query(tRef, where(EMAIL_FIELD, '==', email));
        const tSnap = await getDocs(tq);
        const taskList = tSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        setTasks(taskList);

        // ── Fetch client profile ──────────────────────────────
        // Try 'clients' collection first, then 'Client' (handle both casings)
        let clientData = null;
        for (const colName of ['clients', 'Client', 'Clients']) {
          try {
            const cRef  = collection(db, colName);
            const cq    = query(cRef, where('email', '==', email));
            const cSnap = await getDocs(cq);
            if (!cSnap.empty) {
              clientData = { id: cSnap.docs[0].id, ...cSnap.docs[0].data() };
              break;
            }
          } catch (_) { /* try next */ }
        }
        setClient(clientData);

      } catch (err) {
        console.error('Firestore fetch error:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [email]);

  return { tasks, client, loading, error };
}
