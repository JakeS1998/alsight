import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import adaptiveData from '@/components/adaptive/adaptiveData';
import useAdaptiveCalendar from '@/components/adaptive/useAdaptiveCalendar';
import { dayBounds } from '@/components/adaptive/adaptiveTime';
export default function useAdaptiveToday(user,prefs,now) {
 const client=useQueryClient(),bounds=dayBounds(now);
 const query=useQuery({queryKey:['adaptive-today',user.id,user.role,user.region,user.staff_aad_id,JSON.stringify(user.data||{}),JSON.stringify(user.duty_roles||[]),prefs.since,bounds.day],queryFn:()=>adaptiveData(user,prefs.since,bounds),staleTime:120000,retry:false,refetchOnWindowFocus:false});
 const calendar=useAdaptiveCalendar(user,now);
 useEffect(()=>{if(query.data?.refreshedAt)prefs.save({lastVisit:query.data.refreshedAt});},[query.data?.refreshedAt]);
 async function complete(row) {
  const {data}=await base44.functions.invoke('completeAssignedTask',{entity:row.taskEntity,id:row.id});if(data.error)throw Error(data.error);
  const stamp=Date.now(),day=dayBounds(stamp).day;
  prefs.save(old=>({completions:{day,items:[...(old.completions?.day===day?old.completions.items:[]).filter(item=>item.key!==row.key),{key:row.key,title:row.title,to:row.to,completedAt:new Date(stamp).toISOString()}]}}));
  await client.invalidateQueries({queryKey:['adaptive-today',user.id]});
  window.dispatchEvent(new Event('alsight-tasks-changed'));
 }
 return {...query,calendar,complete};
}