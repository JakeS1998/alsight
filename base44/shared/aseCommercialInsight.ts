import {accountModel} from './asePolicy.ts';
import {commercialTurnover,hmrcStatus} from './aseCommercialTurnover.ts';
import {contractQuery} from './aseCommercialTerms.ts';
export async function commercialInsight(base44,account,options={}) {
  const now=options.at ? new Date(options.at) : new Date(),date=now.toISOString().slice(0,10);
  if(accountModel(account)!=='company') return {status:'not_applicable',reason:'Turnover concentration applies to supported company accounts, not local-authority spending.',checked_at:now.toISOString()};
  const candidateQuery=contractQuery(account);
  const eligible={...candidateQuery,commercial_reviewed:true,commercial_value:{$gt:0},commercial_annual_value:{$gt:0},commercial_reference:{$exists:true,$nin:['',null]},commercial_start:{$lte:date},commercial_end:{$gte:date}};
  const duplicates=await base44.entities.JCT.aggregate({query:eligible,groupBy:'commercial_reference',having:{count:{$gt:1}},limit:100});
  if(duplicates.truncated) return {status:'unavailable',reason:'Duplicate contract references exceed the validation limit.',checked_at:now.toISOString()};
  const duplicateRefs=duplicates.rows.map(row=>row.commercial_reference);
  if(duplicateRefs.length) eligible.commercial_reference={$exists:true,$nin:['',null,...duplicateRefs]};
  const [total,allCount,turnover,contracts,hmrc]=await Promise.all([
    base44.entities.JCT.aggregate({query:eligible,sum:'commercial_annual_value'}),base44.entities.JCT.count(candidateQuery),commercialTurnover(base44,account,now),
    base44.entities.JCT.filter(eligible,{sort:'document_id',limit:20,...(options.cursor ? {cursor:options.cursor} : {}),fields:['document_id','project_id','commercial_value','commercial_start','commercial_end','commercial_annual_value','commercial_reference','commercial_reviewed_at','commercial_reviewed_by']}),hmrcStatus(base44,account)
  ]);
  const included=total.rows[0]?.count || 0,annual=included ? total.rows[0].sum_commercial_annual_value : null,excluded=allCount-included;
  const available=included>0 && turnover.status==='available' && Number.isFinite(annual);
  const warnings=[];
  if(turnover.limitation) warnings.push(turnover.limitation);
  if(excluded) warnings.push(`${excluded} accessible signed contract record(s) excluded: unverified terms, outside the current term or duplicate signed-contract reference.`);
  if(duplicateRefs.length) warnings.push('All records sharing a duplicate signed-contract reference are excluded, not double counted.');
  if(contracts.has_more && options.snapshot) warnings.push('This historical context retains the first 20 contract inputs; the aggregate includes all eligible accessible contracts.');
  const supplier=account.account_type==='supplier' || account.relationship_types?.some(type=>['supplier','contractor','consultant'].includes(type));
  if(!supplier) warnings.push('Only contractor-side JCT links count as this company’s income. Client-side project expenditure, unsigned appointments and purchase orders are not treated as verified company income.');
  return {version:'commercial-concentration-v1',status:available ? excluded ? 'incomplete' : 'available' : 'unavailable',percentage:available ? annual/turnover.value*100 : null,annualised_value:annual,included_count:included,excluded_count:excluded,candidate_count:allCount,turnover,hmrc,contracts:contracts.items,...(!options.snapshot ? {has_more:contracts.has_more,next_cursor:contracts.next_cursor} : {}),checked_at:now.toISOString(),warnings,
    reason:available ? 'Indicative current annualised contract value compared with historical annual turnover. Not realised income or a time-matched market-share measure.' : !included ? 'No signed contracts currently have verified company-specific GBP values and usable current terms for this comparison. Signed records may exist, including inactive or archived JCTs; review the recorded project figures below. This is not zero concentration.' : turnover.reason,
    method:'Each verified contract’s GBP value × 365.25 ÷ inclusive term days; aggregate active signed contractor-side contracts once, then divide by the latest company-specific Blackflag-reported GBP turnover × 100. Current contract activity is not aligned to the historical turnover year. Turnover older than 913 days (approximately 30 months) is excluded. Group turnover, estimated project values and unverified PDF transcription are not substituted. Missing evidence never means zero business or low dependence. This insight does not change ASE scores.'};
}