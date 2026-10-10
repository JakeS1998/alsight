import {approvalSource,approvalAudit,approvalEntity} from './documentApprovalRecords.ts';
import {flowConfig,flowRequest} from './dataverseFlowApi.ts';
import {personalDataverseContext,getPersonalDataverseToken} from './dataverseUserAuth.ts';
import {availableDecisionLease,decisionCanRetry} from './documentApprovalLease.ts';
import {resolveApprovalRequesters} from './approvalProjectRequester.ts';
const responses=['Approve','Approved - Subject to Comments','Further Review Required'];
const statusOf=value=>value==='Reject' ? 'rejected' : value==='Further Review Required' ? 'further_review_required' : 'approved';
export async function decideDocumentApproval(base44,user,input) {
 const db=base44.asServiceRole.entities.DocumentApprovalRequest;
 const request=await base44.entities.DocumentApprovalRequest.get(input.requestId);
 if(!request || request.approver_email!==user.email.trim().toLowerCase())throw new Error('Approval not found in your inbox.');
 const {document,project}=await approvalSource(base44,request);
 const retry=input.action==='retry',demo=request.request_key?.startsWith('demo:');
 if(retry){if(!decisionCanRetry(request,user))throw new Error('This decision is not available for retry.');}
 else {
  if(request.status!=='pending' || request.response)throw new Error('This request already has a decision. Refresh your inbox.');
  if(!responses.includes(input.response) || typeof input.comments!=='string' || input.comments.length>4000)throw new Error('Choose a response and keep comments within 4,000 characters.');
  if(input.response==='Approved - Subject to Comments' && !input.comments.trim())throw new Error('Comments are required for approval subject to comments.');
 }
 const requesters=await resolveApprovalRequesters(base44,[project]);
 const now=new Date().toISOString(),lock=crypto.randomUUID();
 const claimed=await db.updateMany({id:request.id,status:'pending',...availableDecisionLease(now)},{$set:{decision_lock:lock,decision_lock_until:new Date(Date.now()+180000).toISOString(),writeback_status:demo ? 'not_required' : 'pending'}});
 if(!claimed.updated)throw new Error('This decision is already being processed. Refresh your inbox.');
 const response=retry ? request.response : input.response,comments=retry ? request.decision_comments : input.comments.trim(),decidedAt=retry ? request.decided_at : now;
 try {
  const values={...requesters.get(project.id),response,decision_comments:comments,decided_by_id:user.id,decided_by_name:(user.full_name || user.email).slice(0,200),decided_at:decidedAt};
  if(!retry){await db.update(request.id,values);await approvalAudit(base44,request,user,'Decision recorded',{comment:comments,integration_result:demo ? 'Demo: ALSight only' : 'Integration pending'});}
  if(!demo)await writeDocumentDecision(base44,user,request,{...values,decided_at:decidedAt},document);
  const status=statusOf(response);
  await approvalAudit(base44,request,user,retry ? 'Decision retry confirmed' : response,{new_status:status,comment:comments,integration_result:demo ? 'Demo: Dataverse unchanged' : 'Confirmed in Dataverse'});
  await db.update(request.id,{...values,status,...(!demo ? {source_requires_approval:false} : {}),writeback_status:demo ? 'not_required' : 'confirmed',integration_error:'',decision_lock:'',decision_lock_until:'1970-01-01T00:00:00.000Z'});
  return {ok:true,is_demo:demo,status};
 } catch(error){
  const message=String(error.message || 'Dataverse did not confirm this decision.').slice(0,1000);
  await db.update(request.id,{writeback_status:'error',integration_error:message,decision_lock:'',decision_lock_until:'1970-01-01T00:00:00.000Z'});
  await approvalAudit(base44,request,user,'Integration failed',{comment:comments,integration_result:message});
  return {ok:false,integration_failed:true,message};
 }
}
async function writeDocumentDecision(base44,user,request,decision,document) {
 const config=await flowConfig(base44),settings=config?.tables?.[request.source_table];
 const required=['approval_status','approval_date','approval_comments','approvers_name'];
 const mappings=required.map(field=>settings?.mappings?.find(m=>m.local===field && m.write));
 if(mappings.some(m=>!m))throw new Error('Approval write-back is not enabled for this document type. An administrator must confirm the four approval fields before live decisions can complete.');
 if(!/^W\/"[0-9]+"$/.test(request.source_version))throw new Error('This approval has no verified Dataverse version. Request a fresh approval before deciding.');
 const {environment,record}=await personalDataverseContext(base44,user);
 if(environment!==config.environment_url)throw new Error('The Dataverse environment has changed. Request a fresh approval.');
 const token=await getPersonalDataverseToken(base44,user,environment,record);
 const values={approval_status:decision.response==='Approve' ? 'Approve' : decision.response==='Reject' ? 'Rejected' : decision.response,approval_date:decision.decided_at,approval_comments:decision.decision_comments,approvers_name:decision.decided_by_name};
 const payload={};
 for(const mapping of mappings){if(!['String','Memo','DateTime'].includes(mapping.type))throw new Error('Confirm the document approval result mapping before enabling write-back.');payload[mapping.source]=values[mapping.local];}
 const path=`${settings.entitySet}(${request.source_id})`;
 const current=await flowRequest(environment,token,`${path}?$select=${mappings.map(m=>m.source).join(',')}`);
 const matches=mappings.every(m=>m.local==='approval_date' ? Date.parse(current[m.source])===Date.parse(values[m.local]) : (current[m.source] || '')===values[m.local]);
 if(!matches){
  const field=local=>mappings.find(m=>m.local===local).source;
  if(String(current[field('approval_status')] || '').trim().toLowerCase()!=='approval pending' || String(current[field('approval_date')] || '').trim())throw new Error('This document is no longer marked Approval Pending in Dataverse. Refresh your inbox.');
  await flowRequest(environment,token,path,{method:'PATCH',headers:{'If-Match':request.source_version},body:JSON.stringify(payload)});
 }
 const confirmed=await flowRequest(environment,token,`${path}?$select=${mappings.map(m=>m.source).join(',')}`);
 if(!mappings.every(m=>m.local==='approval_date' ? Date.parse(confirmed[m.source])===Date.parse(values[m.local]) : (confirmed[m.source] || '')===values[m.local]))throw new Error('Dataverse has not confirmed the recorded decision.');
 await base44.asServiceRole.entities[approvalEntity(request.source_table)].update(document.id,values);
}