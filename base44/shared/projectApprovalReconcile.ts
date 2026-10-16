import {flowConfig,sharedFlowContext,flowRequest} from './dataverseFlowApi.ts';
import {isGuid,isName} from './dataverseFlowFields.ts';
import {receiveProjectApproval,syncedProjectDecisionStatus} from './projectApprovalIntake.ts';
export async function reconcileProjectApprovals(base44,input) {
 const db=base44.asServiceRole.entities;
 if(input.cursor && (typeof input.cursor!=='string' || input.cursor.length>4000))throw new Error('Invalid reconciliation cursor.');
 const page=await db.ProjectApproval.filter({status:'pending'},{sort:'created_date',limit:20,...(input.cursor ? {cursor:input.cursor} : {})});
 if(!page.items.length)return {checked:0,completed:[],has_more:false};
 const config=await flowConfig(base44),settings=config?.tables?.projects;
 const mappings=['approval_status','project_number'].map(local=>settings?.mappings?.find(m=>m.local===local));
 if(!isName(settings?.entitySet) || !isName(settings?.primaryId) || mappings.some(m=>!m || !isName(m.source) || !['String','Memo'].includes(m.type)))throw new Error('Confirm the project approval and numbering mappings before reconciling.');
 const projects=await db.Project.filter({id:{$in:page.items.map(r=>r.project_id)}},{limit:20,fields:['dataverse_id']});
 const ids=projects.items.map(p=>p.dataverse_id).filter(isGuid);
 const completed=[],observed=[];
 if(ids.length){
  const context=await sharedFlowContext(base44,config);
  const select=[settings.primaryId,...mappings.map(m=>m.source)].join(',');
  const filter=ids.map(id=>`${settings.primaryId} eq ${id}`).join(' or ');
  const result=await flowRequest(context.environment,context.token,`${settings.entitySet}?$select=${select}&$filter=${encodeURIComponent(filter)}&$top=20`);
  for(const source of result.value || []){
   observed.push({source_id:source[settings.primaryId],approval_status:source[mappings[0].source],project_number:source[mappings[1].source]});
   const status=syncedProjectDecisionStatus(source[mappings[0].source]);
   if(!['approved','rejected'].includes(status))continue;
   const project=projects.items.find(p=>p.dataverse_id?.toLowerCase()===source[settings.primaryId]?.toLowerCase());
   const request=project && page.items.find(r=>r.project_id===project.id);
   if(!request || request.response)continue;
   await db.Project.update(project.id,{approval_status:status==='approved' ? 'Approved' : 'Rejected',...(source[mappings[1].source] ? {project_number:source[mappings[1].source]} : {})});
   const outcome=await receiveProjectApproval(base44,project.id);
   if(outcome.status===status)completed.push({project:request.project_name,status});
  }
 }
 return {checked:page.items.length,completed,observed,has_more:page.has_more,next_cursor:page.next_cursor};
}