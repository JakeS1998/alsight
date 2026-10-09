import {useQuery} from '@tanstack/react-query';
import {base44} from '@/api/base44Client';
import {useAuth} from '@/lib/AuthContext';
export default function useProjectValueSummary(projects,{enabled=true,stages=false}={}) {
 const {user}=useAuth(),projectIds=projects.map(project=>project.id).sort(),valueVersion=projects.map(project=>project.updated_date || '').sort().at(-1) || '';
 return useQuery({queryKey:['project-value-summary',user?.id,user?.role,user?.data,projectIds,valueVersion,stages],enabled:enabled && !!user?.id,staleTime:60000,queryFn:async()=>{const {data}=await base44.functions.invoke('getProjectValueSummary',{projectIds,valueVersion,stages});if(data.error)throw new Error(data.error);return data;}});
}