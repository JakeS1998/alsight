import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
export default function useAssessmentHistory({kind,recordId,classification,signals,methodology,enabled}) {
  const {user}=useAuth();
  const recorded=signals.map(s=>({label:s.label.slice(0,100),value:String(s.value).slice(0,300)})).slice(0,12);
  const fingerprint=JSON.stringify({classification,signals:recorded});
  return useQuery({queryKey:['ase-observations',user?.id,user?.role,kind,recordId,methodology,fingerprint],enabled:enabled && !!user?.id,staleTime:60000,retry:false,refetchOnWindowFocus:false,queryFn:async()=>{
    const page=await base44.entities.ASEObservation.filter({created_by_id:user.id,viewer_role:user.role,record_type:kind,record_id:recordId,methodology},{sort:'-observed_at',limit:5});
    if(page.items[0]?.fingerprint===fingerprint) return page.items;
    const saved=await base44.entities.ASEObservation.create({record_type:kind,record_id:recordId,viewer_role:user.role,methodology,observed_at:new Date().toISOString(),classification,signals:recorded,fingerprint});
    return [saved,...page.items.slice(0,4)];
  }});
}