import {fail,hash} from './riskApprovalData.ts';
import {resolvePQSubject} from './pqSubject.ts';
export {fail,hash};
export const pqRoles=['admin','director','regional_director','bsm','finance','bdm'];
export const canManagePQ=user=>['admin','director','bdm','bsm'].includes(user.role);
export const publicPQRound=round=>round?Object.fromEntries(['id','project_id','opportunity_id','request_draft_id','questionnaire_id','questionnaire_revision','project_name','project_number','reference','status','current_index','issued_by_id','issued_by_name','issued_at','steps','completed_at','withdrawn_by','withdrawn_at','withdrawal_reason','notification_status'].map(key=>[key,round[key]])):null;
export const pqCurrentRecipient=(round,user)=>round?.status==='active'&&round.steps[round.current_index]?.user_id===user.id&&round.steps[round.current_index]?.email.toLowerCase()===user.email?.toLowerCase();
export async function withPQWriteLock(db,projectId,operation){
 const {records}=await db.PQWriteLock.upsert([{project_id:projectId}],{key:'project_id'}),lock=records[0],token=crypto.randomUUID(),now=new Date().toISOString();
 const claim=await db.PQWriteLock.updateMany({id:lock.id,lease_until:{$lt:now}},{$set:{lease_token:token,lease_until:new Date(Date.now()+180000).toISOString()}});
 if(!claim.updated)fail('Another questionnaire change is in progress. Please try again shortly.',409);
 try{return await operation();}finally{await db.PQWriteLock.updateMany({id:lock.id,lease_token:token},{$set:{lease_until:'1970-01-01T00:00:00.000Z',lease_token:''}});}
}
export async function authorisedPQRound(base44,user,id){
 if(typeof id!=='string'||!/^[a-f0-9]{24}$/i.test(id))fail('Choose a valid approval issue.');
 const round=await base44.asServiceRole.entities.PQApprovalRound.get(id);
 if(!round)fail('Approval issue not found.',404);
 if(!pqRoles.includes(user.role))fail('Internal approval access required.',403);
 if(user.role!=='admin'&&round.issued_by_id!==user.id&&!round.steps.some(step=>step.user_id===user.id&&step.email.toLowerCase()===user.email?.toLowerCase())){
  await resolvePQSubject(base44,user,round.project_id?{projectId:round.project_id}:round.opportunity_id?{opportunityId:round.opportunity_id}:{requestDraftId:round.request_draft_id});
 }
 return round;
}
export async function readPQSnapshot(base44,round){
 const {signed_url}=await base44.asServiceRole.integrations.Core.CreateFileSignedUrl({file_uri:round.snapshot_uri,expires_in:60});
 const response=await fetch(signed_url,{signal:AbortSignal.timeout(15000)});
 if(!response.ok)fail('Unable to load the issued questionnaire.',502);
 const text=await response.text();if(await hash(text)!==round.snapshot_hash)fail('The issued questionnaire failed its integrity check.',409);
 return JSON.parse(text);
}