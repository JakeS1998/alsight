export function plannerDay(value = Date.now()) {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return '';
  const parts = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/London', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(date);
  const get = type => parts.find(part => part.type === type).value;
  return `${get('year')}-${get('month')}-${get('day')}`;
}
export function plannerDayEnd(value = Date.now()) {
  const day = plannerDay(value);
  const [year, month, date] = day.split('-').map(Number);
  const noon = new Date(Date.UTC(year, month - 1, date, 12));
  const londonHour = Number(new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/London', hour: '2-digit', hour12: false }).format(noon));
  return new Date(Date.UTC(year, month - 1, date, 23 - (londonHour - 12), 59, 59, 999)).toISOString();
}
export function plannerTime(value) {
  const date = new Date(value);
  if (!value || !Number.isFinite(date.getTime())) return 'No time';
  return new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/London', hour: '2-digit', minute: '2-digit' }).format(date);
}
export const calendarPreview = [
  { key: 'calendar-1', time: '09:00', end: '09:30', title: 'Daily project catch-up', detail: 'Teams · Review priorities and unblock the team' },
  { key: 'calendar-2', time: '11:00', end: '12:00', title: 'Client progress meeting', detail: 'Teams · Programme, decisions and next steps' },
  { key: 'calendar-3', time: '14:30', end: '15:00', title: 'Supplier coordination call', detail: 'Teams · Confirm outstanding actions' },
];
export const touchbasePreview = [
  { title: 'A client awaiting a decision', reason: 'A quick check-in could clarify their next step.' },
  { title: 'A supplier with an outstanding action', reason: 'Confirm progress before the next project review.' },
  { title: 'A relationship you have not spoken to recently', reason: 'Reconnect and ask what support would be useful.' },
];