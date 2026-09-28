import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';

export default function ReminderSetter({ activity, opportunityId, user }) {
  const [open, setOpen] = useState(false), [when, setWhen] = useState(''), [busy, setBusy] = useState(false), [error, setError] = useState(''), [saved, setSaved] = useState(false);
  const save = async e => {
    e.preventDefault(); setBusy(true); setError('');
    try {
      await base44.entities.CRMReminder.create({ user_id: user.id, opportunity_id: opportunityId, activity_id: activity.id, subject: activity.subject, remind_at: new Date(when).toISOString() });
      setWhen(''); setOpen(false); setSaved(true);
    } catch (err) { setError(err.message || 'Could not save reminder.'); }
    finally { setBusy(false); }
  };
  return <div className="mt-2">
    <button type="button" className="text-xs font-medium text-primary hover:underline" onClick={() => { setOpen(v => !v); setSaved(false); }}> {open ? 'Cancel reminder' : 'Set reminder'}</button>
    {open && <form onSubmit={save} className="mt-2 flex flex-wrap items-end gap-2"><label className="text-xs">Remind me at<input required type="datetime-local" value={when} onChange={e => setWhen(e.target.value)} className="mt-1 block rounded-lg border border-input bg-background p-2 text-sm" /></label><Button size="sm" disabled={busy}>{busy ? 'Saving…' : 'Save reminder'}</Button></form>}
    {saved && <p role="status" className="text-xs text-muted-foreground">Reminder saved.</p>}{error && <p role="alert" className="text-xs text-destructive">{error}</p>}
  </div>;
}