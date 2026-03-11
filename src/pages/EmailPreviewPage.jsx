/**
 * Admin-only dev page to preview email templates live.
 * Route: /admin/email-preview
 */
import React, { useState } from 'react';
import { monthlyDigestEmail, reminderEmail } from '../utils/emailTemplates';

const SAMPLE_TASKS = [
  { id:'t1', type:'GST', description:'GSTR-1',             period:'Mar 2026', dueDate:'2026-04-10', fy:'2025-26', status:'pending'   },
  { id:'t2', type:'GST', description:'GSTR-3B',            period:'Mar 2026', dueDate:'2026-04-19', fy:'2025-26', status:'pending'   },
  { id:'t3', type:'TDS', description:'TDS Return 26Q',     period:'Q4 (Jan–Mar)', dueDate:'2026-04-30', fy:'2025-26', status:'pending' },
  { id:'t4', type:'IT',  description:'Advance Tax',        period:'Q4 FY26',  dueDate:'2026-03-15', fy:'2025-26', status:'completed' },
  { id:'t5', type:'GST', description:'GSTR-2B Reconciliation',period:'Mar 2026',dueDate:'2026-04-14',fy:'2025-26',status:'data_pending'},
];

export default function EmailPreviewPage() {
  const [mode, setMode] = useState('monthly');
  const [days, setDays] = useState(5);

  const html = mode === 'monthly'
    ? monthlyDigestEmail({ clientName: 'BAPL', month: 4, year: 2026, tasks: SAMPLE_TASKS })
    : reminderEmail({ clientName: 'BAPL', task: SAMPLE_TASKS[0], daysLeft: days });

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '1rem 1.5rem', background: '#0f1c2e', borderBottom: '1px solid rgba(201,168,76,.15)', display: 'flex', gap: '1rem', alignItems: 'center' }}>
        <select value={mode} onChange={e => setMode(e.target.value)}>
          <option value="monthly">Monthly Digest</option>
          <option value="reminder">5-Day Reminder</option>
        </select>
        {mode === 'reminder' && (
          <label style={{ display: 'flex', alignItems: 'center', gap: '.5rem', fontSize: '.85rem', color: 'var(--slate)' }}>
            Days left:
            <input type="number" value={days} onChange={e => setDays(+e.target.value)} min={1} max={10} style={{ width: 60 }} />
          </label>
        )}
        <button className="btn btn-outline" style={{ fontSize: '.8rem' }} onClick={() => {
          const w = window.open('', '_blank'); w.document.write(html); w.document.close();
        }}>Open in Tab</button>
      </div>
      <iframe srcDoc={html} style={{ flex: 1, border: 'none', background: '#fff' }} title="Email Preview" />
    </div>
  );
}
