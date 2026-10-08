import {approvalSource,approvalMetadata,approvalAudit} from './documentApprovalRecords.ts';
import {flowConfig,sharedFlowContext,flowRequest} from './dataverseFlowApi.ts';
import {isGuid} from './dataverseFlowFields.ts';
export async function receiveDocumentApproval(base44,user,input) {
 if(user.role!=='admin')throw new Error('Only an authenticated administrator can deliver document approval requests.');
 if(!['documents','dma','warranties'].includes(input.table) || !isGuid(input.sourceId) || !/^W\/"[0-9]+"$/.test(input.version || ''))throw new Error('Supply a supported document table, Dataverse row ID and current row version.');
 const email=typeof input.approverEmail==='string' ? input.approverEmail.trim().toLowerCase() : '';
 if(!email || email.length>250 || !(await base44.asServiceRole.entities.ApprovalAccess.count({email,enabled:true})))throw new Error('Choose an explicitly authorised document approver.');
 for(const field of ['reason','requesterName','requesterRole','requesterEmail'])if(input[field]!==undefined && (typeof input[field]!=='string' || input[field].length>(field==='reason' ? 4000 : 250)))throw new Error('Approval request information is too long.');
 if(!input.requestedAt || !Number.isFinite(Date.parse(input.requestedAt)))throw new Error('Supply the original request date.');
 const request={source_table:input.table,source_id:input.sourceId.toLowerCase(),approver_email:email};
 const {document,project}=await approvalSource(base44,request),config=await flowConfig(base44),settings=config?.tables?.[input.table];
 if(!settings)throw new Error('Confirm the document table mapping first.');
 const context=await sharedFlowContext(base44,config),source=await flowRequest(context.environment,context.token,`${settings.entitySet}(${request.source_id})?$select=${settings.primaryId}`);
 if(source['@odata.etag']!==input.version)throw new Error('The document changed after this approval was requested. Deliver its current version instead.');
 const key=`live:${input.table}:${request.source_id}:${input.version}:${email}`;
 const db=base44.asServiceRole.entities.DocumentApprovalRequest,previous=await db.filter({request_key:key},{limit:1});
 if(previous.items[0])return {ok:true,approval_id:previous.items[0].id,duplicate:true};
 const title=[document.document_id || document.warranty_id,project.name,document.services].filter(Boolean).join(' — ').slice(0,300);
 // Omit mutable decision fields from upsert: repeated delivery must never reset a completed decision.
 const result=await db.upsert([{...request,...approvalMetadata(document,project),request_key:key,source_version:input.version,document_title:title,document_url:document.link_to_file || '',...(document.drafted_date ? {drafted_date:document.drafted_date} : {}),requested_at:new Date(input.requestedAt).toISOString(),reason:input.reason || '',requested_by_name:input.requesterName || '',requested_by_role:input.requesterRole || '',requested_by_email:input.requesterEmail || ''}],{key:'request_key'});
 const saved=result.records[0];
 await approvalAudit(base44,saved,user,'Approval requested',{new_status:saved.status,actor_name:input.requesterName || user.full_name || user.email,integration_result:'Received from authenticated integration'});
 return {ok:true,approval_id:saved.id};
}