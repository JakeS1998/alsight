const entities = {documents:'LegalDocument',dma:'DMA',warranties:'Warranty'};
export const approvalEntity = table => entities[table];
export async function approvalSource(base44, request) {
 const entity=entities[request.source_table];
 if(!entity)throw new Error('Unknown document type.');
 const page=await base44.entities[entity].filter({dataverse_id:request.source_id},{limit:2});
 if(page.items.length!==1)throw new Error('This document is not available under your current ALSight permissions.');
 const document=page.items[0];
 const projects=await base44.entities.Project.filter({$or:[{dataverse_id:document.project_id},{id:document.project_id}]},{limit:2});
 if(projects.items.length!==1)throw new Error('The linked project is not available under your current ALSight permissions.');
 return {document,project:projects.items[0]};
}
export function approvalMetadata(document,project) {
 return {source_record_id:document.id,document_number:document.document_id || document.warranty_id || '',document_type:document.document_type || '',project_id:project.id,project_name:project.name,project_number:project.project_number || '',client_name:project.client_name || '',client_account_id:project.client_account_id || '',account_id:document.account_id || '',bdm_aad_id:project.bdm_aad_id || '',bsm_aad_id:project.bsm_aad_id || '',department_id:project.department_id || ''};
}
export function approvalView(request) {
 const {request_key,source_version,decision_lock,decision_lock_until,...view}=request;
 return {...view,is_demo:request_key?.startsWith('demo:')===true,approval_type:request.source_table==='dma' ? 'Development agreement' : request.source_table==='warranties' ? 'Warranty' : 'Legal document'};
}
export async function approvalAudit(base44,request,user,action,values={}) {
 return await base44.asServiceRole.entities.DocumentApprovalEvent.create({approval_id:request.id,action,actor_id:user.id,actor_name:(user.full_name || user.email).slice(0,200),occurred_at:new Date().toISOString(),previous_status:request.status,new_status:request.status,...values});
}