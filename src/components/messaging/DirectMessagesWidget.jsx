import React,{useEffect,useState} from 'react';
import {MessageCircle,Minus,X,ArrowLeft} from 'lucide-react';
import {useInfiniteQuery,useQueryClient} from '@tanstack/react-query';
import {base44} from '@/api/base44Client';
import {Button} from '@/components/ui/button';
import {messageCall} from '@/components/messaging/messageClient';
import MessageInbox from '@/components/messaging/MessageInbox';
import MessageDirectory from '@/components/messaging/MessageDirectory';
import MessageConversation from '@/components/messaging/MessageConversation';
import useMessageNotifications from '@/components/messaging/useMessageNotifications';
export default function DirectMessagesWidget({user}) {
 const [open,setOpen]=useState(false),[minimized,setMinimized]=useState(false),[peer,setPeer]=useState(null),[directory,setDirectory]=useState(false),cache=useQueryClient();
 const {requestPermission,notify}=useMessageNotifications(user.id);
 const inbox=useInfiniteQuery({queryKey:['direct-message-inbox',user.id],initialPageParam:null,queryFn:({pageParam})=>messageCall({action:'inbox',...(pageParam?{cursor:pageParam}:{})}),getNextPageParam:p=>p.has_more?p.next_cursor:undefined,retry:false});
 useEffect(()=>{const unsub=base44.entities.DirectMessage.subscribe(event=>{if(event.data&&event.data.sender_id!==user.id&&event.data.recipient_id!==user.id)return;const person=cache.getQueryData(['direct-message-inbox',user.id])?.pages.flatMap(page=>page.items).flatMap(thread=>thread.people).find(member=>member.id===event.data?.sender_id)||{id:event.data?.sender_id,name:'Team member'};notify(event,person,person=>{setPeer(person);setDirectory(false);setOpen(true);setMinimized(false);});cache.invalidateQueries({queryKey:['direct-message-inbox',user.id]});cache.invalidateQueries({queryKey:['direct-messages',user.id]});});return unsub;},[user.id,cache,notify]);
 useEffect(()=>{const refresh=()=>{cache.invalidateQueries({queryKey:['direct-message-inbox',user.id]});cache.invalidateQueries({queryKey:['direct-messages',user.id]});};window.addEventListener('focus',refresh);return()=>window.removeEventListener('focus',refresh);},[user.id,cache]);
 const unread=inbox.data?.pages[0]?.total_unread||0,visible=open&&!minimized;
 const select=person=>{setPeer(person);setDirectory(false);};
 return <div className="fixed bottom-[max(1rem,env(safe-area-inset-bottom))] left-4 z-50 sm:bottom-[max(1.5rem,env(safe-area-inset-bottom))] sm:left-6">
 <Button onClick={()=>{if(!open||minimized)requestPermission();setOpen(true);setMinimized(!minimized&&open);}} aria-label={`Messages${unread?`, ${unread} unread`:''}`} aria-expanded={visible} className="h-10 rounded-full bg-als-navy px-4 text-sidebar-foreground shadow-lg hover:bg-als-navy-light"><MessageCircle className="h-4 w-4 text-primary"/><span className="text-xs">Messages</span>{unread>0&&<span className="rounded-full bg-primary px-1.5 text-xs text-primary-foreground">{unread>99?'99+':unread}</span>}</Button>
 {open&&<section aria-label="Direct messages" role="dialog" className={visible?'absolute bottom-12 left-0 flex h-[min(34rem,calc(100dvh-9rem))] w-[min(24rem,calc(100vw-1.5rem))] flex-col overflow-hidden rounded-panel border border-border bg-card text-card-foreground shadow-xl':'hidden'}>
 <header className="flex shrink-0 items-center gap-2 border-b border-border bg-als-navy px-3 py-2 text-sidebar-foreground">
 {(peer||directory)&&<Button size="icon" variant="ghost" className="h-7 w-7 hover:bg-als-navy-light hover:text-sidebar-foreground" aria-label="Back to conversations" onClick={()=>{setPeer(null);setDirectory(false);}}><ArrowLeft/></Button>}
 <div className="min-w-0 flex-1"><h2 className="truncate text-sm font-semibold">{peer?.name||(directory?'New message':'Messages')}</h2><p className="text-[10px] opacity-70">Internal team only</p></div>
 <Button size="icon" variant="ghost" className="h-7 w-7 hover:bg-als-navy-light hover:text-sidebar-foreground" aria-label="Minimize messages" onClick={()=>setMinimized(true)}><Minus/></Button><Button size="icon" variant="ghost" className="h-7 w-7 hover:bg-als-navy-light hover:text-sidebar-foreground" aria-label="Close messages" onClick={()=>{setOpen(false);setMinimized(false);}}><X/></Button>
 </header>
 {peer?<MessageConversation key={peer.id} user={user} peer={peer} visible={visible}/>:directory?<MessageDirectory user={user} onSelect={select}/>:<MessageInbox user={user} query={inbox} onSelect={select} onNew={()=>setDirectory(true)}/>}
 </section>}
 </div>;
}