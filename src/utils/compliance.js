// ── Status helpers ─────────────────────────────────────────────────────────

const FILED_STATUSES = ['completed', 'nil_filed', 'filed', 'nil filed'];

export function getEffectiveStatus(task) {
  const s = (task.status || 'pending').toLowerCase().trim();
  if (FILED_STATUSES.includes(s)) return 'completed';
  if (task.dueDate && toDate(task.dueDate) < new Date()) return 'overdue';
  if (s === 'in-progress' || s === 'in progress' || s === 'wip') return 'in-progress';
  return 'pending'; // covers: pending, data_pending, on_hold, etc.
}

// Show the raw Firestore status label faithfully
export function formatRawStatus(status) {
  const map = {
    pending:       'Pending',
    completed:     'Filed',
    nil_filed:     'Nil Filed',
    'nil filed':   'Nil Filed',
    data_pending:  'Data Pending',
    'data pending':'Data Pending',
    'in-progress': 'In Progress',
    'in progress': 'In Progress',
    wip:           'In Progress',
    on_hold:       'On Hold',
    'on hold':     'On Hold',
    refused:       'Refused',
    filed:         'Filed',
  };
  return map[(status || '').toLowerCase().trim()] || status || 'Pending';
}

// Badge colour based on effective status
export function getStatusColor(status) {
  switch (status) {
    case 'completed':    return 'green';
    case 'in-progress':  return 'blue';
    case 'overdue':      return 'red';
    case 'pending':      return 'amber';
    default:             return 'slate';
  }
}

// Legacy — kept for backwards compat
export function friendlyStatus(status) {
  return formatRawStatus(status);
}

// ── Score calculation ──────────────────────────────────────────────────────

export function calcComplianceScore(tasks) {
  if (!tasks.length) return null;
  const now = new Date();
  let totalWeight = 0, earnedWeight = 0;

  tasks.forEach(t => {
    const weight    = getTaskWeight(t);
    const dueDate   = toDate(t.dueDate);
    const effective = getEffectiveStatus(t);

    totalWeight += weight;
    if (effective === 'completed') {
      const filedDate = toDate(t.filedDate);
      const onTime    = !t.filedDate || filedDate <= dueDate;
      earnedWeight   += onTime ? weight : weight * 0.6;
    } else if (effective === 'overdue') {
      earnedWeight += 0;
    } else if (effective === 'in-progress') {
      earnedWeight += weight * 0.5;
    } else {
      earnedWeight += weight * 0.7;
    }
  });

  return Math.round((earnedWeight / totalWeight) * 100);
}

function getTaskWeight(task) {
  const type = (task.type || '').toUpperCase();
  if (type === 'IT')  return 5;
  if (type === 'TDS') return 4;
  if (type === 'GST') return 3;
  return 2;
}

export function scoreToGrade(score) {
  if (score === null) return { grade: '—', color: 'var(--slate)' };
  if (score >= 90) return { grade: 'A+', color: '#4ecca3' };
  if (score >= 75) return { grade: 'A',  color: '#4ecca3' };
  if (score >= 60) return { grade: 'B',  color: '#c9a84c' };
  if (score >= 45) return { grade: 'C',  color: '#c9a84c' };
  return               { grade: 'D',  color: '#e87070' };
}

// ── Date helpers ───────────────────────────────────────────────────────────

export function toDate(val) {
  if (!val) return new Date(0);
  if (val.toDate)   return val.toDate();
  if (val.seconds)  return new Date(val.seconds * 1000);
  return new Date(val);
}

// Derive FY from a "YYYY-MM-DD" dueDate string
export function fyFromDate(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  const y = d.getFullYear(), m = d.getMonth(); // 0-based
  return m >= 3 ? `${y}-${String(y + 1).slice(2)}` : `${y - 1}-${String(y).slice(2)}`;
}

export function allFYs(tasks) {
  const set = new Set(tasks.map(t => t.fy || fyFromDate(t.dueDate)).filter(Boolean));
  return Array.from(set).sort().reverse();
}
