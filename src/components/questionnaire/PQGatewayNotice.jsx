import React,{useEffect} from 'react';
import {useQuery} from '@tanstack/react-query';
import {base44} from '@/api/base44Client';
import {Button} from '@/components/ui/button';
export default function PQGatewayNotice({subject,values,onReady,onOpen}) {
 const key=JSON.stringify([subject,values]);
 const query=useQuery({queryKey:['pq-creation-gateway',key],enabled:!!subject,retry:false,refetchOnMount:'always',refetchOnWindowFocus:true,queryFn:async()=>(await base44.functions.invoke('manageProjectQuestionnaire',{action:'gate',...subject,...(values?{values}:{})})).data});
 const ready=!!subject&&query.data?.ready===true&&!query.isFetching&&!query.error;
 useEffect(()=>{onReady?.(ready);return()=>onReady?.(false);},[ready,onReady]);
 return <div className="space-y-3 rounded-lg border border-border bg-muted/50 p-4"><h3 className="text-sm font-semibold">PQ gateway · {ready?'Approved':query.isFetching?'Checking…':'Required'}</h3><p role="status" className="text-sm text-muted-foreground">{!subject?'Complete and approve a PQ before submitting this project request.':query.error?(query.error.response?.data?.error||query.error.message):query.isFetching?'Checking the latest PQ approval…':query.data?.reason}</p>{query.data?.reference&&<p className="text-xs text-muted-foreground">{query.data.reference}</p>}<div className="flex flex-wrap gap-2">{onOpen&&<Button type="button" variant="outline" onClick={onOpen}>Complete / review PQ</Button>}{subject&&<Button type="button" variant="ghost" disabled={query.isFetching} onClick={()=>query.refetch()}>Refresh PQ status</Button>}</div></div>;
}