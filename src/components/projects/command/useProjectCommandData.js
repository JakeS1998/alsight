import {useEffect} from 'react';
import {useQuery,useQueryClient} from '@tanstack/react-query';
import {base44} from '@/api/base44Client';
import {INTERNAL_ROLES} from '@/lib/portal';
export default function useProjectCommandData(project,user,approvalAccess) {
  const cache=useQueryClient(),enabled=!!project?.id && INTERNAL_ROLES.includes(user?.role);
  const query=useQuery({queryKey:['project-command',project?.id,user?.id,user?.role,approvalAccess],enabled,staleTime:60000,queryFn:async()=>{
    const scope={project_id:project.id},ids=[project.id,project.dataverse_id].filter(Boolean);
    const [delivery,source,actions,decisions,risks,approvals]=await Promise.all([
      base44.entities.ProjectDelivery.filter(scope,{sort:'-updated_date',limit:1}),
      base44.entities.CRMProjectLink.filter(scope,{limit:1}),
      base44.entities.ProjectAction.count({...scope,status:{$ne:'done'}}),
      base44.entities.ProjectDecision.count({...scope,status:'open'}),
      base44.entities.ProjectRisk.aggregate({query:{...scope,status:'open'},groupBy:'risk_index',limit:30}),
      approvalAccess ? base44.entities.DocumentApprovalRequest.count({project_id:{$in:ids},status:'pending',source_requires_approval:true}) : Promise.resolve(null),
    ]);
    return {delivery:delivery.items[0] || {},source:source.items[0] || null,actions,decisions,approvals,risks:risks.rows.reduce((n,r)=>n+r.count,0),highRisks:risks.rows.reduce((n,r)=>n+(r.risk_index>=15 ? r.count : 0),0),maxRisk:Math.max(0,...risks.rows.map(r=>Number(r.risk_index) || 0))};
  }});
  useEffect(()=>{
    if(!enabled)return;
    let timer;
    const stop=['ProjectAction','ProjectDecision','ProjectRisk','ProjectDelivery','CRMProjectLink','DocumentApprovalRequest'].map(name=>base44.entities[name].subscribe(event=>{
      if(event.data?.project_id && ![project.id,project.dataverse_id].includes(event.data.project_id))return;
      clearTimeout(timer);timer=setTimeout(()=>cache.invalidateQueries({queryKey:['project-command',project.id]}),400);
    }));
    return ()=>{clearTimeout(timer);stop.forEach(unsubscribe=>unsubscribe());};
  },[enabled,project?.id,project?.dataverse_id,cache]);
  return query;
}