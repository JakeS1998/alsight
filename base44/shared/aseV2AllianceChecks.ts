import {commercialContractExposure} from './aseCommercialExposure.ts';
import {scoreAllianceContractExposure} from './aseV2DependencyScoring.ts';
import {filedCommercialTurnover} from './aseCommercialTurnover.ts';
import {v2UnavailableCheck} from './aseV2ExternalChecks.ts';
export async function allianceV2Checks(base44,account,configuration) {
  const now=new Date(),date=now.toISOString().slice(0,10),db=base44.entities,aliases=[account.id,account.dataverse_id].filter(Boolean);
  const [inputs,turnoverInputs,projects]=await Promise.all([db.ASEV2OrganisationInput.filter({account_id:account.id,input_type:'experience'},{sort:'-created_date',limit:40}),db.ASEV2OrganisationInput.filter({account_id:account.id,input_type:'turnover'},{sort:'-created_date',limit:1}),db.Project.aggregate({query:{$or:[{client_account_id:{$in:aliases}},{account_id:{$in:aliases}},{related_supplier_account_ids:{$in:aliases}}]},groupBy:['live_project','approval_status'],limit:50})]);
  const checks=[],exposure=v2UnavailableCheck('dependency','exposure','Alliance contract exposure','ALSight','No complete contract exposure and annual-turnover evidence available.'),experience=v2UnavailableCheck('experience','outcomes','Recorded Alliance outcomes','ALSight','Limited Alliance history is not poor performance.'),context={project_groups:projects.rows,project_reporting_truncated:projects.truncated};
  let dependency={status:'unavailable'},turnover;
  const declared=turnoverInputs.items[0];
  if(declared) turnover={status:'available',currency:'GBP',value:declared.turnover_value,period_end:declared.period_end,retrieved_at:declared.obtained_at,source_reference:declared.evidence_reference,source_label:`Reviewed ${declared.evidence_origin} annual GBP turnover`,origin:declared.evidence_origin,input_id:declared.id};
  else turnover={...await filedCommercialTurnover(base44,account,now,Infinity),origin:'external',source_label:'Companies House filed accounts'};
  try {
    const contracts=await commercialContractExposure(base44,account,date);
    const scored=scoreAllianceContractExposure(contracts,turnover,configuration,now);
    dependency=scored.dependency;
    Object.assign(exposure,scored.check);
  } catch(error){Object.assign(exposure,{state:'CHECK FAILED',reason:String(error.message).slice(0,600),checked_at:now.toISOString()});}
  const events=[...new Map(inputs.items.map(r=>[r.evidence_reference,r]).reverse()).values()];
  if(!inputs.has_more && events.length) {
    const scores=events.map(e=>configuration.experience_scores[e.outcome]),score=scores.reduce((s,v)=>s+v,0)/scores.length,stale=events.some(e=>(now.getTime()-Date.parse(e.event_date))/86400000>configuration.freshness_days.experience);
    Object.assign(experience,{state:events.some(e=>['unresolved_material','serious_unresolved'].includes(e.outcome)) ? 'ADVERSE' : 'POSITIVE',score,confidence:stale ? 'Low' : 'High',verified:true,checked_at:now.toISOString(),quality:stale ? configuration.quality.Low : configuration.quality.High,reason:`${events.length} administrator-verified structured outcome records, each scored by the configured outcome rubric; arithmetic mean ${score.toFixed(2)}/5. Project counts and casual comments are not sentiment-scored.${stale ? ' Older records reduce confidence.' : ''}`,records:events.map(e=>({outcome:e.outcome,date:e.event_date,reference:e.evidence_reference,reviewer:e.verified_by,input_id:e.id,score:configuration.experience_scores[e.outcome]}))});
  } else Object.assign(experience,{state:'LIMITED',checked_at:now.toISOString(),reason:inputs.has_more ? 'Input history exceeds one safe assessment page; no partial experience or turnover history score substituted.' : 'No structured, verified Alliance outcome record. Project activity alone is not evidence of good or poor performance.'});
  checks.push(exposure,experience);return {checks,dependency,experience:{...context,records:experience.records || []}};
}