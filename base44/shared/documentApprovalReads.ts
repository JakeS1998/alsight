import {approvalSource,approvalView,approvalMetadata} from './documentApprovalRecords.ts';
import {documentNeedsApproval} from './documentApprovalEligibility.ts';
const own = user => ({approver_email:user.email.trim().toLowerCase(),source_requires_approval:{$ne:false}});
export function approvalQuery(user,input) {
 let query=own(user);
 if(input.view==='approved')query={...query,status:'approved',decided_by_id:user.id};
 else if(input.view==='pending')query={...query,status:'pending'};
 if(input.project)query.project_id=input.project;
 if(input.projectName)query.project_name=input.projectName;
 if(input.type)query.source_table=input.type;
 if(input.requester)query.requested_by_name=input.requester;
 if(input.search){const pattern=input.search.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');query.$or=['document_title','document_number','project_name','project_number','client_name','requested_by_name'].map(field=>({[field]:{$regex:pattern,$options:'i'}}));}
 return query;
}
export async function approvalList(base44,user,input) {
 if(!['pending','approved','all','history'].includes(input.view))throw new Error('Choose an approval view.');
 if(input.search && (typeof input.search!=='string' || input.search.length>200))throw new Error('Keep your search within 200 characters.');
 for(const key of ['cursor','project','projectName','type','requester'])if(input[key]!==undefined && (typeof input[key]!=='string' || input[key].length>2000))throw new Error('Invalid approval filter.');
 const sorts={oldest:'requested_at',newest:'-requested_at',project:'project_name',type:'source_table',requester:'requested_by_name'};
 const sort=input.view==='approved' ? '-decided_at' : sorts[input.sort || 'oldest'];
 if(!sort)throw new Error('Choose a valid sort order.');
 const query=approvalQuery(user,input);
 if(input.view==='history')query.status={$ne:'pending'};
 const limit=input.limit===undefined ? 25 : input.limit;
 if(!Number.isInteger(limit) || limit<1 || limit>25)throw new Error('Invalid approval page size.');
 const page=await base44.entities.DocumentApprovalRequest.filter(query,{sort,limit,...(input.cursor ? {cursor:input.cursor} : {})});
 const documents=[];
 for(const table of ['documents','dma','warranties']){
  const ids=page.items.filter(r=>r.source_table===table).map(r=>r.source_id);
  if(ids.length){const entity=table==='documents' ? 'LegalDocument' : table==='dma' ? 'DMA' : 'Warranty';const docs=await base44.entities[entity].filter({dataverse_id:{$in:ids}},{limit:50,fields:['dataverse_id','project_id','drafted_date','approval_date','approval_status']});documents.push(...docs.items.map(d=>({...d,table})));}
 }
 const parentIds=[...new Set(documents.map(d=>d.project_id).filter(Boolean))];
 const projects=parentIds.length ? (await base44.entities.Project.filter({$or:[{dataverse_id:{$in:parentIds}},{id:{$in:parentIds}}]},{limit:50,fields:['dataverse_id']})).items : [];
 const items=page.items.filter(r=>documents.some(d=>d.table===r.source_table && d.dataverse_id===r.source_id && documentNeedsApproval(d) && projects.some(p=>p.dataverse_id===d.project_id || p.id===d.project_id))).map(approvalView);
 return {...page,items};
}
export async function approvalSummary(base44,user) {
 const db=base44.entities.DocumentApprovalRequest,query=own(user);
 const pending=await db.count({...query,status:'pending'});
 const approved=await db.count({...query,status:'approved',decided_by_id:user.id,decided_at:{$gte:new Date(Date.now()-30*86400000).toISOString()}});
 const total=await db.count(query);
 return {pending,approved,total};
}
export async function approvalOptions(base44,user) {
 const db=base44.entities.DocumentApprovalRequest,query=own(user),options={};
 for(const field of ['project_name','source_table','requested_by_name'])options[field]=(await db.filter(query,{distinct:field,limit:100})).items.filter(Boolean);
 return options;
}
export async function approvalDetail(base44,user,id) {
 const request=await base44.entities.DocumentApprovalRequest.get(id);
 if(!request || request.source_requires_approval===false || request.approver_email!==user.email.trim().toLowerCase())throw new Error('Approval is no longer in your inbox. Its recorded history has been retained.');
 const {document,project}=await approvalSource(base44,request);
 const history=await base44.asServiceRole.entities.DocumentApprovalEvent.filter({approval_id:request.id},{sort:'occurred_at',limit:50});
 const url=document.link_to_file;
 let documents=[];
 if(/^https:\/\//i.test(url || '')){const name=decodeURIComponent(new URL(url).pathname.split('/').pop() || '');const extension=name.match(/\.([a-z0-9]{1,8})$/i)?.[1];documents=[{name:extension ? name : request.document_title,url,kind:extension ? extension.toUpperCase() : 'Source document',download:false}];}
 const recoverable=request.writeback_status==='error' || (request.writeback_status==='pending' && Date.parse(request.decision_lock_until || '')<Date.now());
 return {request:{...approvalView(request),...approvalMetadata(document,project),project_value:project.estimated_value,can_respond:request.status==='pending',can_retry:recoverable && !!request.response && request.decided_by_id===user.id},documents,history:history.items,history_more:history.has_more,history_cursor:history.next_cursor};
}