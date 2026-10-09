import {professionalIndemnityKey,insuranceAdjustedScore} from './aseProfessionalIndemnity.ts';
export const aseV2States=['CLEAR','POSITIVE','ADVERSE','LIMITED','UNAVAILABLE','CHECK FAILED'];
const round=value=>Number(value.toFixed(6));
export function dependencyScore(percentage,policy) {const curve=policy.dependency_curve;if(percentage>=curve.at(-1).percentage) return curve.at(-1).score;const upper=curve.findIndex(r=>r.percentage>=percentage);if(upper<=0) return curve[0].score;const a=curve[upper-1],b=curve[upper];return round(a.score+(b.score-a.score)*(percentage-a.percentage)/(b.percentage-a.percentage));}
export function calculateASEV2(policy,checks) {
  const components=policy.components.map(rule=>{
    const rows=checks.filter(c=>c.component===rule.key && c.slot in policy.slots[rule.key]),slots=policy.slots[rule.key];
    for(const row of rows) {if(!aseV2States.includes(row.state) || row.score!=null && (!Number.isFinite(row.score) || row.score<1 || row.score>5) || row.score!=null && ['UNAVAILABLE','CHECK FAILED'].includes(row.state)) throw new Error('Invalid evidence state or normalised score.');}
    if(new Set(rows.map(r=>r.slot)).size!==rows.length) throw new Error('One assessed evidence result is required per slot; duplicate evidence cannot increase coverage.');
    const scored=rows.filter(r=>Number.isFinite(r.score)),assessed=scored.reduce((sum,r)=>sum+slots[r.slot],0),score=assessed ? scored.reduce((sum,r)=>sum+r.score*slots[r.slot],0)/assessed : null;
    rows.forEach(row=>{row.configured_subweight=slots[row.slot];row.effective_subweight=row.score===null || !assessed ? 0 : round(slots[row.slot]/assessed*100);row.component_contribution=row.score===null ? 0 : round(row.score*row.effective_subweight/100);});
    const coverage=scored.reduce((sum,r)=>sum+slots[r.slot]*Math.max(0,Math.min(1,r.quality ?? policy.quality[r.confidence] ?? policy.quality.Low)),0);
    return {key:rule.key,label:rule.label,weight:rule.weight,score:score===null ? null : round(score),coverage:round(coverage),check_keys:rows.map(r=>r.key),configured_contribution:score===null ? null : round(score*rule.weight/100)};
  });
  const used=components.filter(c=>c.score!==null && c.weight>0),assessed_weight=used.reduce((sum,c)=>sum+c.weight,0),coverage=round(components.reduce((sum,c)=>sum+c.weight*c.coverage/100,0)),raw_score=assessed_weight ? round(used.reduce((sum,c)=>sum+c.score*c.weight,0)/assessed_weight) : null;
  components.forEach(c=>{c.effective_weight=c.score===null || !assessed_weight ? 0 : round(c.weight/assessed_weight*100);c.weighted_contribution=c.score===null ? 0 : round(c.score*c.effective_weight/100);});
  const caps=checks.filter(c=>c.state==='ADVERSE' && c.verified===true && c.slot!=='individual_insolvency' && c.severe_event in policy.caps).map(c=>({event:c.severe_event,cap:policy.caps[c.severe_event],check_key:c.key,reason:c.reason,source_reference:c.source_reference}));
  const insurance=checks.find(c=>c.key===professionalIndemnityKey && c.verified===true);
  if(insurance?.score_cap!=null)caps.push({event:'professional_indemnity_under_2m',cap:insurance.score_cap,check_key:insurance.key,reason:insurance.reason,source_reference:insurance.source_reference});
  const optionalWeight=policy.leadership?.individual_insolvency_optional ? (policy.components.find(c=>c.key==='adverse')?.weight || 0)*(policy.slots.adverse.individual_insolvency || 0)/100 : 0;
  const personalCoverage=checks.find(c=>c.component==='adverse' && c.slot==='individual_insolvency'),personalPoints=personalCoverage?.score!=null ? optionalWeight*(personalCoverage.quality ?? policy.quality[personalCoverage.confidence] ?? policy.quality.Low) : 0;
  const qualifying_coverage=round((coverage-personalPoints)/(100-optionalWeight)*100);
  const sufficient=qualifying_coverage>=policy.confidence.minimum || caps.some(c=>c.event!=='professional_indemnity_under_2m'),final_score=raw_score===null || !sufficient ? null : round(Math.min(insuranceAdjustedScore(raw_score,insurance),...caps.map(c=>c.cap))),confidence=coverage>=policy.confidence.high ? 'High' : coverage>=policy.confidence.medium ? 'Medium' : 'Low';
  const classification=final_score===null ? 'Not assessed' : policy.classifications.find(c=>final_score>=c.minimum)?.label || 'Critical';
  return {components,assessed_weight,coverage,qualifying_coverage,raw_score,final_score,confidence,classification,caps};
}
export function explainASEV2(result,checks) {
  const parts=result.components.filter(c=>c.score!==null).map(c=>`${c.label}: ${c.score.toFixed(2)}/5 × ${c.effective_weight.toFixed(2)}% effective weight = ${c.weighted_contribution.toFixed(4)}.`);
  const limits=checks.filter(c=>c.score===null).map(c=>`${c.label}: ${c.state}, ${c.reason}`);
  return [`Alliance Stability & Exposure, ASE v2. ${parts.join(' ')} Raw ASE ${result.raw_score===null ? 'not available' : result.raw_score.toFixed(4)}.${checks.find(c=>c.key===professionalIndemnityKey)?.score_deduction ? ' Professional indemnity cover below £5m deducts 0.25 overall points before applying score caps.' : ''}`,result.assessed_weight<100 ? `Missing component scores are excluded and the ${result.assessed_weight}% assessed component weight is renormalised; missing or failed evidence is not an adverse finding.` : 'All seven components contribute at their configured weights.',result.caps.length ? `Verified score safeguards: ${result.caps.map(c=>`${c.event} caps ASE at ${c.cap}: ${c.reason}`).join('; ')}.` : 'No verified severe-event cap applied.',`Final ASE: ${result.final_score===null ? 'Not assessed, below the configured reliable evidence threshold' : result.final_score.toFixed(1)+' / 5, '+result.classification}. ${result.confidence} confidence; ${result.coverage.toFixed(1)}% reliability-adjusted weighted evidence coverage. Optional personal insolvency is excluded from eligibility, not from the coverage disclosure.`,...limits].join(' ').slice(0,10000);
}