export function exportCSV(filename, rows, headers) {
  const esc  = v => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const csv  = [headers, ...rows].map(r => r.map(esc).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const a    = Object.assign(document.createElement('a'), { href: url, download: filename });
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function triggerPrint(title) {
  const prev = document.title;
  document.title = title;
  window.print();
  document.title = prev;
}
