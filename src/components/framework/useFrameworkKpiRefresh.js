import {useEffect} from 'react';
import {useQueryClient} from '@tanstack/react-query';
import {base44} from '@/api/base44Client';
export default function useFrameworkKpiRefresh(user) {
 const client=useQueryClient();
 useEffect(()=>{
  if(!user?.id || user.role==='framework_stakeholder')return;
  let timer;
  const refresh=()=>{clearTimeout(timer);timer=setTimeout(()=>client.invalidateQueries({queryKey:['framework-kpi-summary']}),500);};
  const unsubscribe=['Project','ProjectDelivery','FrameworkProjectReport'].map(name=>base44.entities[name].subscribe(refresh));
  return ()=>{clearTimeout(timer);unsubscribe.forEach(stop=>stop());};
 },[client,user?.id,user?.role]);
}