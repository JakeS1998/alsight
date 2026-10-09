import React,{useState} from 'react';
import fullName from '@/components/data/fullName';
import {useInfiniteQuery} from '@tanstack/react-query';
import {base44} from '@/api/base44Client';
import {Button} from '@/components/ui/button';
import {formatDateTime} from '@/lib/portal';
import MeetingSessionSummary from '@/components/projects/workspace/MeetingSessionSummary';
import ReviewQueryState from '@/components/projects/workspace/ReviewQueryState';
export default function MeetingSessionHistory({user,onResume,activeId,busy=false,error=''}) {
 const [selected,setSelected]=useState(null);
 const query=useInfiniteQuery({queryKey:['meeting-history',user.id,user.role],initialPageParam:null,queryFn:({pageParam})=>base44.entities.CRMActivity.filter({type:'internal_meeting',next_action:'meeting_start'},{sort:'-occurred_at',limit:20,...(pageParam ? {cursor:pageParam} : {})}),getNextPageParam:p=>p.has_more ? p.next_cursor : undefined});
 if(selected)return <div className="space-y-4"><Button size="sm" variant="outline" onClick={()=>setSelected(null)}>Back to history</Button><h3 className="font-semibold">{selected.subject}</h3><MeetingSessionSummary session={selected} user={user} busy={busy} error={error} onResume={!activeId || activeId===selected.id ? onResume : null}/>{activeId && activeId!==selected.id && <p className="text-xs text-muted-foreground">End or leave your current meeting before resuming another.</p>}</div>;
 return <ReviewQueryState query={query}><div className="space-y-3"><p className="text-xs text-muted-foreground">Meeting history follows existing activity permissions.</p>{query.data?.pages.flatMap(p=>p.items).map(row=><button key={row.id} type="button" onClick={()=>setSelected(row)} className="block w-full rounded-lg border border-border p-4 text-left hover:bg-muted"><span className="block text-sm font-semibold">{row.subject}</span><span className="mt-1 block text-xs text-muted-foreground">{fullName(row.author_name,row.author_id)} · {formatDateTime(row.occurred_at)}</span><span className="mt-2 block text-xs underline">View summary / resume</span></button>)}{!query.data?.pages[0].items.length && <p className="text-sm text-muted-foreground">No saved meetings yet.</p>}{query.hasNextPage && <Button size="sm" variant="outline" disabled={query.isFetchingNextPage} onClick={()=>query.fetchNextPage()}>{query.isFetchingNextPage ? 'Loading…' : 'Load more meetings'}</Button>}</div></ReviewQueryState>;
}