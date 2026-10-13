import React,{useEffect,useState} from 'react';
import {useInfiniteQuery} from '@tanstack/react-query';
import {Button} from '@/components/ui/button';
import {messageCall} from '@/components/messaging/messageClient';
export default function MessageDirectory({user,onSelect}) {
 const [search,setSearch]=useState(''),[term,setTerm]=useState('');
 useEffect(()=>{const t=setTimeout(()=>setTerm(search),300);return()=>clearTimeout(t);},[search]);
 const query=useInfiniteQuery({queryKey:['direct-message-directory',user.id,term],initialPageParam:0,queryFn:({pageParam})=>messageCall({action:'directory',search:term,offset:pageParam}),getNextPageParam:p=>p.has_more?p.next_offset:undefined,retry:false});
 return <div className="min-h-0 flex-1 overflow-y-auto p-3"><input aria-label="Search internal team" placeholder="Search internal team…" value={search} maxLength={100} onChange={e=>setSearch(e.target.value)} className="mb-3 w-full rounded-lg border border-input bg-muted px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"/>
 {query.isPending&&<p className="text-sm text-muted-foreground">Loading team…</p>}{query.error&&<p role="alert" className="text-sm text-destructive">{query.error.message}<Button variant="ghost" size="sm" onClick={()=>query.refetch()}>Retry</Button></p>}
 {query.data?.pages.flatMap(p=>p.items).map(person=><button key={person.id} onClick={()=>onSelect(person)} className="flex w-full items-center gap-3 rounded-lg p-3 text-left hover:bg-muted"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-semibold">{person.name.split(' ').map(n=>n[0]).slice(0,2).join('')}</span><span className="text-sm font-medium">{person.name}</span></button>)}
 {query.data&&!query.data.pages[0].items.length&&<p className="py-6 text-center text-sm text-muted-foreground">No team members found.</p>}
 {query.hasNextPage&&<Button className="mt-2 w-full" variant="ghost" size="sm" disabled={query.isFetchingNextPage} onClick={()=>query.fetchNextPage()}>{query.isFetchingNextPage?'Loading…':'More team members'}</Button>}</div>;
}