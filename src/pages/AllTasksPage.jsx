import React, { useMemo, useState } from 'react';
import { ListChecks } from 'lucide-react';
import TaskTable from '../components/TaskTable';
import { getEffectiveStatus } from '../utils/compliance';

const TYPES = ['GST', 'IT', 'TDS', 'OTHER'];

export default function AllTasksPage({ tasks }) {
  const [typeF, setTypeF] = useState('all');

  const filtered = useMemo(() =>
    typeF === 'all' ? tasks : tasks.filter(t => t.type === typeF)
  , [tasks, typeF]);

  const counts = useMemo(() => {
    const m = { all: tasks.length };
    TYPES.forEach(ty => { m[ty] = tasks.filter(t => t.type === ty).length; });
    return m;
  }, [tasks]);

  const TYPE_COLOR = { GST: '#c9a84c', IT: '#6fa9e8', TDS: '#4ecca3', OTHER: '#8a9bb5' };

  return (
    <div>
      <div className="fade-up" style={{ marginBottom: '1.1rem', display: 'flex', alignItems: 'center', gap: '.85rem' }}>
        <div style={{ width: 40, height: 40, background: 'var(--navy-light)', border: '1px solid rgba(201,168,76,.15)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <ListChecks size={20} color="var(--gold)" />
        </div>
        <div>
          <h1 style={{ fontSize: '1.5rem', color: 'var(--cream)' }}>All Tasks</h1>
          <p style={{ fontSize: '.78rem', color: 'var(--slate)', marginTop: '.1rem' }}>Complete filing history with advanced filters</p>
        </div>
      </div>

      {/* Type filter pills */}
      <div className="fade-up fade-up-1" style={{ display: 'flex', gap: '.55rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
        <button
          onClick={() => setTypeF('all')}
          style={{ padding: '.45rem 1rem', borderRadius: 99, fontSize: '.78rem', fontWeight: 600, cursor: 'pointer', border: typeF === 'all' ? '1px solid rgba(201,168,76,.5)' : '1px solid rgba(255,255,255,.09)', background: typeF === 'all' ? 'rgba(201,168,76,.12)' : 'transparent', color: typeF === 'all' ? 'var(--gold)' : 'var(--slate)', fontFamily: 'var(--font-body)' }}>
          All ({counts.all})
        </button>
        {TYPES.map(ty => (
          <button key={ty}
            onClick={() => setTypeF(ty)}
            style={{ padding: '.45rem 1rem', borderRadius: 99, fontSize: '.78rem', fontWeight: 600, cursor: 'pointer', border: typeF === ty ? `1px solid ${TYPE_COLOR[ty]}55` : '1px solid rgba(255,255,255,.09)', background: typeF === ty ? `${TYPE_COLOR[ty]}18` : 'transparent', color: typeF === ty ? TYPE_COLOR[ty] : 'var(--slate)', fontFamily: 'var(--font-body)' }}>
            {ty} ({counts[ty] || 0})
          </button>
        ))}
      </div>

      <div className="fade-up fade-up-2 card">
        <TaskTable tasks={filtered} title="All Tasks" />
      </div>
    </div>
  );
}
