/**
 * Calculates an overall compliance score (0–100) from a task list.
 *
 * Scoring logic:
 *  - Completed on time  → full weight
 *  - Completed late     → 60% weight
 *  - In-progress        → 50% weight
 *  - Pending (not due)  → 70% weight  (benefit of doubt)
 *  - Overdue            → 0% weight
 */
export function calcComplianceScore(tasks) {
  if (!tasks.length) return null;

  const now = new Date();

  let totalWeight = 0;
  let earnedWeight = 0;

  tasks.forEach(t => {
    const weight = getTaskWeight(t);
    const dueDate = t.dueDate?.toDate ? t.dueDate.toDate() : new Date(t.dueDate || Date.now());
    const isOverdue = dueDate < now && t.status !== 'completed';

    totalWeight += weight;

    if (t.status === 'completed') {
      const filedDate = t.filedDate?.toDate ? t.filedDate.toDate() : null;
      const onTime = !filedDate || filedDate <= dueDate;
      earnedWeight += onTime ? weight : weight * 0.6;
    } else if (isOverdue) {
      earnedWeight += 0;
    } else if (t.status === 'in-progress') {
      earnedWeight += weight * 0.5;
    } else {
      // pending but not yet due
      earnedWeight += weight * 0.7;
    }
  });

  return Math.round((earnedWeight / totalWeight) * 100);
}

/** Higher weight for statutory filings */
function getTaskWeight(task) {
  const type = (task.type || '').toUpperCase();
  if (type === 'IT')  return 5;   // Income Tax – highest priority
  if (type === 'TDS') return 4;
  if (type === 'GST') return 3;
  return 2;                        // Ad-hoc / other
}

export function scoreToGrade(score) {
  if (score === null) return { grade: '—', color: 'slate' };
  if (score >= 90) return { grade: 'A+', color: 'green' };
  if (score >= 75) return { grade: 'A',  color: 'green' };
  if (score >= 60) return { grade: 'B',  color: 'amber' };
  if (score >= 45) return { grade: 'C',  color: 'amber' };
  return              { grade: 'D',  color: 'red'   };
}

export function getStatusColor(status) {
  switch ((status || '').toLowerCase()) {
    case 'completed':   return 'green';
    case 'in-progress': return 'blue';
    case 'overdue':     return 'red';
    case 'pending':     return 'amber';
    default:            return 'slate';
  }
}

export function friendlyStatus(status) {
  const map = {
    'completed':   'Filed',
    'in-progress': 'In Progress',
    'overdue':     'Overdue',
    'pending':     'Pending',
  };
  return map[(status || '').toLowerCase()] || status;
}
