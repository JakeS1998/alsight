import {prepareAssessment} from './aseAssessmentPreview.ts';
import {finishASEPublication} from './asePublication.ts';
export {currentASESourceQuery} from './aseEvidenceSelection.ts';
export async function createAssessment(base44, account, policy, review, publisher) {
  const {model,sourceEvidence,previous,result,preparedAt}=await prepareAssessment(base44,account,policy,review);
  const {components,...summary} = result;
  const assessment = await base44.entities.ASEAssessment.create({...summary,account_id:account.id,organisation_type:account.organisation_type || account.company_type,model,assessment_date:new Date().toISOString(),previous_rating:previous?.displayed_rating ?? null,previous_assessment_id:previous?.id || '',change:summary.displayed_rating!==null && previous?.displayed_rating!=null ? summary.displayed_rating-previous.displayed_rating : null,policy_version:policy.version,policy_snapshot:policy.models,status:'building',is_demo:account.name.startsWith('ASE Demo'),...(publisher ? {published_by_id:publisher.id,published_by_name:publisher.full_name || publisher.id,reviewed_at:preparedAt,publication_note:review?.note?.trim() || '',snapshot_evidence_count:sourceEvidence.length,selected_evidence_count:new Set(components.flatMap(component=>component.evidence_ids)).size} : {})});
  return finishASEPublication(base44,assessment,sourceEvidence,components);
}
export function validateEvidence(input, rules) {
  const rule=rules.find(r=>r.key===input.component);
  if (!rule) throw new Error('Choose a component in this organisation model.');
  for (const [key,max] of [['source',200],['title',200],['value',200],['source_reference',1000]]) if (typeof input[key]!=='string' || !input[key].trim() || input[key].length>max) throw new Error(`Valid ${key.replaceAll('_',' ')} is required.`);
  if (rule.choices ? !rule.choices.some(c=>c.value===input.value) : !/^-?(?:\d+\.?\d*|\.\d+)$/.test(input.value)) throw new Error('Enter a valid metric or verified event classification.');
  for (const field of ['reporting_period','source_date']) if (!/^\d{4}-\d{2}-\d{2}$/.test(input[field] || '') || !Number.isFinite(Date.parse(input[field])) || Date.parse(input[field])>Date.now()) throw new Error('Provide valid, non-future source and reporting dates.');
  if (!['none','minor','moderate','material','serious'].includes(input.severity) || !['High','Medium','Low'].includes(input.confidence)) throw new Error('Choose severity and evidence confidence.');
  if (input.previous_value && (typeof input.previous_value!=='string' || input.previous_value.length>200)) throw new Error('Invalid previous value.');
  if (input.notes && (typeof input.notes!=='string' || input.notes.length>1000)) throw new Error('Notes are limited to 1,000 characters.');
  if (['liquidity','borrowing'].includes(rule.key) && Number(input.value)<0) throw new Error('This ratio cannot be negative. Leave undefined or invalid ratios missing.');
  if (rule.choices && Number(input.value)<=2 && !['material','serious'].includes(input.severity)) throw new Error('A serious or material event classification must be flagged with material or serious severity.');
  if (input.period_months!=null && (!Number.isInteger(input.period_months) || input.period_months<1 || input.period_months>24)) throw new Error('Period length must be 1–24 months.');
  return {component:input.component,source:input.source.trim(),title:input.title.trim(),value:input.value,previous_value:input.previous_value || '',source_reference:input.source_reference.trim(),notes:input.notes || '',reporting_period:input.reporting_period,source_date:input.source_date,severity:input.severity,confidence:input.confidence,period_months:input.period_months || 12,currency:'GBP',evidence_type:rule.type,retrieval_date:new Date().toISOString(),assessment_id:null};
}