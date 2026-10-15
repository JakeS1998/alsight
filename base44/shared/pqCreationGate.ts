import {resolvePQSubject,pqSubjectQuery,pqMaterialHash} from './pqSubject.ts';
import {pqGatewayStatus} from './pqGatewayStatus.ts';
import {withPQWriteLock,fail} from './pqApprovalCommon.ts';
import {projectRequestValues} from './projectCreateValues.ts';
export async function withPQCreationGate(base44,user,input,create){
 if(!['admin','director','bdm'].includes(user.role))fail('Project request access required.',403);
 if(!input.opportunityId&&!input.requestDraftId)fail('An approved PQ from an opportunity or saved new-project request is required before a project can be created.',409);
 const subject=await resolvePQSubject(base44,user,{...(input.opportunityId?{opportunityId:input.opportunityId}:{}),...(input.requestDraftId?{requestDraftId:input.requestDraftId}:{})}),db=base44.asServiceRole.entities;
 return await withPQWriteLock(db,subject.scope_key,async()=>{
  const fresh=await resolvePQSubject(base44,user,input.opportunityId?{opportunityId:input.opportunityId}:{requestDraftId:input.requestDraftId});
  const current=(await db.ProjectQuestionnaire.filter(pqSubjectQuery(fresh),{limit:1})).items[0];
  if(fresh.subject_type==='opportunity'&&fresh.source.status!=='won')fail('Mark the opportunity Won before creating a project.');
  const values=fresh.subject_type==='opportunity'?fresh.creation_values:projectRequestValues(input.values);
  const gate=await pqGatewayStatus(db,fresh,current,await pqMaterialHash(values));
  if(!gate.ready)fail(gate.reason,409);
  const attach=async project=>{
   if(current&&!fresh.created_project_id){
    await db.ProjectQuestionnaire.update(current.id,{project_id:project.id});
    await db.PQApprovalRound.updateMany(pqSubjectQuery(fresh),{$set:{project_id:project.id}});
    await db.Project.update(project.id,{pq_approval_date:gate.approvedAt});
   }
   if(fresh.subject_type==='opportunity')await db.Opportunity.update(fresh.id,{project_id:project.id});
   else await db.ProjectRequestDraft.update(fresh.id,{project_id:project.id});
  };
  return await create({values,requestKey:fresh.scope_key.replace(':','-'),existingProject:fresh.created_project_id?await db.Project.get(fresh.created_project_id):null,attach});
 });
}