import {useQuery} from '@tanstack/react-query';
import {base44} from '@/api/base44Client';
import {canViewWorkspace} from '@/components/navigation/workspaceAccess';

export default function useContingencyMenu(user){
 const eligible=canViewWorkspace(user,'contingency');
 const query=useQuery({
  queryKey:['co-menu',user?.id],
  enabled:eligible,
  queryFn:async()=>{const response=await base44.functions.invoke('manageContingencyOperations',{action:'menu_status'});if(response.data?.error)throw new Error(response.data.error);return response.data;},
  staleTime:30000,refetchInterval:30000,refetchIntervalInBackground:false,retry:false
 });
 const active=eligible&&query.data?.active===true;
 return {active,visible:eligible&&(user?.role==='admin'||active)};
}