export function calcComplianceScore(tasks) {
  if (!tasks.length) return null;
  const now = new Date();
  let totalWeight = 0, earnedWeight = 0;

  tasks.forEach(t => {
    const weight  = getTaskWeight(t);
    const dueDate = toDate(t.dueDate);
    const isOverdue = dueDate < now && t.status !== 'completed';

    totalWeight += weight;

    if (t.status === 'completed') {
      const filedDate = toDate(t.filedDate);
      const onTime    = !t.filedDate || filedDate <= dueDate;
      earnedWeight   += onTime ? weight : weight * 0.6;
    } else if (isOverdue) {
      earnedWeight += 0;
    } else if (t.status === 'in-progress' || t.status === 'in progress') {
      earnedWeight += weight * 0.5;
    } else {
      earnedWeight += weight * 0.7;
    }
  });

  return Math.round((earnedWeight / totalWeight) * 100);
}

function getTaskWeight(task) {
  const type = (task.type || '').toUpperCase();
  if (type === 'IT')    return 5;
  if (type === 'TDS')   return 4;
  if (type === 'GST')   return 3;
  return 2;
}

export function scoreToGrade(score) {
  if (score === null) return { grade: '—', color: 'slate' };
  if (score >= 90)    return { grade: 'A+', color: 'green' };
  if (score >= 75)    return { grade: 'A',  color: 'green' };
  if (score >= 60)    return { grade: 'B',  color: 'amber' };
  if (score >= 45)    return { grade: 'C',  color: 'amber' };
  return                     { grade: 'D',  color: 'red'   };
}

export function getStatusColor(status) {
  const s = (status || '').toLowerCase().replace(/\s+/g, '-');
  switch (s) {
    case 'completed':    return 'green';
    case 'in-progress':  return 'blue';
    case 'overdue':      return 'red';
    case 'pending':      return 'amber';
    default:             return 'slate';
  }
}

export function friendlyStatus(status) {
  const s = (status || '').toLowerCase();
  if (s === 'completed')                    return 'Filed';
  if (s === 'in-progress' || s === 'in progress') return 'In Progress';
  if (s === 'overdue')                      return 'Overdue';
  if (s === 'pending')                      return 'Pending';
  return status;
}

export function toDate(val) {
  if (!val) return new Date(0);
  if (val.toDate) return val.toDate();       // Firestore Timestamp
  if (val.seconds) return new Date(val.seconds * 1000); // Timestamp object
  return new Date(val);                      // string like "2026-05-30"
}
