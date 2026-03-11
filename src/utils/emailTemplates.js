/**
 * Email template generator.
 * Returns raw HTML strings — send via a Cloud Function / Firebase Trigger Email extension.
 */

const BRAND = {
  dark:   '#0a1628',
  mid:    '#0f1c2e',
  gold:   '#c9a84c',
  cream:  '#e8dfc8',
  slate:  '#8a9bb5',
  green:  '#4ecca3',
  red:    '#e87070',
  amber:  '#e8a83a',
  blue:   '#6fa9e8',
};

function statusColor(status) {
  const s = (status || '').toLowerCase();
  if (['completed','filed','nil_filed','nil filed'].includes(s)) return BRAND.green;
  if (s === 'overdue') return BRAND.red;
  if (['in-progress','in progress','wip'].includes(s)) return BRAND.blue;
  return BRAND.amber;
}

function friendlyStatus(status) {
  const map = { pending:'Pending', completed:'Filed', nil_filed:'Nil Filed', 'nil filed':'Nil Filed', data_pending:'Data Pending', 'in-progress':'In Progress', overdue:'Overdue', on_hold:'On Hold' };
  return map[(status||'').toLowerCase()] || status || 'Pending';
}

function typeColor(type) {
  const m = { GST: BRAND.gold, IT: BRAND.blue, TDS: BRAND.green, OTHER: BRAND.slate };
  return m[type] || BRAND.slate;
}

// ── Shared HTML shell ──────────────────────────────────────────────────────
function shell(title, preheader, bodyHtml) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>${title}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: ${BRAND.dark}; font-family: 'Inter', Arial, sans-serif; color: ${BRAND.cream}; }
</style>
</head>
<body>
  <!-- preheader (hidden preview text) -->
  <div style="display:none;max-height:0;overflow:hidden;color:${BRAND.dark};">${preheader}</div>

  <!-- Wrapper -->
  <table width="100%" cellpadding="0" cellspacing="0" style="background:${BRAND.dark};padding:32px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

        <!-- Header -->
        <tr>
          <td style="background:${BRAND.mid};border-radius:16px 16px 0 0;padding:28px 32px;border-bottom:1px solid ${BRAND.gold}33;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td>
                  <div style="font-size:20px;font-weight:700;color:${BRAND.gold};letter-spacing:-.3px;">ComplianceDesk</div>
                  <div style="font-size:12px;color:${BRAND.slate};margin-top:3px;letter-spacing:.5px;text-transform:uppercase;">Client Portal</div>
                </td>
                <td align="right">
                  <div style="font-size:11px;color:${BRAND.slate};">Powered by BizExpress</div>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Body -->
        ${bodyHtml}

        <!-- Footer -->
        <tr>
          <td style="background:${BRAND.mid};border-radius:0 0 16px 16px;padding:24px 32px;border-top:1px solid rgba(255,255,255,.05);">
            <div style="font-size:12px;color:${BRAND.slate};line-height:1.7;">
              You're receiving this because your CA firm has enrolled you in compliance alerts.<br/>
              To manage your preferences, log in to <a href="https://client-portal-azrq.vercel.app/alerts" style="color:${BRAND.gold};text-decoration:none;">your portal</a> and visit the Alerts page.<br/><br/>
              <span style="color:rgba(138,155,181,.5);">© ${new Date().getFullYear()} BizExpress Consulting · Compliance made simple.</span>
            </div>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

// ── Monthly digest ─────────────────────────────────────────────────────────
export function monthlyDigestEmail({ clientName, month, year, tasks }) {
  const monthName = new Date(year, month - 1, 1).toLocaleString('en-IN', { month: 'long' });

  // Build a mini calendar
  const firstDay = new Date(year, month - 1, 1).getDay();
  const daysInMonth = new Date(year, month, 0).getDate();
  const tasksByDay = {};
  tasks.forEach(t => {
    if (!t.dueDate) return;
    const d = new Date(t.dueDate);
    if (d.getMonth() + 1 !== month || d.getFullYear() !== year) return;
    const day = d.getDate();
    if (!tasksByDay[day]) tasksByDay[day] = [];
    tasksByDay[day].push(t);
  });

  // Stats
  const total   = tasks.length;
  const filed   = tasks.filter(t => ['completed','nil_filed'].includes((t.status||'').toLowerCase())).length;
  const pending = total - filed;

  const statBox = (label, val, col) =>
    `<td align="center" style="width:33%;padding:0 6px;">
      <div style="background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);border-radius:12px;padding:16px 10px;">
        <div style="font-size:28px;font-weight:700;color:${col};font-family:Georgia,serif;">${val}</div>
        <div style="font-size:11px;color:${BRAND.slate};margin-top:4px;text-transform:uppercase;letter-spacing:.5px;">${label}</div>
      </div>
    </td>`;

  // Calendar grid
  const DOW_LABELS = ['Su','Mo','Tu','We','Th','Fr','Sa'];
  const calCells = [];
  for (let i = 0; i < firstDay; i++) calCells.push('<td></td>');
  for (let d = 1; d <= daysInMonth; d++) {
    const dayTasks = tasksByDay[d] || [];
    const hasTask  = dayTasks.length > 0;
    const dot = hasTask
      ? `<div style="margin-top:3px;display:flex;gap:2px;justify-content:center;flex-wrap:wrap;">${dayTasks.slice(0,3).map(t => `<div style="width:5px;height:5px;border-radius:50%;background:${typeColor(t.type)};"></div>`).join('')}</div>`
      : '';
    calCells.push(`<td align="center" style="padding:4px 2px;vertical-align:top;">
      <div style="font-size:12px;color:${hasTask ? BRAND.cream : BRAND.slate};font-weight:${hasTask ? 600 : 400};">${d}</div>${dot}
    </td>`);
  }
  const calRows = [];
  for (let i = 0; i < calCells.length; i += 7) {
    const rowCells = calCells.slice(i, i + 7);
    while (rowCells.length < 7) rowCells.push('<td></td>');
    calRows.push(`<tr>${rowCells.join('')}</tr>`);
  }

  // Task list
  const taskRows = [...tasks]
    .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
    .slice(0, 20)
    .map(t => {
      const col = typeColor(t.type);
      const sc  = statusColor(t.status);
      return `<tr>
        <td style="padding:10px 12px;border-bottom:1px solid rgba(255,255,255,.05);">
          <span style="font-size:10px;font-weight:600;color:${col};background:${col}20;border:1px solid ${col}44;border-radius:99px;padding:2px 7px;">${t.type}</span>
        </td>
        <td style="padding:10px 12px;border-bottom:1px solid rgba(255,255,255,.05);color:${BRAND.cream};font-size:13px;font-weight:500;">${t.description || t.service}</td>
        <td style="padding:10px 12px;border-bottom:1px solid rgba(255,255,255,.05);color:${BRAND.slate};font-size:12px;">${t.period || '—'}</td>
        <td style="padding:10px 12px;border-bottom:1px solid rgba(255,255,255,.05);color:${BRAND.slate};font-size:12px;white-space:nowrap;">${t.dueDate || '—'}</td>
        <td style="padding:10px 12px;border-bottom:1px solid rgba(255,255,255,.05);">
          <span style="font-size:10px;font-weight:600;color:${sc};background:${sc}20;border:1px solid ${sc}44;border-radius:99px;padding:2px 7px;text-transform:uppercase;">${friendlyStatus(t.status)}</span>
        </td>
      </tr>`;
    }).join('');

  const body = `
    <!-- Hero -->
    <tr><td style="background:linear-gradient(135deg,${BRAND.mid} 0%,#0d1e35 100%);padding:32px;">
      <div style="font-size:13px;color:${BRAND.gold};letter-spacing:.5px;text-transform:uppercase;margin-bottom:8px;">${monthName} ${year} · Compliance Digest</div>
      <div style="font-size:26px;font-weight:700;color:${BRAND.cream};margin-bottom:6px;">Hello, ${clientName} 👋</div>
      <div style="font-size:14px;color:${BRAND.slate};line-height:1.6;">Here are all your compliance due dates for <strong style="color:${BRAND.cream};">${monthName} ${year}</strong>. Stay ahead — your CA is working on these for you.</div>
    </td></tr>

    <!-- Stats -->
    <tr><td style="background:${BRAND.mid};padding:24px 32px;">
      <table width="100%" cellpadding="0" cellspacing="0"><tr>
        ${statBox('Total Filings', total, BRAND.cream)}
        ${statBox('Filed', filed, BRAND.green)}
        ${statBox('Pending', pending, BRAND.amber)}
      </tr></table>
    </td></tr>

    <!-- Calendar -->
    <tr><td style="background:${BRAND.mid};padding:8px 32px 24px;">
      <div style="background:rgba(255,255,255,.03);border:1px solid rgba(201,168,76,.12);border-radius:12px;padding:20px;">
        <div style="font-size:13px;font-weight:600;color:${BRAND.gold};margin-bottom:16px;text-transform:uppercase;letter-spacing:.5px;">${monthName} ${year}</div>
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>${DOW_LABELS.map(d => `<td align="center" style="font-size:10px;color:${BRAND.slate};font-weight:600;padding:0 2px 8px;width:14.28%;">${d}</td>`).join('')}</tr>
          ${calRows.join('\n')}
        </table>
      </div>
    </td></tr>

    <!-- Task table -->
    <tr><td style="background:${BRAND.mid};padding:8px 32px 24px;">
      <div style="font-size:13px;font-weight:600;color:${BRAND.gold};margin-bottom:12px;text-transform:uppercase;letter-spacing:.5px;">Filing Schedule</div>
      <table width="100%" cellpadding="0" cellspacing="0" style="background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.06);border-radius:10px;overflow:hidden;">
        <tr style="background:rgba(255,255,255,.04);">
          ${['Type','Filing','Period','Due Date','Status'].map(h => `<th style="padding:10px 12px;text-align:left;font-size:10px;font-weight:600;color:${BRAND.slate};text-transform:uppercase;letter-spacing:.5px;">${h}</th>`).join('')}
        </tr>
        ${taskRows}
      </table>
    </td></tr>

    <!-- CTA -->
    <tr><td style="background:${BRAND.mid};padding:16px 32px 32px;text-align:center;">
      <a href="https://client-portal-azrq.vercel.app" style="display:inline-block;background:${BRAND.gold};color:#0a1628;font-weight:700;font-size:14px;padding:14px 32px;border-radius:10px;text-decoration:none;letter-spacing:.3px;">View Full Dashboard →</a>
    </td></tr>`;

  return shell(
    `${monthName} ${year} Compliance Digest — ${clientName}`,
    `${total} filings this month · ${filed} filed · ${pending} pending`,
    body,
  );
}

// ── 5-day reminder ─────────────────────────────────────────────────────────
export function reminderEmail({ clientName, task, daysLeft }) {
  const col = typeColor(task.type);
  const urgencyColor = daysLeft <= 2 ? BRAND.red : daysLeft <= 3 ? BRAND.amber : BRAND.gold;

  const body = `
    <!-- Hero -->
    <tr><td style="background:linear-gradient(135deg,${BRAND.mid},#0d1e35);padding:32px;">
      <div style="font-size:13px;color:${urgencyColor};letter-spacing:.5px;text-transform:uppercase;margin-bottom:8px;">Filing Reminder · ${daysLeft} Day${daysLeft !== 1 ? 's' : ''} Left</div>
      <div style="font-size:26px;font-weight:700;color:${BRAND.cream};margin-bottom:6px;">Action Required ⚡</div>
      <div style="font-size:14px;color:${BRAND.slate};line-height:1.6;">Hello ${clientName}, this is a reminder about an upcoming compliance deadline.</div>
    </td></tr>

    <!-- Task card -->
    <tr><td style="background:${BRAND.mid};padding:24px 32px;">
      <div style="background:rgba(255,255,255,.03);border:1px solid ${urgencyColor}44;border-left:4px solid ${urgencyColor};border-radius:12px;padding:24px;">
        <div style="display:flex;align-items:center;gap:12px;margin-bottom:12px;">
          <span style="font-size:10px;font-weight:600;color:${col};background:${col}20;border:1px solid ${col}44;border-radius:99px;padding:3px 10px;text-transform:uppercase;">${task.type}</span>
        </div>
        <div style="font-size:20px;font-weight:700;color:${BRAND.cream};margin-bottom:8px;">${task.description || task.service}</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:16px;">
          <div style="background:rgba(255,255,255,.04);border-radius:8px;padding:12px;">
            <div style="font-size:10px;color:${BRAND.slate};text-transform:uppercase;letter-spacing:.5px;margin-bottom:4px;">Period</div>
            <div style="font-size:15px;font-weight:600;color:${BRAND.cream};">${task.period || '—'}</div>
          </div>
          <div style="background:rgba(255,255,255,.04);border-radius:8px;padding:12px;">
            <div style="font-size:10px;color:${BRAND.slate};text-transform:uppercase;letter-spacing:.5px;margin-bottom:4px;">Due Date</div>
            <div style="font-size:15px;font-weight:600;color:${urgencyColor};">${task.dueDate || '—'}</div>
          </div>
          <div style="background:rgba(255,255,255,.04);border-radius:8px;padding:12px;">
            <div style="font-size:10px;color:${BRAND.slate};text-transform:uppercase;letter-spacing:.5px;margin-bottom:4px;">FY</div>
            <div style="font-size:15px;font-weight:600;color:${BRAND.cream};">${task.fy || '—'}</div>
          </div>
          <div style="background:${urgencyColor}15;border:1px solid ${urgencyColor}33;border-radius:8px;padding:12px;">
            <div style="font-size:10px;color:${urgencyColor};text-transform:uppercase;letter-spacing:.5px;margin-bottom:4px;">Days Left</div>
            <div style="font-size:24px;font-weight:700;color:${urgencyColor};font-family:Georgia,serif;">${daysLeft}</div>
          </div>
        </div>
      </div>
    </td></tr>

    <!-- Action -->
    <tr><td style="background:${BRAND.mid};padding:16px 32px 32px;text-align:center;">
      <div style="font-size:13px;color:${BRAND.slate};margin-bottom:16px;">Need to submit documents? Contact your CA immediately.</div>
      <a href="https://client-portal-azrq.vercel.app" style="display:inline-block;background:${urgencyColor};color:#0a1628;font-weight:700;font-size:14px;padding:14px 32px;border-radius:10px;text-decoration:none;margin-right:12px;">View on Portal →</a>
      <a href="https://client-portal-azrq.vercel.app/documents" style="display:inline-block;background:rgba(255,255,255,.08);color:${BRAND.cream};font-weight:600;font-size:14px;padding:14px 32px;border-radius:10px;text-decoration:none;border:1px solid rgba(255,255,255,.12);">Document Checklist</a>
    </td></tr>`;

  return shell(
    `Reminder: ${task.description || task.service} due in ${daysLeft} days`,
    `${task.type} · ${task.period} · Due ${task.dueDate}`,
    body,
  );
}
