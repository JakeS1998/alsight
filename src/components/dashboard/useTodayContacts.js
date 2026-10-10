import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import organisationQueryPolicy from '@/components/data/organisationQueryPolicy';
export default function useTodayContacts(user) {
 return useQuery({queryKey:['today-contact-suggestions',user?.id,user?.role],enabled:!!user?.id,...organisationQueryPolicy,staleTime:60000,refetchInterval:60000,refetchOnWindowFocus:true,queryFn:async()=>{
  const load=async filters=>{const {data}=await base44.functions.invoke('getRelationshipWorkspace',{filters,limit:3,includeMatchedTotal:true});if(data.error)throw new Error(data.error);return data;};
  const attention=await load({focus:'attention',status:'active'});
  if(attention.rows.length)return {rows:attention.rows,attention:true,total:attention.matchedTotal};
  const active=await load({status:'active'});
  return {rows:active.rows,attention:false,total:0};
 }});
}