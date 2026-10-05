import {accountModel,calculate,scoreEvidence} from './asePolicy.ts';
import {currentASESourceQuery} from './aseEvidenceSelection.ts';
import {selectBlackflagFallback} from './aseBlackflagFallback.ts';
import {commercialSnapshot} from './aseCommercialSnapshot.ts';
import {commercialEvidence,commercialRule} from './aseCommercialScoring.ts';
const canonical=value=>Array.isArray(value) ? value.map(canonical) : value && typeof value==='object' ? Object.fromEntries(Object.keys(value).sort().map(key=>[key,canonical(value[key])])) : value;
export async function prepareAssessment(base44,account,policy,review,sourceQuery) {
  const model=accountModel(account);
  if(!model) throw new Error('Set organisation type to UK Limited Company, UK PLC or English Local Authority before assessing.');
  const preparedAt=review?.preparedAt || new Date().toISOString();
  if(review && (typeof review.preparedAt!=='string' || !Number.isFinite(Date.parse(review.preparedAt)) || Date.parse(review.preparedAt)>Date.now() || Date.now()-Date.parse(review.preparedAt)>900000 || !/^[a-f0-9]{64}$/.test(review.previewToken || ''))) throw new Error('This review has expired or is invalid. Generate a fresh assessment preview.');
  const [sourcePage,previousPage]=await Promise.all([base44.entities.ASEEvidence.filter(sourceQuery || currentASESourceQuery(account),{limit:100}),base44.entities.ASEAssessment.filter({account_id:account.id,status:'published'},{sort:'-assessment_date',limit:1})]);
  if(sourcePage.has_more) throw new Error('More than 100 source records: narrow the evidence set before assessing.');
  const collected=model==='company' ? await selectBlackflagFallback(base44,account,sourcePage.items,new Date(preparedAt)) : sourcePage.items,previous=previousPage.items[0] || null;
  const commercial_context=await commercialSnapshot(base44,account,preparedAt);
  const derived=model==='company' ? commercialEvidence(account,commercial_context,preparedAt) : null;
  const sourceEvidence=model==='company' ? [...collected.filter(row=>row.component!==commercialRule.key),...(derived ? [derived] : [])] : collected;
  if(sourceEvidence.length>100) throw new Error('More than 100 source records including financial fallback and commercial evidence: narrow the evidence set before assessing.');
  const content=canonical({commercial_context,preparedAt,account:{id:account.id,name:account.name,organisation_type:account.organisation_type || '',company_type:account.company_type || '',company_number:account.company_number || '',vat_number:account.vat_number || '',local_authority_code:account.local_authority_code || ''},policy,previousId:previous?.id || '',evidence:[...sourceEvidence].sort((a,b)=>a.id.localeCompare(b.id))});
  const bytes=new TextEncoder().encode(JSON.stringify(content)),previewToken=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))).map(byte=>byte.toString(16).padStart(2,'0')).join('');
  if(review && review.previewToken!==previewToken) throw new Error('Evidence, policy or the latest assessment has changed since this review. Generate a fresh preview before publishing.');
  return {model,sourceEvidence,previous,result:{...calculate(policy.models,model,sourceEvidence,new Date(preparedAt)),commercial_context},preparedAt,previewToken};
}
export function assessmentPreview(prepared,policy) {
  const {model,result,previous,sourceEvidence,preparedAt,previewToken}=prepared;
  const {components,...summary}=result,usedIds=new Set(components.flatMap(component=>component.evidence_ids));
  const selectedEvidence=sourceEvidence.filter(row=>usedIds.has(row.id));
  const notSelectedEvidence=sourceEvidence.filter(row=>!usedIds.has(row.id)).map(row=>{
    const rule=policy.models[model].find(item=>item.key===row.component);
    return {...row,selection_reason:row.score_eligible===false ? 'Context or unapproved evidence, excluded from scoring.' : !rule || scoreEvidence(rule,row)===null ? 'No usable metric for this model component.' : 'Not selected: a newer period, newer metric or more adverse verified classification takes precedence.'};
  });
  return {preparedAt,previewToken,summary:{...summary,policy_version:policy.version,previous_rating:previous?.displayed_rating ?? null,change:summary.displayed_rating!==null && previous?.displayed_rating!=null ? summary.displayed_rating-previous.displayed_rating : null},components:components.map(({latest,...component})=>({...component,id:component.component})),selectedEvidence,notSelectedEvidence,sourceCount:sourceEvidence.length,selectedCount:selectedEvidence.length,notSelectedCount:notSelectedEvidence.length,missingComponents:components.filter(row=>row.score===null).map(row=>row.component_label)};
}