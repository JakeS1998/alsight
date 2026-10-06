import {automaticRuleVersion} from './aseAutomaticEvidence.ts';
export function eligibilityReport(rows,previous=[],hadPrevious=false) {
  const eligible=rows.filter(row=>row.automatic_eligible),old=new Map(previous.map(row=>[row.external_key,row]));
  const newlyEligible=hadPrevious ? eligible.filter(row=>!old.get(row.external_key)?.automatic_eligible) : [];
  const groups=new Map();
  for(const row of rows.filter(row=>!row.automatic_eligible)) {const reason=row.automatic_reason || 'No reproducible scoring rule.';groups.set(reason,(groups.get(reason) || 0)+1);}
  return {rule_version:automaticRuleVersion,eligible_count:eligible.length,excluded_count:rows.length-eligible.length,low_confidence_count:eligible.filter(row=>row.confidence==='Low').length,compared_with_previous:hadPrevious,newly_eligible_count:newlyEligible.length,newly_eligible:newlyEligible.map(row=>({title:row.title,component:row.component,value:row.value,confidence:row.confidence,reason:row.automatic_reason,source_reference:row.source_reference})),exclusions:[...groups].map(([reason,count])=>({reason,count}))};
}