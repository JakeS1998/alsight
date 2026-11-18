export const defaultBriefingZone = 'Europe/London';
export const validBriefingTime = value => typeof value === 'string' && /^(?:[01]\d|2[0-3]):[0-5][05]$/.test(value);
export function briefingZone(value) {
  if (typeof value !== 'string' || !value.length || value.length > 100 || !/^[a-zA-Z][a-zA-Z0-9_+/-]*$/.test(value)) return null;
  try { return new Intl.DateTimeFormat('en-GB',{timeZone:value}).resolvedOptions().timeZone; } catch { return null; }
}
export function briefingClock(now, timeZone) {
  const parts = Object.fromEntries(new Intl.DateTimeFormat('en-GB',{timeZone,year:'numeric',month:'2-digit',day:'2-digit',weekday:'short',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(now).map(({type,value})=>[type,value]));
  return {day:`${parts.year}-${parts.month}-${parts.day}`, weekday:!['Sat','Sun'].includes(parts.weekday), minute:+parts.hour*60 + +parts.minute};
}
export function briefingIsDue(schedule, now) {
  const clock = briefingClock(now,schedule.timezone);
  const [hours,minutes] = schedule.time.split(':').map(Number);
  const delay = clock.minute - (hours * 60 + minutes);
  return schedule.last_day !== clock.day && (schedule.frequency !== 'weekdays' || clock.weekday) && delay >= 0 && delay < 15 ? clock.day : null;
}