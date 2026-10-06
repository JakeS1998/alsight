import {useQuery} from '@tanstack/react-query';
import {base44} from '@/api/base44Client';
import {useAuth} from '@/lib/AuthContext';
import useIntelligenceUpdates from '@/components/intelligence/useIntelligenceUpdates';
export default function useProjectTiming(project) {
  const {user}=useAuth();
  useIntelligenceUpdates(project.id,'project_id',['ProjectAction','ProjectDelivery','ProjectRisk','ProjectDecision','Valuation','LegalDocument','DMA','JCT','Warranty'],[['ase-project-timing',project.id],['alice-health-facts',user.id,user.role,project.id],['project-360',project.id]]);
  return useQuery({queryKey:['ase-project-timing',project.id,user.id,user.role],staleTime:60000,retry:false,refetchOnWindowFocus:false,queryFn:async()=>{
    const today=new Date().toISOString().slice(0,10),scope={project_id:{$in:[project.id,project.dataverse_id].filter(Boolean)}};
    const pending={$and:[{executed:{$nin:['yes','po']}},{$or:[{date_of_execution:{$exists:false}},{date_of_execution:{$in:[null,'']}}]}]};
    const due=[];
    for(const name of ['LegalDocument','DMA','JCT']) due.push(await base44.entities[name].count({$and:[scope,{status:{$ne:'inactive'}},pending,{signing_target_date:{$lt:today,$nin:[null,'']}}]}));
    const [warrantyDue,actions]=await Promise.all([base44.entities.Warranty.count({...scope,status:{$ne:'inactive'},warranty_status:{$nin:['executed','product_warranty']},warranty_due:{$lt:today,$nin:[null,'']},$or:[{date_of_execution:{$exists:false}},{date_of_execution:{$in:[null,'']}}]}),base44.entities.ProjectAction.aggregate({query:{project_id:project.id,status:{$in:['open','in_progress']},due_date:{$lt:today,$nin:[null,'']}},groupBy:'status'})]);
    return {legalDue:due.reduce((sum,n)=>sum+n,0),warrantyDue,overdueActions:actions.rows.reduce((sum,r)=>sum+r.count,0)};
  }});
}