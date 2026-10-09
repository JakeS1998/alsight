import {approvalSource,approvalMetadata,approvalAudit} from './documentApprovalRecords.ts';
import {flowConfig,sharedFlowContext,flowRequest} from './dataverseFlowApi.ts';
import {isGuid} from './dataverseFlowFields.ts';
import {syncDocumentApprovals} from './documentApprovalSync.ts';
import {resolveApprovalRouting} from './approvalRoutingResolve.ts';
export async function receiveDocumentApproval(base44,user,input) {
 if(user.role!=='admin')throw new Error('Only an authenticated administrator can deliver document approval requests.');
 if(!['documents','dma','warranties'].includes(input.table) || !isGuid(input.sourceId) || !/^W\/"[0-9]+"$/.test(input.version || ''))throw new Error('Supply a supported document table, Dataverse row ID and current row version.');
 const email=typeof input.approverEmail==='string' ? input.approverEmail.trim().toLowerCase() : '';
 if(input.approverEmail!==undefined && (!email || email.length>250))throw new Error('Supply a valid optional approver email.');
 for(const field of ['reason','requesterName','requesterRole','requesterEmail'])if(input[field]!==undefined && (typeof input[field]!=='string' || input[field].length>(field==='reason' ? 4000 : 250)))throw new Error('Approval request information is too long.');
 if(!input.requestedAt || !Number.isFinite(Date.parse(input.requestedAt)))throw new Error('Supply the original request date.');
 const request={source_table:input.table,source_id:input.sourceId.toLowerCase(),approver_email:email};
 const {document,project}=await approvalSource(base44,request),config=await flowConfig(base44),settings=config?.tables?.[input.table];
 if(!settings)throw new Error('Confirm the document table mapping first.');
 const context=await sharedFlowContext(base44,config),source=await flowRequest(context.environment,context.token,`${settings.entitySet}(${request.source_id})?$select=${settings.primaryId}`);
 if(source['@odata.etag']!==input.version)throw new Error('The document changed after this approval was requested. Deliver its current version instead.');
 const {results}=await resolveApprovalRouting(base44,input.table,[{document,project}]);
 const recipients=results[0].emails;
 if(!recipients.length)throw new Error(`No eligible approvers resolved. ${results[0].reasons.join(' ')}`);
 if(email && !recipients.includes(email))throw new Error('The supplied approver does not match the saved table routing rule.');
 const synced=await syncDocumentApprovals(base44,input.table,[{...document,approval_source_version:input.version}]);
 const db=base44.asServiceRole.entities.DocumentApprovalRequest;
 const page=await db.filter({source_table:input.table,source_id:request.source_id,drafted_date:new Date(document.drafted_date).toISOString(),approver_email:{$in:recipients}},{limit:50});
 const pending=page.items.filter(r=>r.status==='pending' && !r.response);
 if(pending.length)await db.bulkUpdate(pending.map(r=>({id:r.id,requested_at:new Date(input.requestedAt).toISOString(),reason:input.reason || r.reason,requested_by_name:input.requesterName || '',requested_by_role:input.requesterRole || '',requested_by_email:input.requesterEmail || ''})));
 return {ok:true,approval_id:page.items[0]?.id,approval_ids:page.items.map(r=>r.id),duplicate:synced.added===0};
}