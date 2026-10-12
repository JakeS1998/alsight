import {withProjectNumberLease} from './projectNumberLease.ts';
import {advanceSyncedProjectCounter} from './projectNumberSync.ts';
export async function projectCounter(base44) {
 const page=await base44.asServiceRole.entities.ProjectNumberCounter.filter({key:'primary'},{limit:2});
 if(page.items.length!==1)throw new Error('The shared project-number counter needs administrator setup.');
 return page.items[0];
}
export async function projectRoute(base44) {
 const page=await base44.asServiceRole.entities.ApprovalRouting.filter({table:'projects'},{limit:2});
 if(page.items.length>1)throw new Error('Duplicate project approval routes need administrator attention.');
 return page.items[0] || {enabled:false,named_emails:[]};
}
export async function refreshPendingProjectApprovers(base44,rule) {
 const revision=rule.changed_at || rule.updated_date || '',db=base44.asServiceRole.entities.ProjectApproval;
 let result;
 do {result=await db.updateMany({status:'pending',response:{$exists:false},route_revision:{$ne:revision}},{$set:{approver_emails:rule.enabled ? rule.named_emails : [],route_revision:revision}});}while(result.has_more);
}
export async function receiveProjectApproval(base44,projectId) {
 const db=base44.asServiceRole.entities,counter=await projectCounter(base44),project=await db.Project.get(projectId);
 if(Date.parse(project.created_date)<Date.parse(counter.enabled_from))return {skipped:true};
 return withProjectNumberLease(base44,async(lockedCounter,assertLease)=>{
 const old=(await db.ProjectApproval.filter({project_id:project.id},{limit:2})).items;
 if(old.length>1)throw new Error('Duplicate project approvals need administrator attention.');
 let request=old[0];
 if(!request){
  await advanceSyncedProjectCounter(base44,lockedCounter,project,assertLease);
  const rule=await projectRoute(base44);
  const snapshot=Object.fromEntries(['description','client_name','estimated_value','site_postcode','link_to_legals','link_to_pcs','link_to_pso','link_to_project_questionnaire','dataverse_id'].map(key=>[key,project[key] ?? null]));
  const result=await db.ProjectApproval.upsert([{project_id:project.id,project_name:project.name,snapshot,approver_emails:rule.enabled ? rule.named_emails : [],route_revision:rule.changed_at || '',status:'pending'}],{key:'project_id'});
  request=result.records[0];
 }
 const status=request.status==='approved' ? 'Approved' : request.status==='rejected' ? 'Rejected' : 'Approval Pending';
 const values={approval_status:status,...(request.status==='approved' ? {project_number:request.assigned_project_number} : {})};
 if(project.approval_status!==status || (values.project_number && project.project_number!==values.project_number))await db.Project.update(project.id,values);
 return {requestId:request.id,status:request.status};
 });
}