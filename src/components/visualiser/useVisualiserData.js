import {useQuery} from '@tanstack/react-query';
import {base44} from '@/api/base44Client';
import {zones} from '@/components/visualiser/prototypeConfig';
const riskIds=[...new Set(zones.flatMap(z=>z.riskIds))];
export default function useVisualiserData(project,user){
 const scope={project_id:{$in:[project.id,project.dataverse_id].filter(Boolean)}};
 const options={staleTime:30000,retry:false};
 const risks=useQuery({...options,queryKey:['visualiser-risks',project.id,user.id,user.role],queryFn:()=>base44.entities.ProjectRisk.filter({...scope,id:{$in:riskIds}},{limit:50,fields:['project_id','title','reference','status','cause','mitigation','owner','impact_description','risk_index','updated_date']})});
 const actions=useQuery({...options,queryKey:['visualiser-actions',project.id,user.id,user.role],queryFn:()=>base44.entities.ProjectAction.count({...scope,status:{$in:['open','in_progress']}})});
 const decisions=useQuery({...options,queryKey:['visualiser-decisions',project.id,user.id,user.role],queryFn:()=>base44.entities.ProjectDecision.count({...scope,status:'open'})});
 const delivery=useQuery({...options,queryKey:['visualiser-delivery',project.id,user.id,user.role],queryFn:()=>base44.entities.ProjectDelivery.filter(scope,{sort:'-updated_date',limit:1,fields:['contract_start','forecast_pc','pc_achieved','next_progress_meeting','client_handover','feasibility_status','site_visit_completed']})});
 return {risks,actions,decisions,delivery,records:risks.data?.items||[]};
}