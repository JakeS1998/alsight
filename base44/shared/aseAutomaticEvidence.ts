import {councilAutomaticMetrics} from './aseCouncilAutomaticMetrics.ts';
import {councilSupportEvidence} from './aseCouncilSupport.ts';
export const automaticRuleVersion='automatic-v3-broader-official-evidence';
const age=(value,now)=> (now.getTime()-Date.parse(value))/86400000;
const numeric=value=>typeof value==='string' && /^-?(?:\d+\.?\d*|\.\d+)$/.test(value) && Number.isFinite(Number(value));
export function automaticEvidence(source,account,result,now=new Date()) {
  const raw=result.raw || {},exactCompany=source==='accounts' && raw.company_number===account.company_number;
  return result.facts.map(row=>{
    let eligible=false,reason='Context only: no sufficiently precise, identity-matched automated scoring rule.',confidence=row.confidence;
    const freshPeriod=Number.isFinite(age(row.reporting_period,now)) && age(row.reporting_period,now)>=0 && age(row.reporting_period,now)<=913;
    const freshDate=Number.isFinite(age(row.source_date,now)) && age(row.source_date,now)>=0;
    if(!freshPeriod || !freshDate) reason='Missing, future or stale evidence date; excluded from automatic scoring.';
    else if(source==='accounts' && exactCompany && ['financial_strength','liquidity','debt','financial_trend'].includes(row.component) && numeric(row.value)) {
      const period=raw.periods?.find(p=>p.end===row.reporting_period),m=period?.metrics || {};
      const get=key=>m[key]?.value,finite=key=>Number.isFinite(get(key)),assets=finite('assets') ? get('assets') : finite('current_assets') && finite('fixed_assets') ? get('current_assets')+get('fixed_assets') : null;
      let expected=null;
      if(row.component==='financial_strength' && assets>0 && finite('net_assets')) expected=100*get('net_assets')/assets;
      if(row.component==='liquidity' && finite('current_assets') && get('current_assets')>=0 && finite('current_liabilities') && get('current_liabilities')>0) expected=get('current_assets')/get('current_liabilities');
      if(row.component==='debt' && assets>0 && finite('borrowings') && get('borrowings')>=0 && finite('cash') && get('cash')>=0 && /(?:^|:)TotalBorrowings$/.test(m.borrowings?.concept || '')) expected=100*(get('borrowings')-get('cash'))/assets;
      if(row.component==='financial_trend' && m.revenue?.annual===true && row.period_months===12) {const prior=raw.periods?.find(p=>Number(p.end.slice(0,4))===Number(period.end.slice(0,4))-1 && p.end.slice(5)===period.end.slice(5));if(prior?.metrics.revenue?.annual && prior.metrics.revenue.value>0 && numeric(row.previous_value) && Number(row.previous_value)===prior.metrics.revenue.value) expected=100*(get('revenue')/prior.metrics.revenue.value-1);}
      const pdf=period?.origin==='pdf' && row.confidence==='Low' && row.notes?.startsWith('ALICE PDF extraction:');
      eligible=expected!==null && Number.isFinite(expected) && Math.abs(Number(row.value)-expected)<=1e-6 && (row.confidence==='High' || pdf || period?.origin!=='pdf' && ['Medium','Low'].includes(row.confidence)) && row.currency==='GBP' && Date.parse(row.source_date)>=Date.parse(row.reporting_period);
      if(eligible && row.confidence!=='High') confidence='Low';
      reason=eligible ? pdf ? 'Low confidence: ALICE extracted company-only GBP figures with PDF page citations; arithmetic and dates checked, transcription not independently verified.' : confidence==='Low' ? 'Low confidence: exact-company GBP account inputs support the deterministic ratio, but extraction confidence is below High; no accounting definition is relaxed.' : 'Automatically validated from exact-company, non-dimensional GBP tagged accounts using deterministic financial definitions.' : 'Accounting definitions or comparable annual periods are insufficient; no metric inferred.';
    } else if(source==='local_authority' && row.automatic_eligible===true && raw.code===account.local_authority_code && numeric(row.value)) {
      const refresh={id:row.source_refresh_id,refreshed_at:row.retrieval_date},officialName=raw.returns?.find(r=>r.code===raw.code)?.name;
      const candidates=[...councilAutomaticMetrics(account,raw.code,refresh,raw.returns || [],raw.budget_returns || [],officialName,now).facts,...councilSupportEvidence(account,raw.code,refresh,raw.support || [],officialName,now)];
      const candidate=candidates.find(c=>c.component===row.component && c.reporting_period===row.reporting_period && c.source_reference===row.source_reference && c.source_date===row.source_date && Math.abs(Number(c.value)-Number(row.value))<=1e-6);
      eligible=!!candidate;
      if(candidate) confidence=candidate.confidence;
      reason=candidate ? candidate.component==='efs' ? candidate.notes : confidence==='Low' ? 'Low confidence: exact ONS authority and explicit completed-year financial definitions; published inputs are uncertified. Arithmetic checked, figures not independently verified.' : 'Exact ONS authority and certified, explicitly defined financial return; deterministic ratio.' : 'No matching reproducible official-source component with valid identity, period, provenance and definitions.';
    } else if(source==='council_governance' && row.automatic_eligible===true && raw.authority_code===account.local_authority_code && row.governance_review?.primary_document_checked && row.governance_review?.identity_confirmed && row.component==='intervention' && row.value==='2') {
      eligible=row.governance_review.document_status==='current' && age(row.governance_review.operative_from,now)>=0 && Date.parse(row.governance_review.operative_to)>now.getTime();
      reason=eligible ? 'Exact authority in current official register and primary statutory directions with verified operative dates.' : 'Operative status is uncertain; no event inferred.';
    }
    if(source==='gazette') {
      const feed=raw.feed || {},entry=feed.entry,total=feed['f:total'];
      const clean=freshPeriod && freshDate && age(row.retrieval_date,now)>=0 && age(row.retrieval_date,now)<=1 && age(row.source_date,now)<=1 && raw.company_number===account.company_number && row.company_number===account.company_number && row.source==='The Gazette' && row.component==='adverse' && row.value==='5' && (typeof total==='string' || typeof total==='number') && total!=='' && Number(total)===0 && (entry==null || Array.isArray(entry) && entry.length===0) && Array.isArray(raw.notices) && raw.notices.length===0;
      eligible=clean;
      reason=clean ? 'Configured ASE rule: successful company-number Gazette search returned zero notices; clean for this check only, not a complete credit or court-register clearance.' : 'Notice matches retained as primary event context; failed, incomplete, stale or non-empty searches do not qualify as a clean record. Current registry insolvency is scored separately.';
    }
    if(source==='blackflag') reason='Secondary extraction and proprietary rating are context only; no automatic ASE conversion.';
    if(['adverse','intervention','efs'].includes(row.component) && row.value==='5' && !(source==='gazette' && eligible)) {eligible=false;reason='No-result or absence classifications are not automatically scored except a successful empty Gazette search under the configured rule.';}
    return {...row,confidence,score_eligible:eligible,automatic_eligible:eligible,automatic_reason:reason,automatic_rule_version:automaticRuleVersion};
  });
}
export function automaticRegistryFacts(rows,audit,account) {
  const valid=audit.company_number===account.company_number && ['completed','partial'].includes(audit.status) && Date.now()-Date.parse(audit.refreshed_at)<=86400000;
  return rows.map(row=>{const eligible=valid && row.score_eligible===true && ['compliance','adverse'].includes(row.component) && ['1','2','3','4'].includes(row.value);return {...row,score_eligible:eligible,automatic_eligible:eligible,automatic_rule_version:automaticRuleVersion,automatic_reason:eligible ? 'Current exact-company registry fact, explicitly classified by statutory filing or active insolvency rule.' : 'Registry context only; no absent event or historic timeliness inferred.'};});
}