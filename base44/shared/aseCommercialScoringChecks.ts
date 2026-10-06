import {calculate,defaultModels,scoreEvidence} from './asePolicy.ts';
import {commercialRule,commercialEvidence,withCommercialModel} from './aseCommercialScoring.ts';
export function checkCommercialScoringRules() {
  const at='2026-10-05T12:00:00Z',account={id:'commercial-rule-check',name:'Rule check'},now=new Date(at);
  const data={status:'available',percentage:60,annualised_value:600000,included_count:1,excluded_count:0,estimated:false,turnover:{status:'available',value:1000000,currency:'GBP',period_start:'2025-01-01',period_end:'2025-12-31',annual_verified:true}};
  const row=commercialEvidence(account,data,at),estimated=commercialEvidence(account,{...data,estimated:true},at);
  const base=defaultModels.company.filter(r=>r.key!==commercialRule.key).map((r,i)=>({id:r.key,component:r.key,value:String([30,6,1.5,18,'5','5'][i]),period_months:12,currency:'GBP',confidence:'High',reporting_period:'2025-12-31',source_date:'2026-10-01',retrieval_date:at}));
  const scored=calculate(defaultModels,'company',[...base,row],now),provisional=calculate(defaultModels,'company',[...base,estimated],now),missing=calculate(defaultModels,'company',base,now);
  const legacy={company:defaultModels.company.filter(r=>r.key!==commercialRule.key).map(r=>({...r,weighting:r.weighting/0.9})),english_local_authority:defaultModels.english_local_authority};
  const migrated=withCommercialModel(legacy);
  return {
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