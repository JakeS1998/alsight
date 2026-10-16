import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import calendarRequest from '@/components/outlook/calendarClient';
export default function useOutlookUnread(user,time){
 const [cursor,setCursor]=useState(null),client=useQueryClient();
 const auth=useQuery({queryKey:['adaptive-outlook-auth',user.id],queryFn:()=>base44.auth.isAuthenticated(),staleTime:120000});
 const start=time.start,end=time.tomorrowStart,key=['adaptive-outlook-mail',user.id,start,end,cursor],input={start,end,timeZone:'UTC',...(cursor?{cursor}:{})};
 const query=useQuery({queryKey:key,queryFn:()=>calendarRequest('unreadEmails',input),enabled:auth.data===true,staleTime:120000,retry:false,refetchOnWindowFocus:true});
 const summary=useMutation({mutationFn:async()=>({page:await calendarRequest('unreadEmails',{...input,summarise:true}),key}),onSuccess:result=>client.setQueryData(result.key,result.page)});
 function page(value){summary.reset();setCursor(value);}
 return {query,summary,auth,cursor,next:()=>page(query.data.next_cursor),latest:()=>page(null),refresh:()=>{summary.reset();query.refetch();},reconnect:()=>{client.invalidateQueries({queryKey:['adaptive-outlook-auth',user.id]});client.invalidateQueries({queryKey:['adaptive-outlook-mail',user.id]});client.invalidateQueries({queryKey:['adaptive-outlook-agenda',user.id]});}};
}