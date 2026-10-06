import {councilSupportEvidence} from './aseCouncilSupport.ts';
import {councilAutomaticMetrics} from './aseCouncilAutomaticMetrics.ts';
import {automaticEvidence} from './aseAutomaticEvidence.ts';
import {calculate,defaultModels} from './asePolicy.ts';
export function checkBroaderEvidenceRules() {
  const now=new Date('2026-10-06T04:30:00Z'),code='E08000032',name='Bradford',account={id:'broader-check',name:'Bradford Council',local_authority_code:code},refresh={id:'broader-refresh',refreshed_at:now.toISOString()};
  const support={code,authority_name:name,exact_match:true,financial_year:2026,source_date:'2026-08-18',url:'https://www.gov.uk/guidance/exceptional-financial-support-for-local-authorities-for-2026-27',value:'£78.0m (support agreed in-principle)'};
  const supportFacts=(entries=[support],a=account,n=name)=>councilSupportEvidence(a,code,refresh,entries,n,now);
  const explicit={code,name,certification:'N',sheet:'RS_LA_Data_202526',source_url:'https://assets.publishing.service.gov.uk/media/example/return.ods',source_date:'2026-08-18',financial_year:2025,facts:[{header:'Revenue Expenditure Financing - NET REVENUE EXPENDITURE',value:100},{header:'Usable General Fund reserves',value:20}]};
  const metrics=(rows=[explicit])=>councilAutomaticMetrics(account,code,refresh,rows,[],name,now).facts;
  const returned=metrics(),facts=[...returned,...supportFacts()],raw={code,returns:[explicit],budget_returns:[],support:[support]};
  const validated=automaticEvidence('local_authority',account,{raw,facts},now),weighted=calculate(defaultModels,'english_local_authority',validated,now);
  const company={id:'company-check',company_number:'01157832'},companyFact={id:'tagged',component:'liquidity',value:'2',confidence:'Medium',currency:'GBP',reporting_period:'2026-03-31',source_date:'2026-08-18',retrieval_date:refresh.refreshed_at};
  const companyRaw={company_number:company.company_number,periods:[{end:companyFact.reporting_period,origin:'tagged',metrics:{current_assets:{value:200},current_liabilities:{value:100}}}]};
  const companyResult=automaticEvidence('accounts',company,{raw:companyRaw,facts:[companyFact]},now)[0];
  return {
    broaderSupportInPrinciple:supportFacts()[0]?.value==='3' && supportFacts()[0]?.confidence==='Low',
    broaderSupportNotFinalOrConsecutive:supportFacts().every(r=>!['1','2'].includes(r.value)),
    broaderSupportWrongCodeExcluded:supportFacts([{...support,code:'E08000033'}]).length===0,
    broaderSupportWrongNameExcluded:supportFacts([{...support,authority_name:'Another council'}]).length===0,
    broaderSupportUnmatchedExcluded:supportFacts([{...support,exact_match:false}]).length===0,
    broaderSupportAbsentExcluded:supportFacts([]).length===0,
    broaderSupportBareAmountExcluded:supportFacts([{...support,value:'£78.0m'}]).length===0,
    broaderSupportAmbiguousAmountsExcluded:supportFacts([{...support,value:'£78.0m (support agreed in-principle); £20m for 2025-26'}]).length===0,
    broaderSupportDuplicateExcluded:supportFacts([support,support]).length===0,
    broaderSupportHistoricExcluded:supportFacts([{...support,financial_year:2025}]).length===0,
    broaderSupportWithdrawnExcluded:supportFacts([{...support,value:support.value+' withdrawn'}]).length===0,
    broaderSupportZeroExcluded:supportFacts([{...support,value:'£0m (support agreed in-principle)'}]).length===0,
    broaderSupportFutureSourceExcluded:supportFacts([{...support,source_date:'2026-10-07'}]).length===0,
    broaderSupportUntrustedURLExcluded:supportFacts([{...support,url:'https://example.com/2026-27'}]).length===0,
    broaderCompletedUncertified:returned.length===1 && returned[0].value==='20' && returned[0].confidence==='Low',
    broaderFutureFinancialExcluded:metrics([{...explicit,financial_year:2026}]).length===0,
    broaderUncertifiedNoProvenanceExcluded:metrics([{...explicit,source_url:'https://example.com/return.ods'}]).length===0,
    broaderGenericReservesExcluded:metrics([{...explicit,facts:[explicit.facts[0],{header:'Estimated unallocated financial reserves level at 31 March',value:20}]}]).length===0,
    broaderAmbiguousFinancialExcluded:metrics([{...explicit,facts:[...explicit.facts,explicit.facts[0]]}]).length===0,
    broaderReproducibleEligibility:validated.length===2 && validated.every(r=>r.automatic_eligible && r.confidence==='Low'),
    broaderTamperedRatioExcluded:!automaticEvidence('local_authority',account,{raw,facts:[{...returned[0],value:'999'}]},now)[0].automatic_eligible,
    broaderWeightedConfidence:Math.abs(weighted.precise_score-125/35)<1e-9 && weighted.data_confidence==='Low' && weighted.displayed_rating===4 && !weighted.rating_label.startsWith('Provisional'),
    broaderNoEvidenceUnscored:calculate(defaultModels,'english_local_authority',[],now).displayed_rating===null,
    broaderCompanyLowerConfidence:companyResult.automatic_eligible && companyResult.confidence==='Low',
    broaderCompanyWrongIdentityExcluded:!automaticEvidence('accounts',company,{raw:{...companyRaw,company_number:'00000000'},facts:[companyFact]},now)[0].automatic_eligible,
    broaderCompanyUnsupportedRatioExcluded:!automaticEvidence('accounts',company,{raw:companyRaw,facts:[{...companyFact,value:'3'}]},now)[0].automatic_eligible
  };
}