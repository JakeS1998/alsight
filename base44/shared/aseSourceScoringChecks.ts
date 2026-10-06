import {automaticEvidence} from './aseAutomaticEvidence.ts';
import {councilAutomaticMetrics} from './aseCouncilAutomaticMetrics.ts';
import {calculate,defaultModels} from './asePolicy.ts';
export function checkASESourceScoringRules() {
 const now=new Date('2026-10-06T04:30:00Z'),number='01157832',account={id:'source-check',name:'Different display name',company_number:number};
 const row={id:'clean',source:'The Gazette',company_number:number,component:'adverse',value:'5',confidence:'Medium',reporting_period:'2026-10-06',source_date:'2026-10-06',retrieval_date:'2026-10-06T04:00:00Z'};
 const raw={company_number:number,feed:{'f:total':'0',entry:[]},notices:[]};
 const check=(data=raw,fact=row,company=account)=>automaticEvidence('gazette',company,{raw:data,facts:[fact]},now)[0];
 const clean=check(),rating=calculate(defaultModels,'company',[clean],now);
 const code='E08000032',council={id:'council-check',name:'Bradford Council',local_authority_code:code},refresh={id:'refresh',refreshed_at:now.toISOString()};
 const returns=[{code,name:'City of Bradford Metropolitan District Council',certification:'Y',financial_year:2024,source_url:'https://www.gov.uk/financial-return',facts:[{header:'Net revenue expenditure',value:100},{header:'Usable General Fund reserves',value:20},{header:'Capital financing costs',value:5}]}];
 const facts=councilAutomaticMetrics(council,code,refresh,returns,[]).facts;
 const councilRows=automaticEvidence('local_authority',council,{raw:{code,returns,budget_returns:[]},facts},now);
 const registryInsolvency={...row,id:'registry',source:'Companies House',value:'1',score_eligible:true,confidence:'High'};
 return {
  gazetteEmptyClean:clean.score_eligible && clean.automatic_eligible,
  gazetteCleanLowConfidence:rating.displayed_rating===5 && rating.rating_label==='Strong' && rating.data_confidence==='Low',
  gazetteNonEmptyUnknown:!check({...raw,feed:{'f:total':'1',entry:[]}}).score_eligible,
  gazetteMissingTotalUnknown:!check({...raw,feed:{}}).score_eligible,
  gazetteNullTotalUnknown:!check({...raw,feed:{'f:total':null}}).score_eligible,
  gazetteInconsistentEntriesUnknown:!check({...raw,feed:{'f:total':'0',entry:[{id:'notice'}]}}).score_eligible,
  gazetteDifferentCompanyUnknown:!check({...raw,company_number:'00000000'}).score_eligible,
  gazetteDifferentEvidenceCompanyUnknown:!check(raw,{...row,company_number:'00000000'}).score_eligible,
  gazetteStaleSearchUnknown:!check(raw,{...row,source_date:'2026-09-01',retrieval_date:'2026-09-01T04:00:00Z'}).score_eligible,
  gazetteFutureSearchUnknown:!check(raw,{...row,retrieval_date:'2026-10-07T04:00:00Z'}).score_eligible,
  gazetteConfirmedInsolvencyWins:calculate(defaultModels,'company',[clean,registryInsolvency],now).displayed_rating===1,
  councilDifferentNameScores:facts.length===2 && councilRows.every(fact=>fact.automatic_eligible),
  councilWrongSavedCodeExcluded:councilAutomaticMetrics({...council,local_authority_code:'E08000033'},code,refresh,returns,[]).facts.length===0,
  councilWrongReturnCodeExcluded:councilAutomaticMetrics(council,code,refresh,returns.map(r=>({...r,code:'E08000033'})),[]).facts.length===0,
  councilUncertifiedWithoutProvenanceExcluded:councilAutomaticMetrics(council,code,refresh,returns.map(r=>({...r,certification:'N'})),[]).facts.length===0,
  councilNoEmptySearchClearance:!automaticEvidence('council_governance',council,{raw:{authority_code:code},facts:[{...row,component:'intervention'}]},now)[0].score_eligible
 };
}