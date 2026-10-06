import {makeSourceFact} from './aseSourceCommon.ts';
const unique=(row,pattern)=>{const matches=(row.facts || []).filter(f=>pattern.test(f.header.trim()) && Number.isFinite(f.value));return matches.length===1 ? matches[0].value : null;};
export function councilAutomaticMetrics(account,code,refresh,returns,budgets,officialName,now=new Date()) {
  const facts=[],warnings=[];
  if(!/^E\d{8}$/.test(code) || account.local_authority_code!==code) return {facts,warnings:['The saved ONS authority code must match the financial return; council display names need not match.']};
  const completed=returns.filter(row=>row.code===code && Number.isInteger(row.financial_year) && row.financial_year>=2000 && Date.parse(`${row.financial_year+1}-03-31`)<=now.getTime() && (row.certification==='Y' || ['N','',null,undefined].includes(row.certification) && /^RS_LA_Data/i.test(row.sheet || '') && /^https:\/\/assets\.publishing\.service\.gov\.uk\/media\/[^?#]+\.ods$/i.test(row.source_url || '') && Number.isFinite(Date.parse(row.source_date)) && Date.parse(row.source_date)<=now.getTime()));
  const metrics=completed.map(row=>({row,nre:unique(row,/^(?:Revenue Expenditure Financing\s*-\s*)?(?:total )?net revenue expenditure$/i),reserves:unique(row,/^(?:total )?(?:usable general fund reserves|general fund usable reserves)$/i),financing:unique(row,/^(?:total )?capital financing(?: costs)?$/i)}));
  const add=(entry,component,value,note)=>facts.push(makeSourceFact(account,'local_authority',code,refresh,`auto-${component}-${entry.row.financial_year}`,{component,title:`${entry.row.certification==='Y' ? 'Certified' : 'Uncertified published'} council ${component.replaceAll('_',' ')} · ${entry.row.financial_year}`,value:String(value),source_reference:entry.row.source_url,reporting_period:`${entry.row.financial_year+1}-03-31`,source_date:entry.row.source_date || refresh.refreshed_at.slice(0,10),evidence_type:'financial',currency:'GBP',period_months:12,confidence:entry.lowConfidence || entry.row.certification!=='Y' ? 'Low' : 'High',automatic_eligible:true,notes:note+(entry.lowConfidence || entry.row.certification!=='Y' ? ' Low confidence: one or more published completed-year inputs are uncertified. Values are reported observations, not independently verified or forecast substitutions.' : '')}));
  for(const entry of metrics) {
    if(!(entry.nre>0)) continue;
    if(entry.reserves!==null && entry.reserves>=0) {
      const ratio=100*entry.reserves/entry.nre;add(entry,'reserves',ratio,'Explicit usable General Fund reserves / net revenue expenditure ×100. HRA, generic earmarked balances and restricted totals are never substituted.');
      const prior=metrics.find(p=>p.row.financial_year===entry.row.financial_year-1 && p.nre>0 && p.reserves!==null && p.reserves>=0);
      if(prior) add({...entry,lowConfidence:entry.row.certification!=='Y' || prior.row.certification!=='Y'},'reserves_trend',ratio-100*prior.reserves/prior.nre,'Comparable completed-year annual change in explicitly usable General Fund reserve ratios, percentage points.');
    }
    if(entry.financing!==null && entry.financing>=0) add(entry,'borrowing',100*entry.financing/entry.nre,'Capital financing costs / net revenue expenditure ×100, from the exact authority outturn row; GBP thousands cancel in the ratio.');
    const matching=budgets.filter(b=>b.code===code && b.financial_year===entry.row.financial_year),budget=matching.length===1 ? unique(matching[0],/^(?:total )?net revenue expenditure$/i) : null;
    if(budget>0) add(entry,'budget',100*(entry.nre-budget)/budget,'Completed annual net revenue outturn minus the same authority/year net revenue budget, divided by that budget ×100. Forecast-only periods are excluded.');
  }
  if(!facts.some(row=>row.component==='reserves')) warnings.push('No unambiguous explicitly usable General Fund reserves definition was available in a completed-year return; generic, unallocated or restricted balances are not substituted.');
  if(!facts.some(row=>row.component==='budget')) warnings.push('No unambiguous same-year completed outturn/budget pair was available; forecasts are not scored.');
  return {facts,warnings};
}