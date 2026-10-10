import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
export default function useTodayBriefing(dashboard) {
 const client=useQueryClient(),ids=dashboard.projects.map(p=>p.id).sort(),key=JSON.stringify([dashboard.scopeKey,ids]);
 const query=useQuery({queryKey:['today-briefing',key],enabled:dashboard.internal && !dashboard.loading && !dashboard.error,staleTime:60000,refetchInterval:60000,refetchOnWindowFocus:true,retry:false,queryFn:async()=>{
  const {data}=await base44.functions.invoke('getTodayBriefing',{projectIds:ids});if(data.error)throw new Error(data.error);return data;
 }});
 useEffect(()=>{
  if(!dashboard.internal || !dashboard.user)return;
  let timer;
  const refresh=()=>{clearTimeout(timer);timer=setTimeout(()=>client.invalidateQueries({queryKey:['today-briefing']}),500);};
  const stops=['ProjectRisk','ProjectDecision','FeeProposal','DocumentApprovalRequest','Project'].map(entity=>base44.entities[entity].subscribe(refresh));
  return ()=>{clearTimeout(timer);stops.forEach(stop=>stop());};
 },[dashboard.internal,dashboard.user?.id,client]);
 return query;
}