import {dependencyScore} from './aseV2Calculation.ts';
import {v2UnavailableCheck} from './aseV2ExternalChecks.ts';
export function scoreAllianceContractExposure(exposure,turnover,configuration,now=new Date()) {
  const check=v2UnavailableCheck('dependency','exposure','Alliance Contract Exposure','ALSight','No usable contract exposure and annual-turnover evidence available.');
  const amount=exposure.annualised_value,age=(now.getTime()-Date.parse(turnover.period_end))/86400000;
  const available=['available','incomplete'].includes(exposure.status) && exposure.included_count>0 && Number.isFinite(amount) && amount>0 && turnover.status==='available' && Number.isFinite(turnover.value) && turnover.value>0 && turnover.currency==='GBP' && Number.isFinite(age) && age>=0;
  const estimated=!!(exposure.proposal_proxy_count || exposure.programme_proxy_count),incomplete=(exposure.excluded_count || 0)>0;
  const dependency={status:available ? 'available' : 'unavailable',scoring_version:'alliance-contract-exposure-v1',exposure_basis:'annualised',exposure:amount ?? null,total_contract_value:exposure.total_contract_value ?? null,included_count:exposure.included_count || 0,excluded_count:exposure.excluded_count || 0,candidate_count:exposure.candidate_count || 0,proposal_proxy_count:exposure.proposal_proxy_count || 0,programme_proxy_count:exposure.programme_proxy_count || 0,estimated,incomplete,turnover,
    method:'Current Alliance Contract Exposure: company-specific GBP contract value × 365.25 ÷ inclusive term days, summed across current executed contractor-side contracts once, divided by annual company turnover × 100. Reviewed terms take priority; usable company-matched Pathway proposals and project programmes are included as estimates. Duplicate references and unusable contracts are excluded. The configured Alliance Dependency curve scores this percentage; estimates, incomplete coverage and stale or unverified turnover reduce confidence, not the numeric score. This is not realised income or time-matched market share.'};
  if(!available) {
    check.state='LIMITED';check.checked_at=now.toISOString();
    check.reason=turnover.status!=='available' ? turnover.reason || 'Annual company turnover is unavailable; missing evidence is not zero dependency.' : exposure.reason || 'Usable positive GBP exposure and annual company turnover are required; missing evidence is not zero dependency.';
    return {dependency,check};
  }
  const percentage=amount/turnover.value*100;
  if(!Number.isFinite(percentage)) return {dependency:{...dependency,status:'unavailable'},check};
  const stale=age>configuration.freshness_days.turnover,score=dependencyScore(percentage,configuration);
  const provisional=estimated || incomplete || stale || turnover.annual_verified===false || turnover.confidence==='Low' || !!turnover.limitation;
  const confidence=provisional ? 'Low' : turnover.input_id ? 'Medium' : 'High';
  Object.assign(dependency,{percentage,score,confidence,turnover_age_days:Math.floor(age),stale,high_dependency:percentage>=configuration.dependency_flag,label:percentage<=10 ? 'Very Low Dependency' : percentage<=20 ? 'Low Dependency' : percentage<=35 ? 'Moderate Dependency' : percentage<=50 ? 'High Dependency' : 'Very High Dependency'});
  Object.assign(check,{state:score>=3.5 ? 'POSITIVE' : 'ADVERSE',score,confidence,quality:configuration.quality[confidence],verified:!estimated && turnover.annual_verified!==false,checked_at:now.toISOString(),source_reference:turnover.source_reference,
    reason:`£${amount.toFixed(2)} annualised Alliance Contract Exposure ÷ £${turnover.value.toFixed(2)} annual turnover × 100 = ${percentage.toFixed(2)}%. Configured Alliance Dependency curve gives ${score.toFixed(2)}/5. ${dependency.included_count} contracts included; ${dependency.excluded_count} excluded. ${estimated ? 'Company-matched Pathway proposal or programme estimates are included, not treated as verified signed income. ' : ''}${provisional ? 'Confidence and evidence coverage are reduced for estimated, incomplete, stale or unverified inputs; the numeric dependency score is unchanged. ' : ''}Concentration risk is not insolvency, financial distress or poor performance.`});
  return {dependency,check};
}