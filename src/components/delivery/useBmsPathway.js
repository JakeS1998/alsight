import {useEffect} from 'react';
import {useQuery,useQueryClient} from '@tanstack/react-query';
import {base44} from '@/api/base44Client';
import {useAuth} from '@/lib/AuthContext';
export const bmsRequest=async input=>{const {data}=await base44.functions.invoke('managePathwayBMS',input);if(data.error)throw new Error(data.error);return data;};
export default function useBmsPathway(projectId) {
 const {user}=useAuth(),client=useQueryClient();
 const enabled=['admin','director','regional_director','bdm','bsm','finance'].includes(user?.role);
 const key=['pathway-bms',projectId,user?.id,user?.role];
 const query=useQuery({queryKey:key,enabled,queryFn:()=>bmsRequest({action:'read',projectId}),staleTime:30000,refetchOnWindowFocus:false,retry:1});
 useEffect(()=>{
  if(!enabled)return;
  const refresh=event=>{if(!event.data?.project_id||event.data.project_id===projectId)client.invalidateQueries({queryKey:key});};
  const unsubscribes=['ProjectAction','ProjectDecision'].map(entity=>base44.entities[entity].subscribe(refresh));
  return ()=>unsubscribes.forEach(unsubscribe=>unsubscribe());
 },[enabled,projectId,user?.id,user?.role,client]);
 const save=async(task,values)=>{
  const data=await bmsRequest({action:'save',projectId,requirementKey:task.key,revision:task.review?.revision||0,...values});
  client.setQueryData(key,previous=>({...previous,reviews:[data.review,...(previous?.reviews||[]).filter(row=>row.requirement_key!==task.key)]}));
  await client.invalidateQueries({queryKey:key});
 };
 return {...query,enabled,save};
}