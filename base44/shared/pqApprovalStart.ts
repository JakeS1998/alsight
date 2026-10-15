import {fail,hash,publicPQRound,canManagePQ} from './pqApprovalCommon.ts';
import {resolvePQApprovers} from './pqApprovalPeople.ts';
import {notifyPQApprover} from './pqApprovalNotify.ts';
import {questionnaireSections,missingQuestionnaireFields} from './projectQuestionnaireTemplate.ts';
import {pqSubjectLinks,pqSubjectQuery} from './pqSubject.ts';
export async function startPQApproval(base44,user,project,current,input){
 if(!canManagePQ(user)||project.created_project_id)fail('You cannot issue this questionnaire for approval.',403);
 if(!current||current.status!=='submitted'||missingQuestionnaireFields(current.answers).length)fail('Complete and submit the questionnaire before requesting approval.');
 if(input.revision!==current.revision)fail('The questionnaire changed. Reload before issuing it.',409);
 const db=base44.asServiceRole.entities;
 if(current.approval_round_id){const previous=await db.PQApprovalRound.get(current.approval_round_id);if(previous?.status==='active')fail('This questionnaire already has an active approval sequence.',409);if(previous&&current.revision<=previous.questionnaire_revision+1)fail('Reopen and resubmit the questionnaire before issuing a new approval sequence.',409);}
 const steps=await resolvePQApprovers(db,input.steps),issued_at=new Date().toISOString(),reference=`PQ-${project.project_number||'PROJECT'}-${crypto.randomUUID().slice(0,8)}`;
 const text=JSON.stringify({reference,project_name:project.name,project_number:project.project_number,template_version:current.template_version,issued_at,sections:questionnaireSections,answers:current.answers,...(project.creation_values?{proposed_project:{...project.creation_values,client_name:project.client_name}}:{})});
 const {file_uri}=await base44.asServiceRole.integrations.Core.UploadPrivateFile({file:new File([text],`${reference}.json`,{type:'application/json'})});
 const round=await db.PQApprovalRound.create({...pqSubjectLinks(project),...(project.context_hash?{context_hash:project.context_hash}:{}),questionnaire_id:current.id,questionnaire_revision:current.revision,project_name:project.name,project_number:project.project_number||'',reference,status:'active',current_index:0,issued_by_id:user.id,issued_by_name:user.full_name||user.email,issued_at,snapshot_uri:file_uri,snapshot_hash:await hash(text),steps});
 const linked=await db.ProjectQuestionnaire.updateMany({...pqSubjectQuery(project),revision:current.revision},{$set:{approval_round_id:round.id},$inc:{revision:1}});
 if(!linked.updated){await db.PQApprovalRound.update(round.id,{status:'withdrawn',withdrawn_at:issued_at,withdrawn_by:'System',withdrawal_reason:'Questionnaire changed before the issue could be linked.'});fail('Questionnaire changed while issuing. Reload and try again.',409);}
 return {round:publicPQRound(round),...await notifyPQApprover(base44,round)};
}