import { pathwayBmsCatalog, pathwayBmsVersion } from './pathwayBmsCatalog.ts';
import { bmsFail, bmsLinkedRecord, readBmsReviews } from './pathwayBmsRecords.ts';
const text = (input, key, max = 2000) => { const value=input[key]??''; if(typeof value!=='string'||value.length>max)bmsFail(`Invalid ${key.replaceAll('_',' ')}.`); return value.trim(); };
export async function saveBmsReview(base44,user,project,input) {
 if(!['admin','director','bdm','bsm'].includes(user.role))bmsFail('This pathway is read-only for your role.',403);
 const task=pathwayBmsCatalog.find(t=>t.key===input.requirementKey);
 if(!task)bmsFail('Choose a BMS requirement.');
 const values=Object.fromEntries(['status','reason','evidence_reference','evidence_url','approver','approval_date','linked_entity','linked_id'].map(key=>[key,text(input,key,key==='approver'?250:2000)]));
 if(!['outstanding','complete','not_applicable'].includes(values.status))bmsFail('Choose a valid review status.');
 if(values.evidence_url&&!/^https:\/\/[^\s]+$/i.test(values.evidence_url))bmsFail('Evidence links must use https.');
 if(values.evidence_url){try{new URL(values.evidence_url);}catch{bmsFail('Enter a valid evidence link.');}}
 const db=base44.asServiceRole.entities,reviews=await readBmsReviews(db,project.id);
 const current=reviews.find(r=>r.requirement_key===task.key);
 if((current?.revision||0)!==input.revision)bmsFail('This review changed. Reload the checks before saving.',409);
 if(task.framework&&project.procurement_route===false)bmsFail('This requirement is automatically not applicable to a non-framework project.');
 if(values.status==='not_applicable') {
  if(!task.conditional||values.reason.length<10)bmsFail('This requirement needs an applicability reason of at least 10 characters.');
  if(task.gate&&!['admin','director'].includes(user.role))bmsFail('Only an administrator or director can record gateway non-applicability.',403);
 }
 if(task.source && (values.status==='complete'||values.linked_id))bmsFail('Update the existing source record instead; this requirement is not a duplicate manual task.');
 let linked=null;
 if(values.linked_id) {
  if(!['ProjectAction','ProjectDecision'].includes(values.linked_entity))bmsFail('Link an existing action or decision.');
  if(reviews.some(r=>r.requirement_key!==task.key&&r.linked_id===values.linked_id&&r.linked_entity===values.linked_entity))bmsFail('This record already supplies another requirement. Review that mapping instead of counting it twice.');
  const row=await base44.entities[values.linked_entity].get(values.linked_id);
  if(!row||row.project_id!==project.id)bmsFail('The linked record must belong to this project.',403);
  if(task.gate&&values.linked_entity!=='ProjectDecision')bmsFail('Formal gates must link an existing decision, not an action.');
  linked=bmsLinkedRecord(values.linked_entity,row,task.gate);
  if(values.status!=='not_applicable')values.status=linked.done?'complete':'outstanding';
 } else values.linked_entity='';
 if(values.status==='complete'&&!linked) {
  if(!values.evidence_reference)bmsFail('Add an evidence reference before recording completion.');
  if(task.gate&&(!values.approver||!/^\d{4}-\d{2}-\d{2}$/.test(values.approval_date)||!Number.isFinite(Date.parse(values.approval_date))||Date.parse(values.approval_date)>Date.now()))bmsFail('Record the approver and a valid approval date that has been reached. A milestone date alone is not approval.');
 }
 if((current?.history?.length||0)>=200)bmsFail('This review has reached its retained history limit. No history has been removed.',409);
 const snapshot={...values,recorded_by:user.id,recorded_by_name:user.full_name||user.email,recorded_at:new Date().toISOString()};
 const payload={...snapshot,project_id:project.id,requirement_key:task.key,stage:task.stage,procedure:task.procedure,catalog_version:pathwayBmsVersion,revision:(current?.revision||0)+1,history:[...(current?.history||[]),snapshot]};
 if(current) {
  const result=await db.PathwayBMSReview.updateMany({id:current.id,project_id:project.id,revision:current.revision},{$set:payload});
  if(!result.updated)bmsFail('Another editor updated this task. Reload before saving.',409);
  return {...payload,id:current.id};
 }
 return await db.PathwayBMSReview.create(payload);
}