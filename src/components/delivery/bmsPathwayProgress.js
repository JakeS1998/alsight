export default function bmsPathwayProgress(stages, catalog, reviews, matches, evidence, project) {
 if(!catalog)return stages.map(stage=>({...stage,percent:null,complete:false,status:'Insufficient Data',explanation:'BMS checks are loading; completion is not yet confirmed.'}));
 const saved=Object.fromEntries((reviews||[]).map(row=>[row.requirement_key,row]));
 const tasks=catalog.map(task=>{
  const review=saved[task.key],source=task.source?evidence[task.source]:null,linked=task.source?null:matches?.[task.key];
  const autoNa=task.framework&&project.procurement_route===false;
  const na=autoNa||(task.conditional&&review?.status==='not_applicable'&&!!review.reason?.trim());
  const validGate=!task.gate||(!!review?.approver?.trim()&&!!review?.approval_date&&Date.parse(review.approval_date)<=Date.now());
  const manualDone=review?.status==='complete'&&!!review.evidence_reference?.trim()&&validGate;
  const done=na||!!(linked?linked.done:source?source.done:manualDone);
  return {...task,review,linked,done,notApplicable:na,reason:autoNa?'Non-framework project':review?.reason,detail:linked?.detail||source?.detail||task.detail,url:review?.evidence_url||source?.url,subchecks:source?.subchecks,pending:source?.pending};
 });
 return stages.map(stage=>{
  const checks=tasks.filter(task=>task.stage===stage.id),required=checks.filter(task=>!task.notApplicable),pending=required.some(task=>task.pending);
  const done=required.filter(task=>task.done).length,percent=pending?null:required.length?Math.min(done===required.length?100:99,Math.round(done/required.length*100)):100;
  const gates=required.filter(task=>task.gate&&!task.done);
  return {...stage,checks,percent,complete:percent===100,status:percent==null?'Insufficient Data':percent===100?'Complete':done||checks.some(task=>task.review||task.linked)?'In Progress':'Not Started',explanation:`${done} of ${required.length} applicable requirements recorded. ${gates.length} formal approval/decision ${gates.length===1?'gate':'gates'} outstanding. Dates alone do not establish approval. Tasks remain accessible in any stage.`};
 });
}