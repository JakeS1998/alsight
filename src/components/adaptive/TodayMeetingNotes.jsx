import React from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
export default function TodayMeetingNotes({ task, user, onClose }) {
  const query = useInfiniteQuery({ queryKey: ['project-meeting-history', task.project_id, user.id, user.role, 'today-notes'], initialPageParam: null, queryFn: ({ pageParam }) => base44.entities.CRMActivity.filter({ project_id: task.project_id, $or: [{ next_action: 'meeting_note' }, { type: { $in: ['project_meeting', 'meeting', 'teams_meeting'] } }] }, { sort: '-occurred_at', limit: 20, ...(pageParam ? { cursor: pageParam } : {}) }), getNextPageParam: page => page.has_more ? page.next_cursor : undefined });
  return <Dialog open onOpenChange={open => { if (!open) onClose(); }}><DialogContent className="max-h-[85vh] overflow-y-auto"><DialogHeader><DialogTitle>Meeting notes</DialogTitle><DialogDescription>{task.projectName || 'Project meeting records'} · Notes are shown by project; older actions may not identify a specific meeting.</DialogDescription></DialogHeader>
    {task.comments && <div className="rounded-md border border-border bg-muted p-3"><h3 className="text-sm font-semibold">Action note</h3><p className="mt-2 whitespace-pre-wrap text-sm">{task.comments}</p></div>}
    {query.isPending ? <p role="status">Loading meeting notes…</p> : query.error ? <p role="alert" className="text-sm text-destructive">{query.error.message} <button type="button" className="underline" onClick={() => query.refetch()}>Retry</button></p> : <div className="space-y-3">
      {!query.data.pages[0].items.length && <p className="text-sm text-muted-foreground">No accessible meeting notes recorded for this project.</p>}
      {query.data.pages.flatMap(page => page.items).map(note => <article key={note.id} className="rounded-md border border-border p-3"><h3 className="text-sm font-semibold">{note.subject}</h3><p className="mt-1 text-xs text-muted-foreground">{note.author_name}{note.occurred_at && ` · ${new Date(note.occurred_at).toLocaleString('en-GB')}`}</p><p className="mt-2 whitespace-pre-wrap break-words text-sm">{note.description}</p></article>)}
      {query.hasNextPage && <Button type="button" size="sm" variant="outline" disabled={query.isFetchingNextPage} onClick={() => query.fetchNextPage()}>{query.isFetchingNextPage ? 'Loading…' : 'Load more notes'}</Button>}
    </div>}
  </DialogContent></Dialog>;
}