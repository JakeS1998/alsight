export const blackflagFallbackVersion='blackflag-financial-fallback-v1';
export const blackflagFallbackComponents=['financial_strength','liquidity'];
export function freshFallbackDate(value,now,maxDays=913) {
  const days=(now.getTime()-Date.parse(value))/86400000;
  return typeof value==='string' && /^\d{4}-\d{2}-\d{2}(?:T.*)?$/.test(value) && Number.isFinite(days) && days>=0 && days<=maxDays;
}
export function primaryFinancialEvidence(row,account,now) {
  return ['Companies House','Companies House filed accounts'].includes(row.source) && row.account_id===account.id && row.company_number===account.company_number && row.score_eligible===true && blackflagFallbackComponents.includes(row.component) && row.currency==='GBP' && /^-?(?:\d+\.?\d*|\.\d+)$/.test(row.value) && Number.isFinite(Number(row.value)) && freshFallbackDate(row.reporting_period,now) && freshFallbackDate(row.source_date,now) && Date.parse(row.source_date)>=Date.parse(row.reporting_period);
}
export function blackflagFinancialFallback(rows,raw,account,primary,now=new Date()) {
  const financials=Array.isArray(raw?.financials) ? raw.financials : [],exactCompany=raw?.company?.company_number===account.company_number;
  return rows.map(row=>{
    const periodRows=financials.filter(period=>period.period_end_date===row.reporting_period),period=periodRows.length===1 ? periodRows[0] : null;
    const finite=key=>typeof period?.[key]==='number' && Number.isFinite(period[key]);
    const assets=finite('total_current_assets') && finite('total_fixed_assets') && period.total_current_assets>=0 && period.total_fixed_assets>=0 ? period.total_current_assets+period.total_fixed_assets : null;
    let expected=null;
    if(row.component==='financial_strength' && assets>0 && finite('net_assets')) expected=100*period.net_assets/assets;
    if(row.component==='liquidity' && finite('total_current_assets') && period.total_current_assets>=0 && finite('creditors_within_1yr') && period.creditors_within_1yr>0) expected=period.total_current_assets/period.creditors_within_1yr;
    const matched=exactCompany && row.account_id===account.id && row.company_number===account.company_number && row.source==='Blackflag Alert' && row.external_key?.startsWith(`ase-source:${account.id}:blackflag:${account.company_number}:`);
    const current=freshFallbackDate(row.reporting_period,now) && freshFallbackDate(row.retrieval_date,now,1) && freshFallbackDate(row.source_date,now) && Date.parse(row.source_date)>=Date.parse(row.reporting_period);
    const verifiedPrimary=primary.some(item=>item.component===row.component && item.reporting_period===row.reporting_period && primaryFinancialEvidence(item,account,now));
    const eligible=matched && current && !verifiedPrimary && row.evidence_type==='financial' && row.currency==='GBP' && expected!==null && Number.isFinite(expected) && /^-?(?:\d+\.?\d*|\.\d+)$/.test(row.value) && Math.abs(Number(row.value)-expected)<=1e-6;
    const reason=eligible ? 'Blackflag secondary financial fallback: exact company and current reporting period; ratio recalculated from the integrity-checked stored figures. No verified eligible Companies House equivalent for this component and period.' : verifiedPrimary ? 'Verified eligible Companies House figure takes precedence for the same component and reporting period.' : 'Blackflag context only: identity, freshness, financial definition or deterministic calculation is insufficient.';
    return {...row,score_eligible:eligible,automatic_eligible:eligible,automatic_rule_version:blackflagFallbackVersion,automatic_reason:reason,...(eligible ? {confidence:'Medium',notes:reason} : {})};
  });
}