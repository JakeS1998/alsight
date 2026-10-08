import { addDays, startOfWeek, format } from 'date-fns';
export const initialWeek = () => startOfWeek(new Date(), { weekStartsOn: 1 });
export const weekRange = date => ({ start: date.toISOString(), end: addDays(date, 7).toISOString() });
export const eventLocalValue = dateTime => (dateTime || '').slice(0, 16);
export const eventDay = event => (event.start?.dateTime || '').slice(0, 10);
export const eventTime = event => event.isAllDay ? 'All day' : `${format(new Date(event.start.dateTime), 'HH:mm')} – ${format(new Date(event.end.dateTime), 'HH:mm')}`;
export function emptyEvent(date) {
  const start = new Date(date); start.setHours(9, 0, 0, 0);
  return { subject: '', start: format(start, "yyyy-MM-dd'T'HH:mm"), end: format(new Date(start.getTime() + 3600000), "yyyy-MM-dd'T'HH:mm"), isAllDay: false, location: '', description: '', attendees: '' };
}
export function eventForm(event) {
  return { subject: event.subject || '', start: eventLocalValue(event.start.dateTime), end: eventLocalValue(event.end.dateTime), isAllDay: !!event.isAllDay, location: event.location?.displayName || '', description: event.body?.content || event.bodyPreview || '', attendees: (event.attendees || []).map(person => person.emailAddress.address).join(', ') };
}
export function eventPayload(form) {
  return { ...form, start: form.isAllDay ? `${form.start.slice(0, 10)}T00:00:00` : `${form.start}:00`, end: form.isAllDay ? `${form.end.slice(0, 10)}T00:00:00` : `${form.end}:00`, attendees: form.attendees.split(/[;,\n]/).map(email => email.trim()).filter(Boolean) };
}