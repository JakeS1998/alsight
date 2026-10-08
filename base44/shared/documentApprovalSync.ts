import {approvalEntity,approvalMetadata} from './documentApprovalRecords.ts';
import {refreshDocumentApprovalDates} from './documentApprovalDates.ts';
export const documentNeedsApproval = document => !!String(document.drafted_date || '').trim() && !String(document.approval_date || '').trim();
const approverEmail='jake@allianceleisure.co.uk';
const sameDraft=(a,b)=>Number.isFinite(Date.parse(a)) && Date.parse(a)===Date.parse(b);
export async function syncDocumentApprovals(base44,table,documents) {
 if(!approvalEntity(table) || !documents.length)return {added:0,removed:0,restored:0,unlinked:0};
 if(documents.length>50)throw new Error('Document approval reconciliation is limited to 50 documents per batch.');
 const db=base44.asServiceRole.entities,ids=documents.map(d=>d.dataverse_id).filter(Boolean);
 const requests=[];let cursor;
 do {const page=await db.DocumentApprovalRequest.filter({source_table:table,source_id:{$in:ids}},{limit:100,...(cursor ? {cursor} : {})});requests.push(...page.items);cursor=page.has_more ? page.next_cursor : null;}while(cursor);
 const parentIds=[...new Set(documents.map(d=>d.project_id).filter(Boolean))];
 const projects=parentIds.length ? (await db.Project.filter({$or:[{dataverse_id:{$in:parentIds}},{id:{$in:parentIds}}]},{limit:100})).items : [];
 const canCreate=(await db.ApprovalAccess.count({email:approverEmail,enabled:true}))>0;
 const now=new Date().toISOString(),changes=[],newRequests=[],events=[],counts={added:0,removed:0,restored:0,unlinked:0};
 const event=(r,action)=>({approval_id:r.id,action,actor_id:'document-date-sync',actor_name:'Document date sync',occurred_at:now,previous_status:r.status,new_status:r.status,integration_result:'Reconciled with the document drafted and approval dates. Decisions and audit history retained.'});
 for(const document of documents){
  if(!document.dataverse_id){counts.unlinked++;continue;}
  const related=requests.filter(r=>r.source_id===document.dataverse_id),project=projects.find(p=>p.dataverse_id===document.project_id || p.id===document.project_id),eligible=documentNeedsApproval(document);
  for(const request of related){
   const visible=eligible && sameDraft(request.drafted_date,document.drafted_date);
   const metadata=project ? approvalMetadata(document,project) : {};
   if(request.source_requires_approval!==visible || Object.entries(metadata).some(([key,value])=>request[key]!==value))changes.push({id:request.id,...metadata,source_requires_approval:visible});
   if(!visible && request.source_requires_approval!==false){counts.removed++;events.push(event(request,'Removed from Approval Centre'));}
   if(visible && request.source_requires_approval===false){counts.restored++;events.push(event(request,'Returned to Approval Centre'));}
  }
  if(!eligible || related.some(r=>r.approver_email===approverEmail && sameDraft(r.drafted_date,document.drafted_date)))continue;
  if(!project){counts.unlinked++;continue;}
  if(!canCreate)continue;
  // Keep the existing inbox's demo-only decision mode; syncing dates does not enable live write-back.
  const drafted=new Date(document.drafted_date).toISOString();
  newRequests.push({request_key:`demo:${table}:${document.id}:${drafted}:${approverEmail}`,source_table:table,source_id:document.dataverse_id,source_version:`demo:${drafted}`,source_requires_approval:true,...approvalMetadata(document,project),drafted_date:drafted,document_title:[document.document_id || document.warranty_id,project.name,document.services].filter(Boolean).join(' — ').slice(0,300),document_url:document.link_to_file || '',approver_email:approverEmail,requested_at:now,reason:'Synced because this document has a drafted date and no recorded approval date.'});
 }
 if(changes.length)await db.DocumentApprovalRequest.bulkUpdate(changes);
 if(events.length)await db.DocumentApprovalEvent.bulkCreate(events);
 if(newRequests.length){const result=await db.DocumentApprovalRequest.upsert(newRequests,{key:'request_key'});counts.added=result.created;await db.DocumentApprovalEvent.bulkCreate(result.records.map(r=>event(r,'Added from document sync')));}
 return counts;
}
export async function syncDocumentApprovalPage(base44,input) {
 const entity=approvalEntity(input.table);
 if(!entity)throw new Error('Choose legal documents, development agreements or warranties.');
 if(input.cursor!==undefined && (typeof input.cursor!=='string' || input.cursor.length>2000))throw new Error('Invalid document cursor.');
 for(const key of ['refreshDates','inboxOnly'])if(input[key]!==undefined && typeof input[key]!=='boolean')throw new Error('Invalid document date check option.');
 const db=base44.asServiceRole.entities,options={sort:'created_date',limit:50,...(input.cursor ? {cursor:input.cursor} : {})};
 const page=input.inboxOnly ? await db.DocumentApprovalRequest.filter({source_table:input.table,approver_email:approverEmail,source_requires_approval:{$ne:false}},options) : await db[entity].filter({},options);
 const documents=input.inboxOnly ? (await db[entity].filter({dataverse_id:{$in:page.items.map(r=>r.source_id)}},{limit:50})).items : page.items;
 const fresh=input.refreshDates ? await refreshDocumentApprovalDates(base44,input.table,documents) : {documents,checked:0,missing:0};
 return {...await syncDocumentApprovals(base44,input.table,fresh.documents),processed:documents.length,checked: fresh.checked,missing:fresh.missing,has_more:page.has_more,next_cursor:page.next_cursor};
}