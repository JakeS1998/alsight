import {projectRequestValues} from './projectCreateValues.ts';
import {pqDraftAccess,pqMaterialHash,pqSubjectQuery,resolvePQSubject} from './pqSubject.ts';
import {withPQWriteLock,fail} from './pqApprovalCommon.ts';
export async function pqRequestDraftAction(base44,user,input){
 if(!['admin','director','bdm'].includes(user.role))fail('Project request access required.',403);
 const db=base44.asServiceRole.entities;
 if(input.action==='list_requests'){
  if(input.cursor&&(typeof input.cursor!=='string'||input.cursor.length>8000))fail('Invalid request page.');
  return await db.ProjectRequestDraft.filter({owner_id:user.id,project_id:{$exists:false}},{sort:'-updated_date',limit:10,fields:['name','client_name','request_key'],...(input.cursor?{cursor:input.cursor}:{})});
 }
 if(input.action==='load_request')return {draft:await pqDraftAccess(base44,user,input.requestDraftId)};
 if(typeof input.requestKey!=='string'||!/^[a-zA-Z0-9_-]{1,100}$/.test(input.requestKey))fail('Invalid project request identity.');
 const values=projectRequestValues(input.values);
 let client_name='';
 if(values.client_account_id){const accounts=await base44.entities.Account.filter({$or:[{dataverse_id:values.client_account_id},{id:values.client_account_id}]},{limit:2});const account=accounts.items[0];if(!account||account.account_type!=='client')fail('Choose an available client account.');client_name=account.name;}
 let draft=input.requestDraftId?await pqDraftAccess(base44,user,input.requestDraftId):(await db.ProjectRequestDraft.filter({owner_id:user.id,request_key:input.requestKey},{limit:1})).items[0];
 if(!draft)return {draft:await db.ProjectRequestDraft.create({owner_id:user.id,request_key:input.requestKey,name:values.name,client_name,values})};
 if(draft.project_id)fail('This request has already created a project. Open the project instead.',409);
 return await withPQWriteLock(db,`request:${draft.id}`,async()=>{
  draft=await pqDraftAccess(base44,user,draft.id);
  const subject=await resolvePQSubject(base44,user,{requestDraftId:draft.id}),current=(await db.ProjectQuestionnaire.filter(pqSubjectQuery(subject),{limit:1})).items[0];
  const round=current?.approval_round_id?await db.PQApprovalRound.get(current.approval_round_id):null;
  if(round?.status==='active'&&await pqMaterialHash(values)!==subject.context_hash)fail('Withdraw the active PQ approval before changing the proposed project details.',409);
  return {draft:await db.ProjectRequestDraft.update(draft.id,{name:values.name,client_name,values})};
 });
}