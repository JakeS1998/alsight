import React, { useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import CalendarEventFields from '@/components/outlook/CalendarEventFields';
import calendarRequest from '@/components/outlook/calendarClient';
import { emptyEvent, eventForm, eventPayload } from '@/components/outlook/calendarDates';
export default function CalendarEventDialog({ event, week, onClose, onSaved, initialForm }) {
  const [form, setForm] = useState(() => event?.id ? { ...eventForm(event), onlineMeetingLocked: !!event.isOnlineMeeting } : { ...emptyEvent(week), ...initialForm });
  const [busy, setBusy] = useState(false), [error, setError] = useState(''), [confirmDelete, setConfirmDelete] = useState(false);
  const requestId = useRef(crypto.randomUUID());
  const submit = async e => {
    e.preventDefault(); setError('');
    const payload = eventPayload(form);
    if (payload.end <= payload.start) { setError('The event must end after it starts.'); return; }
    setBusy(true);
    try { await calendarRequest(event?.id ? 'update' : 'create', { id: event?.id, event: payload, requestId: requestId.current }); onSaved(); }
    catch (err) { setError(err.message); }
    finally { setBusy(false); }
  };
  const remove = async () => {
    setBusy(true); setError('');
    try { await calendarRequest('delete', { id: event.id }); onSaved(); }
    catch (err) { setError(err.message); }
    finally { setBusy(false); }
  };
  return <Dialog open onOpenChange={open => { if (!open && !busy) onClose(); }}><DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
    <DialogHeader><DialogTitle>{event?.id ? 'Edit Outlook event' : 'New Outlook event'}</DialogTitle><DialogDescription>Changes save directly to your own Outlook calendar.</DialogDescription></DialogHeader>
    {['occurrence', 'exception'].includes(event?.type) && <p className="rounded-lg bg-muted p-3 text-sm">You are editing this occurrence only. Manage the complete recurring series in Outlook.</p>}
    <form onSubmit={submit} className="space-y-4"><CalendarEventFields form={form} setForm={setForm} disabled={busy} />
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      {confirmDelete ? <div className="space-y-3 rounded-lg border border-destructive/40 p-3"><p className="text-sm">Delete this event from Outlook? If this is a meeting, attendees will receive a cancellation.</p><div className="flex gap-2"><Button type="button" variant="destructive" disabled={busy} onClick={remove}>Confirm delete</Button><Button type="button" variant="outline" disabled={busy} onClick={() => setConfirmDelete(false)}>Keep event</Button></div></div> : <div className="flex flex-wrap justify-between gap-2">{event?.id && <Button type="button" variant="destructive" disabled={busy} onClick={() => setConfirmDelete(true)}>Delete event</Button>}<div className="ml-auto flex gap-2"><Button type="button" variant="outline" disabled={busy} onClick={onClose}>Cancel</Button><Button type="submit" disabled={busy}>{busy && <Loader2 className="h-4 w-4 animate-spin" />}Save event</Button></div></div>}
    </form>
  </DialogContent></Dialog>;
}