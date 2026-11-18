import React,{useState} from 'react';
import {useInfiniteQuery} from '@tanstack/react-query';
import {base44} from '@/api/base44Client';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {ChevronDown} from 'lucide-react';
import {DropdownMenu,DropdownMenuTrigger,DropdownMenuContent,DropdownMenuItem,DropdownMenuSeparator} from '@/components/ui/dropdown-menu';
import ReviewQueryState from '@/components/projects/workspace/ReviewQueryState';
import {meetingWriter} from '@/components/projects/workspace/meetingSessionActivity';

export default function MeetingSeriesPicker({user,manager,onSelect}) {
 const [name,setName]=useState('');
 const query=useInfiniteQuery({queryKey:['meeting-series',user.id,user.role],initialPageParam:null,queryFn:({pageParam})=>base44.entities.CRMActivity.filter({next_action:'meeting_series'},{sort:'subject',limit:20,...(pageParam ? {cursor:pageParam} : {})}),getNextPageParam:page=>page.has_more ? page.next_cursor : undefined});
 const meetings=query.data?.pages.flatMap(page=>page.items) || [];
 return <div className="space-y-4">
  {meetingWriter(user) && <form className="flex flex-wrap items-end gap-2" onSubmit={async event=>{event.preventDefault();const row=await manager.createMeeting(name);if(row){setName('');onSelect(row);}}}><label className="min-w-48 flex-1 text-xs">Meeting name<Input placeholder="e.g. Weekly 1-1" maxLength={120} required value={name} onChange={event=>setName(event.target.value)}/></label><Button size="sm" disabled={manager.busy || !name.trim()}>Set up meeting</Button></form>}
  {manager.error && <p role="alert" className="text-sm text-destructive">{manager.error}</p>}
  <ReviewQueryState query={query}>
   <DropdownMenu>
    <DropdownMenuTrigger asChild><Button type="button" variant="outline" className="w-full justify-between sm:w-64">Select a meeting <ChevronDown aria-hidden="true"/></Button></DropdownMenuTrigger>
    <DropdownMenuContent align="start" className="max-h-[var(--radix-dropdown-menu-content-available-height)] w-[var(--radix-dropdown-menu-trigger-width)] overflow-y-auto">
     {meetings.map(row=><DropdownMenuItem key={row.id} onSelect={()=>onSelect(row)} className="break-words">{row.subject}</DropdownMenuItem>)}
     {!meetings.length && <DropdownMenuItem disabled>No reusable meetings yet.</DropdownMenuItem>}
     {query.hasNextPage && <><DropdownMenuSeparator/><DropdownMenuItem aria-disabled={query.isFetchingNextPage} onSelect={event=>{event.preventDefault();if(!query.isFetchingNextPage)query.fetchNextPage();}}>{query.isFetchingNextPage ? 'Loading more…' : 'Load more meetings'}</DropdownMenuItem></>}
    </DropdownMenuContent>
   </DropdownMenu>
  </ReviewQueryState>
 </div>;
}