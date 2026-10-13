import React,{useEffect,useRef} from 'react';
import {useInfiniteQuery,useQueryClient} from '@tanstack/react-query';
import {Button} from '@/components/ui/button';
import MessageComposer from '@/components/messaging/MessageComposer';
import {messageCall} from '@/components/messaging/messageClient';
export default function MessageConversation({user,peer,visible}) {
 const cache=useQueryClient(),end=useRef(null);
 const query=useInfiniteQuery({queryKey:['direct-messages',user.id,peer.id],enabled:visible,initialPageParam:null,queryFn:({pageParam})=>messageCall({action:'messages',peer_id:peer.id,...(pageParam?{cursor:pageParam}:{})}),getNextPageParam:p=>p.has_more?p.next_cursor:undefined,retry:false});
 const rows=query.data?.pages.flatMap(p=>p.items).slice().reverse()||[],latest=rows.at(-1)?.id;
 useEffect(()=>{if(visible)end.current?.scrollIntoView({block:'nearest'});},[latest,visible]);
 useEffect(()=>{if(!visible||!query.data?.pages.some(p=>p.items.some(m=>m.recipient_id===user.id&&!m.is_read)))return;let cancelled=false;async function read(){let result;do{result=await messageCall({action:'read',peer_id:peer.id});}while(result.has_more&&!cancelled);if(!cancelled){cache.invalidateQueries({queryKey:['direct-message-inbox',user.id]});}}read();return()=>{cancelled=true;};},[query.dataUpdatedAt,visible,peer.id,user.id,cache]);
 const sent=()=>{cache.invalidateQueries({queryKey:['direct-messages',user.id,peer.id]});cache.invalidateQueries({queryKey:['direct-message-inbox',user.id]});};
 return <><div className="min-h-0 flex-1 overflow-y-auto p-3" aria-label="Conversation messages" role="log" aria-live="polite">
 {query.hasNextPage&&<Button size="sm" variant="ghost" className="mb-3 w-full" onClick={()=>query.fetchNextPage()} disabled={query.isFetchingNextPage}>{query.isFetchingNextPage?'Loading…':'Older messages'}</Button>}
 {query.isPending&&<p className="text-sm text-muted-foreground">Loading messages…</p>}
 {query.error&&<div role="alert" className="text-sm text-destructive">{query.error.message}<Button size="sm" variant="ghost" onClick={()=>query.refetch()}>Retry</Button></div>}
 {!query.isPending&&!query.error&&!rows.length&&<p className="py-8 text-center text-sm text-muted-foreground">Start a conversation with {peer.name}.</p>}
 <div className="space-y-3">{rows.map(m=><div key={m.id} className={m.sender_id===user.id?'flex justify-end':'flex justify-start'}><div className={m.sender_id===user.id?'max-w-[85%] rounded-xl bg-als-navy px-3 py-2 text-sidebar-foreground':'max-w-[85%] rounded-xl bg-muted px-3 py-2 text-foreground'}><p className="whitespace-pre-wrap break-words text-sm">{m.body}</p><p className="mt-1 text-[10px] opacity-70" title={new Date(m.created_date).toLocaleString()}>{new Date(m.created_date).toLocaleDateString(undefined,{day:'numeric',month:'short'})} · {new Date(m.created_date).toLocaleTimeString(undefined,{hour:'2-digit',minute:'2-digit'})}</p></div></div>)}</div><div ref={end}/>
 </div><MessageComposer key={peer.id} peer={peer} onSent={sent}/></>;
}