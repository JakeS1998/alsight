import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
export default function HomeFollowupForm({ user, initial, contactId, onClose, onSaved }) {
  const [subject, setSubject] = useState(initial), [when, setWhen] = useState('');
  const [busy, setBusy] = useState(false), [error, setError] = useState('');
  const save = async event => {
    event.preventDefault(); setBusy(true); setError('');
    try {
      await base44.entities.CRMReminder.create({ user_id: user.id, subject: subject.trim(), remind_at: new Date(when).toISOString(), ...(contactId ? { contact_id: contactId } : {}) });
      await onSaved(); onClose();
    } catch (err) { setError(err.message || 'Could not schedule your follow-up.'); }
    finally { setBusy(false); }
  };
  return <Dialog open onOpenChange={open => { if (!open && !busy) onClose(); }}><DialogContent>
    <DialogTitle>Schedule a follow-up</DialogTitle>
    <DialogDescription>This saves a personal ALSight reminder. Outlook is a mock preview for now; no calendar invitation will be sent.</DialogDescription>
    <form onSubmit={save} className="space-y-4">
      <label className="block text-sm font-semibold">What needs following up?<Input required maxLength={200} value={subject} onChange={event => setSubject(event.target.value)} className="mt-1" /></label>
      <label className="block text-sm font-semibold">When? <span className="font-normal text-muted-foreground">(your device’s local time)</span><Input required type="datetime-local" value={when} onChange={event => setWhen(event.target.value)} className="mt-1" /></label>
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      <div className="flex justify-end gap-2"><Button type="button" variant="outline" disabled={busy} onClick={onClose}>Cancel</Button><Button disabled={busy || !subject.trim()}>{busy ? 'Saving…' : 'Save follow-up'}</Button></div>
    </form>
  </DialogContent></Dialog>;
}