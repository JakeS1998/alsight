export const lookoutLogo = 'https://media.base44.com/images/public/6ab62433a194f918c54c8249/7f98df654_ALSight_brand_aligned_transparent.png';
export function ukParts(now = new Date()) {
  return Object.fromEntries(new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/London', year: 'numeric', month: '2-digit', day: '2-digit', weekday: 'short', hour: '2-digit', hourCycle: 'h23' }).formatToParts(now).map(p => [p.type,p.value]));
}
export function shiftDate(date, days) { const d = new Date(date + 'T12:00:00Z'); d.setUTCDate(d.getUTCDate() + days); return d.toISOString().slice(0,10); }
export function nextLookoutDate(now = new Date()) {
  const p = ukParts(now), today = `${p.year}-${p.month}-${p.day}`, day = new Date(today + 'T12:00:00Z').getUTCDay();
  let ahead = (4 - day + 7) % 7;
  if (!ahead && Number(p.hour) >= 13) ahead = 7;
  return shiftDate(today, ahead);
}
export function isReleaseDue(issue, now = new Date()) {
  const p = ukParts(now), today = `${p.year}-${p.month}-${p.day}`;
  return issue.publication_date < today || (issue.publication_date === today && Number(p.hour) >= 13);
}
export const departments = ['Business Support','Legal','Projects','Finance','Marketing','HR & People'];
export const lines = text => String(text || '').split('\n').map(s => s.trim()).filter(Boolean);