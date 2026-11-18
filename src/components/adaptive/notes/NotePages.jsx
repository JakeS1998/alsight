import React from 'react';
import { Button } from '@/components/ui/button';

export default function NotePages({ notes, items, active, onSelect }) {
  return <div aria-label="Note pages" className="min-w-0 space-y-1 border-t border-border pt-3">
    <p className="px-2 py-1 text-xs font-semibold text-muted-foreground">Pages</p>
    {notes.isPending && <p role="status" className="p-2 text-sm text-muted-foreground">Loading pages…</p>}
    {notes.isError && <div role="alert" className="space-y-2 p-2 text-sm">Couldn’t load pages. <Button size="sm" variant="outline" onClick={() => notes.refetch()}>Try again</Button></div>}
    {!items.length && notes.isSuccess && <p className="p-2 text-sm text-muted-foreground">No pages yet.</p>}
    {items.map(note => <button key={note.id} type="button" aria-current={note.id === active ? 'true' : undefined} onClick={() => onSelect(note.id)} className={`block w-full truncate rounded-md border px-3 py-2 text-left text-sm ${note.id === active ? 'border-border bg-card font-semibold' : 'border-transparent hover:bg-card'}`}>{note.title.trim() || 'Untitled note'}</button>)}
    {notes.hasNextPage && <Button size="sm" variant="ghost" disabled={notes.isFetchingNextPage} onClick={() => notes.fetchNextPage()}>{notes.isFetchingNextPage ? 'Loading…' : 'Load more'}</Button>}
  </div>;
}