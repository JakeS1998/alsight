import {missingQuestionnaireFields} from './projectQuestionnaireTemplate.ts';
export async function pqGatewayStatus(db,subject,current,contextHash=subject.context_hash){
 if(subject.created_project_id)return {ready:true,projectId:subject.created_project_id,reason:'The project has already been created.'};
 if(!current)return {ready:false,status:'missing',reason:'Complete the PQ and obtain all sequential approvals before creating the project.'};
 if(current.status!=='submitted')return {ready:false,status:'draft',reason:'The PQ is a draft. Complete, submit and approve it before creating the project.'};
 const round=current.approval_round_id?await db.PQApprovalRound.get(current.approval_round_id):null;
 if(!round||round.status!=='approved')return {ready:false,status:round?.status||'not_issued',reason:round?.status==='active'?'The PQ is awaiting sequential approval.':round?.status==='rejected'?'The PQ was rejected. Revise it and obtain a new approval.':'The PQ needs a completed approval sequence.'};
 if(round.questionnaire_id!==current.id||current.revision!==round.questionnaire_revision+1||!round.steps?.length||round.current_index!==round.steps.length||round.steps.some(step=>step.status!=='approved'||step.verification_method!=='email_otp')||missingQuestionnaireFields(current.answers).length)return {ready:false,status:'stale',reason:'The latest PQ version needs a fresh approval sequence.'};
 if(subject.subject_type!=='project'&&(!round.context_hash||round.context_hash!==contextHash))return {ready:false,status:'changed',reason:'The proposed project name, client, scope, value or postcode has changed. Reopen the PQ, check it and request fresh approval.'};
 return {ready:true,status:'approved',reference:round.reference,roundId:round.id,approvedAt:round.completed_at,reason:'PQ approved. The project creation gateway is satisfied.'};
}