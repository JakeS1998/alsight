import React from 'react';
import {useInfiniteQuery} from '@tanstack/react-query';
import {base44} from '@/api/base44Client';
import {Button} from '@/components/ui/button';
import {formatDateTime} from '@/lib/portal';
import ReviewQueryState from '@/components/projects/workspace/ReviewQueryState';

export default function MeetingSeriesSessions({meetingId,user,onSelect}) {
 const query=useInfiniteQuery({queryKey:['meeting-history',user.id,user.role,meetingId],initialPageParam:null,queryFn:({pageParam})=>base44.entities.CRMActivity.filter({meeting_series_id:meetingId,next_action:'meeting_start'},{sort:'-occurred_at',limit:20,...(pageParam ? {cursor:pageParam} : {})}),getNextPageParam:page=>page.has_more ? page.next_cursor : undefined});
 return <ReviewQueryState query={query}><div className="space-y-2">{query.data?.pages.flatMap(page=>page.items).map(row=><button type="button" key={row.id} onClick={()=>onSelect(row)} className="block w-full rounded-lg border p-3 text-left text-sm font-medium hover:bg-muted">{formatDateTime(row.occurred_at)}</button>)}{!query.data?.pages[0].items.length && <p className="text-sm text-muted-foreground">No sessions yet. Start one when you’re ready.</p>}{query.hasNextPage && <Button size="sm" variant="outline" disabled={query.isFetchingNextPage} onClick={()=>query.fetchNextPage()}>Load more sessions</Button>}</div></ReviewQueryState>;
}