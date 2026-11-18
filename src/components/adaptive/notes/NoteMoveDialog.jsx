import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import NoteLocation from '@/components/adaptive/notes/NoteLocation';

export default function NoteMoveDialog({ userId, current, onMove, onClose }) {
  const [location, setLocation] = useState(current), [pending, setPending] = useState(false), [error, setError] = useState(false);
  const valid = (!location.notebook || location.section) && (location.section?.id ?? null) !== (current.section?.id ?? null);
  async function move() {
    setPending(true);
    setError(false);
    try { await onMove(location); onClose(); }
    catch { setError(true); setPending(false); }
  }
  return <Dialog open onOpenChange={open => { if (!open && !pending) onClose(); }}><DialogContent>
    <DialogHeader><DialogTitle>Move note</DialogTitle><DialogDescription>Choose a section in one of your notebooks, or move this page to Unfiled notes.</DialogDescription></DialogHeader>
    <NoteLocation userId={userId} location={location} onChange={setLocation} />
    {error && <p role="alert" className="text-sm text-destructive">Couldn’t move the note. Check that your edits are saved and try again.</p>}
    <DialogFooter><Button type="button" variant="outline" disabled={pending} onClick={onClose}>Cancel</Button><Button type="button" disabled={pending || !valid} onClick={move}>{pending ? 'Moving…' : 'Move note'}</Button></DialogFooter>
  </DialogContent></Dialog>;
}