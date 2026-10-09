import React from 'react';
import fullName from '@/components/data/fullName';
import {useInfiniteQuery} from '@tanstack/react-query';
import {base44} from '@/api/base44Client';
import {Link} from 'react-router-dom';
import {Button} from '@/components/ui/button';
import {formatDateTime} from '@/lib/portal';
import ReviewQueryState from '@/components/projects/workspace/ReviewQueryState';
export default function MeetingSessionEvents({session,user}) {
 const query=useInfiniteQuery({queryKey:['meeting-session-events',user.id,session.key_points],initialPageParam:null,queryFn:({pageParam})=>base44.entities.CRMActivity.filter({key_points:session.key_points,next_action:{$in:['meeting_review','meeting_action','meeting_completed','meeting_note','meeting_resume']}},{sort:'occurred_at',limit:25,...(pageParam ? {cursor:pageParam} : {})}),getNextPageParam:p=>p.has_more ? p.next_cursor : undefined});
 return <ReviewQueryState query={query}><div className="space-y-3">{query.data?.pages.flatMap(p=>p.items).map(row=><article key={row.id} className="rounded-lg border border-border p-3"><p className="text-sm font-medium">{row.subject}</p><p className="mt-1 text-xs text-muted-foreground">{fullName(row.author_name,row.author_id)} · {formatDateTime(row.occurred_at)}</p><p className="mt-2 whitespace-pre-wrap text-sm">{row.description}</p>{row.project_id && <Link to={`/projects/${row.project_id}`} className="mt-2 inline-block text-xs underline">Open project</Link>}</article>)}{!query.data?.pages[0].items.length && <p className="text-sm text-muted-foreground">No review activity recorded yet.</p>}{query.hasNextPage && <Button size="sm" variant="outline" disabled={query.isFetchingNextPage} onClick={()=>query.fetchNextPage()}>{query.isFetchingNextPage ? 'Loading…' : 'Load more meeting activity'}</Button>}</div></ReviewQueryState>;
}