import {blackflagFinancialFallback} from './aseBlackflagFallbackRules.ts';
export function checkBlackflagFallbackRules() {
  const now=new Date('2026-10-05T12:00:00Z'),account={id:'check-company',company_number:'02999852'},date='2025-12-31';
  const raw={company:{company_number:account.company_number},financials:[{period_end_date:date,total_current_assets:200,total_fixed_assets:50,net_assets:100,creditors_within_1yr:100}]};
  const make=(component,value)=>({id:component,account_id:account.id,company_number:account.company_number,external_key:`ase-source:${account.id}:blackflag:${account.company_number}:${component}`,source:'Blackflag Alert',component,value,currency:'GBP',evidence_type:'financial',reporting_period:date,source_date:'2026-10-05',retrieval_date:'2026-10-05T11:00:00Z'});
  const rows=[make('financial_strength','40.000000'),make('liquidity','2.000000')];
  const select=(data=rows,snapshot=raw,primary=[])=>blackflagFinancialFallback(data,snapshot,account,primary,now);
  const primary={...rows[0],source:'Companies House filed accounts',score_eligible:true};
  return {
    blackflagFallbackFinancials:select().every(row=>row.score_eligible && row.automatic_eligible),
    blackflagPrimaryPrecedence:!select(rows,raw,[primary])[0].score_eligible && select(rows,raw,[primary])[1].score_eligible,
    blackflagDifferentPeriod:select(rows,raw,[{...primary,reporting_period:'2024-12-31'}])[0].score_eligible,
    blackflagUnverifiedPrimary:select(rows,raw,[{...primary,score_eligible:false}])[0].score_eligible,
    blackflagExactCompany:select(rows,{...raw,company:{company_number:'00000000'}}).every(row=>!row.score_eligible),
    blackflagExactEvidenceCompany:select(rows.map(row=>({...row,company_number:'00000000'}))).every(row=>!row.score_eligible),
    blackflagRecalculated:!select([{...rows[0],value:'99'}])[0].score_eligible,
    blackflagFreshRetrieval:select(rows.map(row=>({...row,retrieval_date:'2026-10-01T11:00:00Z'}))).every(row=>!row.score_eligible),
    blackflagStalePeriod:select(rows.map(row=>({...row,reporting_period:'2021-12-31'}))).every(row=>!row.score_eligible),
    blackflagFutureDate:select(rows.map(row=>({...row,source_date:'2026-10-06'}))).every(row=>!row.score_eligible),
    blackflagCurrency:select(rows.map(row=>({...row,currency:'USD'}))).every(row=>!row.score_eligible),
    blackflagNoZeroDenominator:!select(rows,{...raw,financials:[{...raw.financials[0],creditors_within_1yr:0}]})[1].score_eligible,
    blackflagNoAmbiguousPeriod:select(rows,{...raw,financials:[raw.financials[0],raw.financials[0]]}).every(row=>!row.score_eligible),
    blackflagNoOtherComponents:select(['external_risk_score','court_records','adverse','financial_trend','debt'].map(component=>make(component,'5'))).every(row=>!row.score_eligible)
  };
}