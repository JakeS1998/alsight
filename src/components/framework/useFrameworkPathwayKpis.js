import {useQuery} from '@tanstack/react-query';
import {base44} from '@/api/base44Client';
import {useAuth} from '@/lib/AuthContext';
import organisationQueryPolicy from '@/components/data/organisationQueryPolicy';
export default function useFrameworkPathwayKpis(project) {
 const {user}=useAuth();
 const query=useQuery({queryKey:['framework-pathway-kpis',user?.id,user?.role,project.id],enabled:!!user?.id && project.procurement_route!==false,...organisationQueryPolicy,staleTime:60000,queryFn:async()=>{const {data}=await base44.functions.invoke('getStakeholderFrameworkReport',{projectId:project.id,kpiOnly:true});if(data.error)throw new Error(data.error);return data;}});
 return {...query,complete:project.procurement_route===false || (!query.isError && query.data?.kpiCompletion?.complete===true)};
}