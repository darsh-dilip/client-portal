import { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';

// ── Map service name → type category ──────────────────────────
export function serviceToType(service = '') {
  const s = service.toLowerCase();
  if (s.includes('gst') || s.includes('gstr')) return 'GST';
  if (s.includes('tds') || s.includes('tcs') || s.includes('26q') || s.includes('24q') || s.includes('27q')) return 'TDS';
  if (s.includes('itr') || s.includes('income tax') || s.includes('advance tax') || s.includes('tax audit') || s.includes('44ab')) return 'IT';
  return 'OTHER';
}

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
        // ── Step 1: Find the client document by email ──────────
        const cRef  = collection(db, 'clients');
        const cq    = query(cRef, where('email', '==', email));
        const cSnap = await getDocs(cq);

        if (cSnap.empty) {
          // No client found for this email
          setClient(null);
          setTasks([]);
          return;
        }

        const clientDoc = { id: cSnap.docs[0].id, ...cSnap.docs[0].data() };
        setClient(clientDoc);

        // ── Step 2: Fetch tasks by clientId ───────────────────
        const tRef  = collection(db, 'tasks');
        const tq    = query(tRef, where('clientId', '==', clientDoc.id));
        const tSnap = await getDocs(tq);

        const taskList = tSnap.docs.map(d => {
          const data = d.data();
          return {
            id:          d.id,
            ...data,
            // Normalise fields so the UI works consistently
            description: data.service || data.description || '',
            type:        serviceToType(data.service || data.type || ''),
            status:      (data.status || 'pending').toLowerCase(),
            dueDate:     data.dueDate || null,
            filedDate:   data.filedDate || data.completedDate || null,
            period:      data.period || data.periodYM || '',
          };
        });

        setTasks(taskList);

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
