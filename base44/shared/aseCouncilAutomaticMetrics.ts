import {makeSourceFact} from './aseSourceCommon.ts';
const norm=value=>String(value || '').toLowerCase().replace(/[^a-z0-9]/g,'');
const unique=(row,pattern)=>{const matches=(row.facts || []).filter(f=>pattern.test(f.header.trim()) && Number.isFinite(f.value));return matches.length===1 ? matches[0].value : null;};
export function councilAutomaticMetrics(account,code,refresh,returns,budgets,officialName) {
  const facts=[],warnings=[];
  if(norm(account.name)!==norm(officialName)) return {facts,warnings:['Exact Account-to-ONS council name match is missing; financial normalisation remains context.']};
  const certified=returns.filter(row=>row.code===code && row.certification==='Y');
  const metrics=certified.map(row=>({row,nre:unique(row,/^(?:total )?net revenue expenditure$/i),reserves:unique(row,/^(?:total )?(?:usable general fund reserves|general fund usable reserves)$/i),financing:unique(row,/^(?:total )?capital financing(?: costs)?$/i)}));
  const add=(entry,component,value,note)=>facts.push(makeSourceFact(account,'local_authority',code,refresh,`auto-${component}-${entry.row.financial_year}`,{component,title:`Certified council ${component.replaceAll('_',' ')} · ${entry.row.financial_year}`,value:String(value),source_reference:entry.row.source_url,reporting_period:`${entry.row.financial_year+1}-03-31`,source_date:entry.row.source_date || refresh.refreshed_at.slice(0,10),evidence_type:'financial',currency:'GBP',period_months:12,confidence:'High',automatic_eligible:true,notes:note}));
  for(const entry of metrics) {
    if(!(entry.nre>0)) continue;
    if(entry.reserves!==null && entry.reserves>=0) {
      const ratio=100*entry.reserves/entry.nre;add(entry,'reserves',ratio,'Explicit usable General Fund reserves / net revenue expenditure ×100. HRA, generic earmarked balances and restricted totals are never substituted.');
      const prior=metrics.find(p=>p.row.financial_year===entry.row.financial_year-1 && p.nre>0 && p.reserves!==null && p.reserves>=0);
      if(prior) add(entry,'reserves_trend',ratio-100*prior.reserves/prior.nre,'Comparable certified annual change in explicitly usable General Fund reserve ratios, percentage points.');
    }
    if(entry.financing!==null && entry.financing>=0) add(entry,'borrowing',100*entry.financing/entry.nre,'Capital financing costs / net revenue expenditure ×100, from the exact certified authority row; GBP thousands cancel in the ratio.');
    const matching=budgets.filter(b=>b.code===code && b.financial_year===entry.row.financial_year),budget=matching.length===1 ? unique(matching[0],/^(?:total )?net revenue expenditure$/i) : null;
    if(budget>0) add(entry,'budget',100*(entry.nre-budget)/budget,'Completed annual net revenue outturn minus the same authority/year net revenue budget, divided by that budget ×100. Forecast-only periods are excluded.');
  }
  if(!facts.some(row=>row.component==='reserves')) warnings.push('No certified explicitly usable General Fund reserves definition was available; generic reserves are not substituted.');
  if(!facts.some(row=>row.component==='budget')) warnings.push('No unambiguous same-year completed outturn/budget pair was available; forecasts are not scored.');
  return {facts,warnings};
}