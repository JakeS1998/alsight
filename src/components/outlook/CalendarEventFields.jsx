import React from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { calendarTimeZone } from '@/components/outlook/calendarClient';
export default function CalendarEventFields({ form, setForm, disabled }) {
  const update = (key, value) => setForm(previous => ({ ...previous, [key]: value }));
  const dates = ['start', 'end'];
  return <fieldset disabled={disabled} className="space-y-4">
    <div className="space-y-1"><Label htmlFor="event-subject">Event title</Label><Input id="event-subject" value={form.subject} onChange={e => update('subject', e.target.value)} maxLength={200} required autoFocus /></div>
    <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.isAllDay} onChange={e => update('isAllDay', e.target.checked)} /> All-day event</label>
    <div className="grid gap-4 sm:grid-cols-2">{dates.map(key => <div key={key} className="space-y-1"><Label htmlFor={`event-${key}`}>{key === 'start' ? 'Start' : form.isAllDay ? 'End date (exclusive)' : 'End'}</Label><Input id={`event-${key}`} type={form.isAllDay ? 'date' : 'datetime-local'} value={form.isAllDay ? form[key].slice(0, 10) : form[key]} onChange={e => update(key, form.isAllDay ? `${e.target.value}T00:00` : e.target.value)} required /></div>)}</div>
    <p className="text-xs text-muted-foreground">Times use {calendarTimeZone}.{form.isAllDay && ' The end date is the first day not included in the event.'}</p>
    <div className="space-y-1"><Label htmlFor="event-location">Location</Label><Input id="event-location" value={form.location} onChange={e => update('location', e.target.value)} maxLength={300} /></div>
    <div className="space-y-1"><Label htmlFor="event-attendees">Attendee emails</Label><Textarea id="event-attendees" value={form.attendees} onChange={e => update('attendees', e.target.value)} placeholder="Separate email addresses with commas" maxLength={8000} rows={2} /><p className="text-xs text-muted-foreground">Outlook sends meeting invitations and updates to attendees.</p></div>
    <div className="space-y-1"><Label htmlFor="event-description">Description</Label><Textarea id="event-description" value={form.description} onChange={e => update('description', e.target.value)} maxLength={5000} rows={4} /></div>
  </fieldset>;
}