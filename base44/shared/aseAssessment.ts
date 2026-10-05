import { accountModel, calculate } from './asePolicy.ts';
export async function createAssessment(base44, account, policy) {
  const model = accountModel(account);
  if (!model) throw new Error('Set organisation type to UK Limited Company, UK PLC or English Local Authority before assessing.');
  const sourcePage = await base44.entities.ASEEvidence.filter({account_id:account.id,assessment_id:null},{limit:100});
  if (sourcePage.has_more) throw new Error('More than 100 source records: narrow the evidence set before assessing.');
  const previousPage = await base44.entities.ASEAssessment.filter({account_id:account.id,status:'published'},{sort:'-assessment_date',limit:1});
  const previous = previousPage.items[0];
  const result = calculate(policy.models,model,sourcePage.items);
  const {components,...summary} = result;
  const assessment = await base44.entities.ASEAssessment.create({...summary,account_id:account.id,organisation_type:account.organisation_type || account.company_type,model,assessment_date:new Date().toISOString(),previous_rating:previous?.displayed_rating ?? null,previous_assessment_id:previous?.id || '',change:summary.displayed_rating!==null && previous?.displayed_rating!=null ? summary.displayed_rating-previous.displayed_rating : null,policy_version:policy.version,policy_snapshot:policy.models,status:'building',is_demo:account.name.startsWith('ASE Demo')});
  const snapshots = sourcePage.items.length ? await base44.entities.ASEEvidence.bulkCreate(sourcePage.items.map(row=>{const {id,created_date,updated_date,created_by_id,...data}=row;return {...data,assessment_id:assessment.id};})) : [];
  const snapshotIds = new Map(sourcePage.items.map((row,i)=>[row.id,snapshots[i]?.id]));
  await base44.entities.ASEComponentScore.bulkCreate(components.map(({latest,...component})=>({...component,sealed:true,evidence_ids:component.evidence_ids.map(id=>snapshotIds.get(id)).filter(Boolean),account_id:account.id,assessment_id:assessment.id})));
  const published = await base44.entities.ASEAssessment.update(assessment.id,{status:'published'});
  await base44.entities.ASECurrentRating.upsert([{account_id:account.id,assessment_id:assessment.id,precise_score:assessment.precise_score,displayed_rating:assessment.displayed_rating,rating_label:assessment.rating_label,previous_rating:assessment.previous_rating,change:assessment.change,data_confidence:assessment.data_confidence,assessment_date:assessment.assessment_date,explanation:assessment.explanation,is_demo:assessment.is_demo}],{key:'account_id'});
  return published;
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