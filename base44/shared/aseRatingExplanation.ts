const number=value=>new Intl.NumberFormat('en-GB',{maximumFractionDigits:2}).format(value);
export const confidenceRating=record=>record ? {...record,rating_label:record.rating_label?.replace(/^Provisional(?:\s*[·:–-]\s*|\s+)/i,'')} : record;
export function ratingExplanation(components,rules,precise,rating,evidence=[]) {
  const used=components.filter(c=>c.score!=null && c.weighting>0);
  if(!used.length) return 'No scored evidence has been analysed in this assessment yet.';
  const byId=new Map(evidence.map(row=>[row.id,row]));
  const descriptions=used.map(component=>{
    const rule=rules.find(r=>r.key===component.component),row=component.latest || component.evidence_ids?.map(id=>byId.get(id)).find(Boolean);
    const value=row?.value ?? component.metric_value;
    const classification=rule?.choices?.find(choice=>choice.value===value)?.label;
    const metric=classification || (value!=='' && value!=null ? `${Number.isFinite(Number(value)) ? number(Number(value)) : value}${rule?.unit ? ' '+rule.unit : ''}` : 'recorded evidence');
    const period=row?.reporting_period ? `, dated ${row.reporting_period}` : '';
    const source=row?.source ? `, from ${row.source}` : '';
    return `${component.component_label}: ${metric}${period}${source} (${component.score}/5; ${number(component.weighting)}% weight)`;
  });
  return `Analysed ${used.length} component${used.length===1 ? '' : 's'}: ${descriptions.join('; ')}. These results give a weighted score of ${precise.toFixed(3)}/5, rounded to ${rating}/5.`;
}
export async function publishedRatingExplanation(base44,current) {
  current=confidenceRating(current);
  if(!current?.assessment_id) return current;
  const [assessment,components,evidence]=await Promise.all([
    base44.entities.ASEAssessment.get(current.assessment_id),
    base44.entities.ASEComponentScore.filter({assessment_id:current.assessment_id},{limit:10}),
    base44.entities.ASEEvidence.filter({assessment_id:current.assessment_id},{limit:100,fields:['component','value','reporting_period','source']})
  ]);
  if(!assessment || assessment.account_id!==current.account_id || assessment.status!=='published') return current;
  return {...current,explanation:ratingExplanation(components.items,assessment.policy_snapshot?.[assessment.model] || [],assessment.precise_score,assessment.displayed_rating,evidence.items)};
}