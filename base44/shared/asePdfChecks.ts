import {normalisePdfAccounts} from './aseAccountsPdfValidation.ts';
import {accountsEvidence} from './aseAccountsEvidence.ts';
import {automaticEvidence} from './aseAutomaticEvidence.ts';
import {calculate,defaultModels} from './asePolicy.ts';
export function checkPdfAndProvisionalRules() {
  const number='02999852',account={id:'pdf-rule-check',company_number:number},now=new Date('2026-10-05T12:00:00Z');
  const make=(key,value)=>({key,value,multiplier:1000,page:2,quote:`${key} ${value}`});
  const input={company_number:number,currency:'GBP',entity_basis:'company',periods:[{end:'2025-12-31',start:'',metrics:[make('current_assets',200),make('fixed_assets',100),make('net_assets',100),make('current_liabilities',100)]}]};
  const parse=value=>normalisePdfAccounts(value,number,'2026-09-30');
  const periods=parse(input).map(p=>({...p,filed_at:'2026-09-30',source_url:'https://find-and-update.company-information.service.gov.uk/company/02999852/filing-history'}));
  const refresh={id:'pdf-check',refreshed_at:now.toISOString()},facts=accountsEvidence(account,number,refresh,periods),rows=automaticEvidence('accounts',account,{facts,raw:{company_number:number,periods}},now);
  const eligible=rows.filter(row=>row.score_eligible).map((row,i)=>({...row,id:`pdf-${i}`})),result=calculate(defaultModels,'company',eligible,now);
  const lowCoverage=calculate(defaultModels,'company',[{...eligible[0],confidence:'High'}],now);
  const zeroWeights={company:defaultModels.company.map(rule=>({...rule,weighting:0}))};
  return {
    pdfUnitScaling:periods[0]?.metrics.current_assets.value===200000,
    pdfExactIdentity:parse({...input,company_number:'00000000'}).length===0,
    pdfCompanyOnly:parse({...input,entity_basis:'group'}).length===0,
    pdfCurrency:parse({...input,currency:'USD'}).length===0,
    pdfCitations:facts.every(row=>row.notes.includes('p.2')),
    pdfNoUnquotedFigures:parse({...input,periods:[{...input.periods[0],metrics:[{...make('assets',123),quote:'Total assets 999'}]}]}).length===0,
    pdfNoAmbiguousBorrowings:parse({...input,periods:[{...input.periods[0],metrics:[{...make('borrowings',100),quote:'Creditors 100'}]}]}).length===0,
    pdfDeterministicRatios:eligible.length===2 && Math.abs(Number(eligible.find(row=>row.component==='financial_strength')?.value)-100/3)<1e-6 && eligible.find(row=>row.component==='liquidity')?.value==='2',
    pdfLowConfidence:result.displayed_rating===4 && result.rating_label==='Good' && result.data_confidence==='Low',
    limitedEvidenceConfidence:lowCoverage.displayed_rating!=null && lowCoverage.data_confidence==='Low' && !lowCoverage.rating_label.startsWith('Provisional'),
    noEvidenceUnscored:calculate(defaultModels,'company',[],now).displayed_rating===null,
    zeroWeightUnscored:calculate(zeroWeights,'company',eligible,now).displayed_rating===null
  };
}