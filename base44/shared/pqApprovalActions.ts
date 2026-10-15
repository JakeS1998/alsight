import {authorisedPQRound,canManagePQ,fail,pqCurrentRecipient,publicPQRound,readPQSnapshot,withPQWriteLock} from './pqApprovalCommon.ts';
import {pqRecipientAction} from './pqApprovalDecision.ts';
import {pqApprovalPeople} from './pqApprovalPeople.ts';
import {startPQApproval} from './pqApprovalStart.ts';
export const pqRoundActions=['review','send_code','decide'];
export const pqProjectActions=['approval_state','recipients','start_approval','withdraw_approval'];
export async function pqRoundAction(base44,user,input){
 const initial=await authorisedPQRound(base44,user,input.roundId),db=base44.asServiceRole.entities;
 if(input.action==='review'){
  const questionnaire=await db.ProjectQuestionnaire.get(initial.questionnaire_id),linked=questionnaire?.approval_round_id===initial.id&&questionnaire.status==='submitted';
  return {round:publicPQRound(initial),snapshot:await readPQSnapshot(base44,initial),snapshotHash:initial.snapshot_hash,canDecide:linked&&pqCurrentRecipient(initial,user)};
 }
 return await withPQWriteLock(db,initial.project_id,async()=>pqRecipientAction(base44,user,await authorisedPQRound(base44,user,input.roundId),input));
}
export async function pqProjectAction(base44,user,project,current,input){
 const db=base44.asServiceRole.entities,canManage=canManagePQ(user);
 if(input.action==='approval_state'){
  if(input.cursor&&(typeof input.cursor!=='string'||input.cursor.length>8000))fail('Invalid approval history page.');
  const [round,page]=await Promise.all([current?.approval_round_id?db.PQApprovalRound.get(current.approval_round_id):null,db.PQApprovalRound.filter({project_id:project.id},{sort:'-issued_at',limit:10,...(input.cursor?{cursor:input.cursor}:{})})]);
  return {round:publicPQRound(round),history:page.items.map(publicPQRound),next_cursor:page.next_cursor,has_more:page.has_more,canManage,canStart:canManage&&current?.status==='submitted'&&(!round||(round.status!=='active'&&current.revision>round.questionnaire_revision+1))};
 }
 if(!canManage)fail('You cannot manage questionnaire approvals.',403);
 if(input.action==='recipients')return {items:await pqApprovalPeople(db,input.search)};
 if(input.action==='start_approval')return await startPQApproval(base44,user,project,current,input);
 if(!current?.approval_round_id||input.roundId!==current.approval_round_id)fail('Choose this questionnaire’s current approval issue.');
 const round=await db.PQApprovalRound.get(current.approval_round_id);
 if(round.status!=='active')fail('Only an active approval sequence can be withdrawn.',409);
 if(typeof input.comment!=='string'||!input.comment.trim()||input.comment.length>1000)fail('Provide a withdrawal reason, up to 1,000 characters.');
 const result=await db.PQApprovalRound.updateMany({id:round.id,status:'active'},{$set:{status:'withdrawn',withdrawn_at:new Date().toISOString(),withdrawn_by:user.full_name||user.email,withdrawal_reason:input.comment.trim()}});
 if(!result.updated)fail('This approval sequence has already changed. Reload it.',409);
 return {round:publicPQRound(await db.PQApprovalRound.get(round.id))};
}