import {useEffect} from 'react';
import {useQuery,useQueryClient} from '@tanstack/react-query';
import {useAuth} from '@/lib/AuthContext';
import allianceRequest,{refreshAlliance} from '@/components/alliance/allianceClient';
export default function useAutomaticPurposeResearch(project,onUpdated){
  const {user}=useAuth(),cache=useQueryClient();
  const enabled=!!project?.id && !project.why_this_matters?.trim() && ['admin','director','bdm'].includes(user?.role);
  const query=useQuery({queryKey:['automatic-project-purpose',user?.id,project?.id],enabled,retry:false,staleTime:Infinity,queryFn:()=>allianceRequest('purposeEnsure',{projectId:project.id})});
  useEffect(()=>{
    const updated=query.data?.project;
    if(updated?.id && updated.id===project?.id && updated.why_this_matters && !project.why_this_matters?.trim()){
      onUpdated?.({id:updated.id,why_this_matters:updated.why_this_matters});
      refreshAlliance(cache);
      cache.invalidateQueries({queryKey:['dashboard-data']});
    }
  },[query.data,project?.id,project?.why_this_matters,onUpdated,cache]);
  return query;
}