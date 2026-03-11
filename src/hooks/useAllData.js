import { useState, useEffect } from 'react';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { db } from '../firebase';

export function useAllData() {
  const [clients, setClients] = useState([]);
  const [tasks,   setTasks]   = useState([]);
  const [users,   setUsers]   = useState({});   // uid → user doc
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  useEffect(() => {
    async function fetch() {
      try {
        const [cSnap, tSnap, uSnap] = await Promise.all([
          getDocs(collection(db, 'clients')),
          getDocs(query(collection(db, 'tasks'), orderBy('dueDate'), limit(3000))),
          getDocs(collection(db, 'users')),
        ]);

        const clientMap = {};
        const clientList = cSnap.docs.map(d => {
          const o = { id: d.id, ...d.data() };
          clientMap[d.id] = o;
          return o;
        });

        const userMap = {};
        uSnap.docs.forEach(d => { userMap[d.id] = { uid: d.id, ...d.data() }; });

        const taskList = tSnap.docs.map(d => {
          const t = { id: d.id, ...d.data() };
          t._client = clientMap[t.clientId] || null;
          t._user   = userMap[t.assignedTo]  || null;
          return t;
        });

        setClients(clientList);
        setTasks(taskList);
        setUsers(userMap);
      } catch(e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    }
    fetch();
  }, []);

  return { clients, tasks, users, loading, error };
}
