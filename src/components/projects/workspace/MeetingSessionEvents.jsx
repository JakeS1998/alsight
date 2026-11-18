import React from 'react';
import fullName from '@/components/data/fullName';
import {useInfiniteQuery} from '@tanstack/react-query';
import {base44} from '@/api/base44Client';
import {Link} from 'react-router-dom';
import {Button} from '@/components/ui/button';
import {formatDateTime} from '@/lib/portal';
import ReviewQueryState from '@/components/projects/workspace/ReviewQueryState';
import MeetingNoteText from '@/components/projects/workspace/MeetingNoteText';
export default function MeetingSessionEvents({session,user,carryNotes=false,editable=false}) {
 const scope=carryNotes ? {meeting_series_id:session.meeting_series_id,occurred_at:{$lt:session.occurred_at},next_action:'meeting_note'} : {key_points:session.key_points,next_action:{$in:['meeting_review','meeting_action','meeting_completed','meeting_note','meeting_resume']}};
 const query=useInfiniteQuery({queryKey:['meeting-session-events',user.id,user.role,session.id,carryNotes],initialPageParam:null,queryFn:({pageParam})=>base44.entities.CRMActivity.filter(scope,{sort:carryNotes ? '-occurred_at' : 'occurred_at',limit:25,...(pageParam ? {cursor:pageParam} : {})}),getNextPageParam:p=>p.has_more ? p.next_cursor : undefined});
 return <ReviewQueryState query={query}><div className="space-y-3">{query.data?.pages.flatMap(p=>p.items).map(row=><article key={row.id} className="rounded-lg border border-border p-3"><p className="text-sm font-medium">{row.subject}</p><p className="mt-1 text-xs text-muted-foreground">{fullName(row.author_name,row.author_id)} · {formatDateTime(row.occurred_at)}</p><MeetingNoteText row={row} sessionId={session.id} editable={editable && !carryNotes && row.next_action==='meeting_note'}/>{row.project_id && <Link to={`/projects/${row.project_id}`} className="mt-2 inline-block text-xs underline">Open project</Link>}</article>)}{!query.data?.pages[0].items.length && <p className="text-sm text-muted-foreground">{carryNotes ? 'No accessible notes from earlier sessions.' : 'No review activity recorded yet.'}</p>}{query.hasNextPage && <Button size="sm" variant="outline" disabled={query.isFetchingNextPage} onClick={()=>query.fetchNextPage()}>{query.isFetchingNextPage ? 'Loading…' : 'Load more meeting activity'}</Button>}</div></ReviewQueryState>;
}