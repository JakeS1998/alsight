import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import adaptiveData from '@/components/adaptive/adaptiveData';
import useTodayOutlookAgenda from '@/components/dashboard/useTodayOutlookAgenda';
import { plannerDay } from '@/components/dashboard/plannerDates';
export default function useAdaptiveToday(user,prefs) {
 const client=useQueryClient();
 const query=useQuery({queryKey:['adaptive-today',user.id,user.role,user.region,user.staff_aad_id,JSON.stringify(user.data||{}),prefs.since,plannerDay()],queryFn:()=>adaptiveData(user,prefs.since),staleTime:120000,retry:false,refetchOnWindowFocus:false});
 const calendar=useTodayOutlookAgenda(user);
 useEffect(()=>{if(query.data?.refreshedAt)prefs.save({lastVisit:query.data.refreshedAt});},[query.data?.refreshedAt]);
 async function complete(row) {
  const {data}=await base44.functions.invoke('completeAssignedTask',{entity:row.taskEntity,id:row.id});if(data.error)throw Error(data.error);
  await client.invalidateQueries({queryKey:['adaptive-today',user.id]});
  window.dispatchEvent(new Event('alsight-tasks-changed'));
 }
 return {...query,calendar,complete};
}