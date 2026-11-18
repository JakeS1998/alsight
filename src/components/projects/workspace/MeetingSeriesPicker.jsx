import React,{useState} from 'react';
import {useInfiniteQuery} from '@tanstack/react-query';
import {base44} from '@/api/base44Client';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import ReviewQueryState from '@/components/projects/workspace/ReviewQueryState';
import {meetingWriter} from '@/components/projects/workspace/meetingSessionActivity';

export default function MeetingSeriesPicker({user,manager,onSelect}) {
 const [name,setName]=useState('');
 const query=useInfiniteQuery({queryKey:['meeting-series',user.id,user.role],initialPageParam:null,queryFn:({pageParam})=>base44.entities.CRMActivity.filter({next_action:'meeting_series'},{sort:'subject',limit:20,...(pageParam ? {cursor:pageParam} : {})}),getNextPageParam:page=>page.has_more ? page.next_cursor : undefined});
 return <div className="space-y-4">
  {meetingWriter(user) && <form className="flex flex-wrap items-end gap-2" onSubmit={async event=>{event.preventDefault();const row=await manager.createMeeting(name);if(row){setName('');onSelect(row);}}}><label className="min-w-48 flex-1 text-xs">Meeting name<Input placeholder="e.g. Weekly 1-1" maxLength={120} required value={name} onChange={event=>setName(event.target.value)}/></label><Button size="sm" disabled={manager.busy || !name.trim()}>Set up meeting</Button></form>}
  {manager.error && <p role="alert" className="text-sm text-destructive">{manager.error}</p>}
  <ReviewQueryState query={query}><div className="space-y-2">{query.data?.pages.flatMap(page=>page.items).map(row=><button type="button" key={row.id} className="block w-full rounded-lg border p-3 text-left text-sm font-semibold hover:bg-muted" onClick={()=>onSelect(row)}>{row.subject}</button>)}{!query.data?.pages[0].items.length && <p className="text-sm text-muted-foreground">No reusable meetings yet.</p>}{query.hasNextPage && <Button variant="outline" size="sm" disabled={query.isFetchingNextPage} onClick={()=>query.fetchNextPage()}>Load more meetings</Button>}</div></ReviewQueryState>
 </div>;
}