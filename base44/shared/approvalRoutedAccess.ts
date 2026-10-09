export async function approvalSourceEntities(base44,request) {
 if(!request.routing_assigned)return base44.entities;
 const user=await base44.auth.me(),saved=await base44.entities.DocumentApprovalRequest.get(request.id);
 if(!saved || saved.approver_email!==user?.email?.trim().toLowerCase() || !saved.routing_assigned || saved.source_requires_approval===false || saved.source_id!==request.source_id || saved.source_table!==request.source_table)throw new Error('This approval is not assigned to you.');
 return base44.asServiceRole.entities;
}
export async function approvalLinkedRecords(base44,user,requests) {
 if(requests.length>25 || requests.some(r=>r.approver_email!==user.email.trim().toLowerCase()))throw new Error('Only your own approval page can be loaded.');
 const documents=[],projects=[];
 for(const routed of [false,true]){
  const scoped=requests.filter(r=>!!r.routing_assigned===routed),db=routed ? base44.asServiceRole.entities : base44.entities;
  for(const [table,entity] of Object.entries({documents:'LegalDocument',dma:'DMA',warranties:'Warranty'})){
   const ids=scoped.filter(r=>r.source_table===table).map(r=>r.source_id);
   if(ids.length){const page=await db[entity].filter({dataverse_id:{$in:ids}},{limit:50,fields:['dataverse_id','project_id','drafted_date','approval_date','approval_status']});documents.push(...page.items.map(d=>({...d,table,routed})));}
  }
  const ids=[...new Set(documents.filter(d=>d.routed===routed).map(d=>d.project_id).filter(Boolean))];
  if(ids.length){const page=await db.Project.filter({$or:[{dataverse_id:{$in:ids}},{id:{$in:ids}}]},{limit:50,fields:['dataverse_id']});projects.push(...page.items.map(p=>({...p,routed})));}
 }
 return {documents,projects};
}