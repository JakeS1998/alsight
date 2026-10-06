import {calculate,defaultModels,scoreEvidence} from './asePolicy.ts';
import {commercialRule,commercialEvidence,withCommercialModel} from './aseCommercialScoring.ts';
import {filedTurnoverPeriod} from './aseFiledTurnover.ts';
export function checkCommercialScoringRules() {
  const at='2026-10-05T12:00:00Z',account={id:'commercial-rule-check',name:'Rule check'},now=new Date(at);
  const data={status:'available',percentage:60,annualised_value:600000,included_count:1,excluded_count:0,estimated:false,turnover:{status:'available',value:1000000,currency:'GBP',period_start:'2025-01-01',period_end:'2025-12-31',annual_verified:true}};
  const row=commercialEvidence(account,data,at),estimated=commercialEvidence(account,{...data,estimated:true},at);
  const base=defaultModels.company.filter(r=>r.key!==commercialRule.key).map((r,i)=>({id:r.key,component:r.key,value:String([30,6,1.5,18,'5','5'][i]),period_months:12,currency:'GBP',confidence:'High',reporting_period:'2025-12-31',source_date:'2026-10-01',retrieval_date:at}));
  const scored=calculate(defaultModels,'company',[...base,row],now),provisional=calculate(defaultModels,'company',[...base,estimated],now),missing=calculate(defaultModels,'company',base,now);
  const legacy={company:defaultModels.company.filter(r=>r.key!==commercialRule.key).map(r=>({...r,weighting:r.weighting/0.9})),english_local_authority:defaultModels.english_local_authority};
  const migrated=withCommercialModel(legacy);
  const period={end:'2025-12-31',origin:'pdf',filed_at:'2026-08-18',source_url:'https://find-and-update.company-information.service.gov.uk/company/02999852/filing-history/example',pdf_file_uri:'private/test.pdf',metrics:{revenue:{value:30036460,concept:'PDF:revenue',start:'2025-01-01',end:'2025-12-31',annual:true,page:12,quote:'TURNOVER 30,036,460',multiplier:1}}};
  const turnover=filedTurnoverPeriod(period,'02999852',now),invalid=changes=>filedTurnoverPeriod({...period,metrics:{revenue:{...period.metrics.revenue,...changes}}},'02999852',now);
  return {
    filedPdfTurnover:turnover.status==='available' && turnover.value===30036460 && turnover.period_end==='2025-12-31' && turnover.annual_verified===false && turnover.confidence==='Low',
    filedPdfTurnoverCitation:invalid({quote:'TURNOVER 999'}).status==='unavailable',
    filedPdfTurnoverDefinition:invalid({quote:'Net assets 30,036,460'}).status==='unavailable',
    filedTurnoverAnnual:invalid({start:'2025-07-01',annual:false}).status==='unavailable',
    filedTurnoverIdentity:filedTurnoverPeriod(period,'00000000',now).status==='unavailable',
    filedTurnoverNoZero:invalid({value:0}).status==='unavailable',
    filedPdfConcentrationLowConfidence:commercialEvidence(account,{...data,turnover},at)?.confidence==='Low',
    filedTaggedTurnover:filedTurnoverPeriod({...period,origin:undefined,metrics:{revenue:{...period.metrics.revenue,concept:'uk-core:TurnoverRevenue'}}},'02999852',now).annual_verified===true,
    concentrationExactBands:[[0,5],[9.999,5],[10,4],[24.999,4],[25,3],[49.999,3],[50,2],[74.999,2],[75,1],[150,1]].every(([value,score])=>scoreEvidence(commercialRule,{value:String(value)})===score),
    concentrationTenPercent:commercialRule.weighting===10 && Math.abs(defaultModels.company.reduce((sum,r)=>sum+r.weighting,0)-100)<1e-6,
    concentrationWeighted:Math.abs(scored.precise_score-3.98)<1e-6 && scored.coverage===100,
    concentrationLowConfidence:estimated.confidence==='Low' && provisional.data_confidence==='Low' && !provisional.rating_label.startsWith('Provisional'),
    concentrationIncomplete:commercialEvidence(account,{...data,status:'incomplete'},at).confidence==='Low',
    concentrationUnconfirmedAnnual:commercialEvidence(account,{...data,turnover:{...data.turnover,annual_verified:false,period_start:null}},at).confidence==='Low',
    concentrationMissingUnscored:commercialEvidence(account,{...data,status:'unavailable',percentage:null},at)===null && missing.coverage===90 && Math.abs(missing.precise_score-4.2)<1e-6,
    concentrationNoZeroInference:commercialEvidence(account,{...data,included_count:0,percentage:0},at)===null,
    concentrationInvalidRejected:commercialEvidence(account,{...data,percentage:Infinity},at)===null && commercialEvidence(account,{...data,turnover:{...data.turnover,value:0}},at)===null,
    concentrationMigration:Math.abs(migrated.company.reduce((sum,r)=>sum+r.weighting,0)-100)<1e-6 && migrated.company.at(-1).weighting===10,
    concentrationMigrationIdempotent:withCommercialModel(migrated)===migrated,
    concentrationCouncilsUnchanged:migrated.english_local_authority===legacy.english_local_authority && !defaultModels.english_local_authority.some(r=>r.key===commercialRule.key)
  };
}