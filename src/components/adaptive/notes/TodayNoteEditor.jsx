import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { FolderInput, Trash2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogContent, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel } from '@/components/ui/alert-dialog';
import useNoteDraft from '@/components/adaptive/notes/useNoteDraft';
import NoteRichText from '@/components/adaptive/notes/NoteRichText';
import NoteMoveDialog from '@/components/adaptive/notes/NoteMoveDialog';

function NotePage({ note, userId, location, onMove, onDelete }) {
  const { draft, status, change, save, remove, move } = useNoteDraft(note, userId);
  const [moving, setMoving] = useState(false);
  const [confirm, setConfirm] = useState(false), [deleting, setDeleting] = useState(false), [deleteError, setDeleteError] = useState(false);
  async function deleteNote() {
    setDeleting(true);
    setDeleteError(false);
    try { await remove(); onDelete(); }
    catch { setDeleteError(true); setDeleting(false); }
  }
  return <div className="min-w-0 flex-1 px-5 py-5 sm:px-8">
    <div className="flex min-h-8 items-center justify-between gap-3 text-xs text-muted-foreground">
      <span role="status">{({ saved: 'All changes saved', pending: 'Unsaved changes', saving: 'Saving…', error: 'Changes could not be saved.', limit: 'This note is too large to save. Shorten it or split it across pages.' })[status]}</span>
      <div className="flex items-center gap-2">{status === 'error' && <Button size="sm" variant="outline" onClick={save}>Retry save</Button>}<Button size="icon" variant="ghost" aria-label="Move note" title="Move note" onClick={() => setMoving(true)}><FolderInput /></Button><Button size="icon" variant="ghost" aria-label="Delete note" title="Delete note" onClick={() => setConfirm(true)}><Trash2 /></Button></div>
    </div>
    <input aria-label="Note title" placeholder="Untitled note" value={draft.title} maxLength={150} onChange={e => change({ title: e.target.value })} onBlur={save} className="mt-3 w-full border-b border-border bg-transparent pb-3 font-heading text-2xl font-semibold placeholder:text-muted-foreground focus-visible:outline-none focus-visible:border-primary" />
    <NoteRichText body={draft.body} format={draft.body_format} onChange={change} onBlur={save} />
    {moving && <NoteMoveDialog userId={userId} current={location} onClose={() => setMoving(false)} onMove={async next => { await move(next.section?.id ?? null); onMove(next); }} />}
    <AlertDialog open={confirm} onOpenChange={open => { if (!deleting) { setConfirm(open); setDeleteError(false); } }}>
      <AlertDialogContent><AlertDialogTitle>Delete this note?</AlertDialogTitle><AlertDialogDescription>This permanently deletes {draft.title.trim() ? `“${draft.title.trim()}”` : 'this note'}.</AlertDialogDescription>
        {deleteError && <p role="alert" className="text-sm text-destructive">The note couldn’t be deleted. Try again.</p>}
        <AlertDialogFooter><AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel><Button variant="destructive" disabled={deleting} onClick={deleteNote}>{deleting ? 'Deleting…' : 'Delete note'}</Button></AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </div>;
}

export default function TodayNoteEditor({ id, userId, location, onMove, onDelete }) {
  const query = useQuery({ queryKey: ['my-note', userId, id], queryFn: async () => {
    const page = await base44.entities.PersonalNote.filter({ id, created_by_id: userId }, { limit: 1 });
    return page.items[0] ?? null;
  }, staleTime: 30000 });
  if (query.isPending) return <p role="status" className="p-6 text-sm text-muted-foreground">Opening note…</p>;
  if (query.isError && !query.data) return <div role="alert" className="space-y-3 p-6 text-sm">Couldn’t open this note. <Button variant="outline" size="sm" onClick={() => query.refetch()}>Try again</Button></div>;
  return query.data ? <NotePage note={query.data} userId={userId} location={location} onMove={onMove} onDelete={onDelete} /> : <p className="p-6 text-sm text-muted-foreground">This note is no longer available.</p>;
}