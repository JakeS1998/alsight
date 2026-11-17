import {compassFinancialDetail} from './compassFinancialDetail.ts';
import {compassComponentMeanings,compassCheckMeaning,compassComponentWhy} from './compassDetailCopy.ts';
const scoreHistory=(history,key,kind)=>history.map(a=>({date:a.assessment_date,value:(kind==='check'?a.checks:a.components)?.find(row=>(kind==='check'?row.key:row.key)===key)?.score ?? null})).reverse();
export async function compassDetailPresentation(db,assessment) {
  if(!assessment)return assessment;
  const id=assessment.account_id,ids=[...new Set((assessment.checks || []).filter(c=>c.component==='financial' && c.evidence_id && !c.display_inputs).map(c=>c.evidence_id))];
  const [history,selected]=await Promise.all([db.ASEV2Assessment.filter({account_id:id,assessment_date:{$lte:assessment.assessment_date}},{sort:'-assessment_date',limit:10,fields:['assessment_date','components','checks','dependency','policy_version']}),ids.length?db.ASEEvidence.filter({account_id:id,id:{$in:ids}},{limit:10}):Promise.resolve({items:[]})]);
  const rows=selected.items.filter(row=>(assessment.checks || []).some(c=>c.evidence_id===row.id && c.checked_at===row.retrieval_date && c.evidence_date===row.reporting_period && c.source_reference===row.source_reference));
  const refreshIds=[...new Set(rows.map(row=>row.source_refresh_id).filter(Boolean))];
  const facts=refreshIds.length?await db.ASEEvidence.filter({account_id:id,source_refresh_id:{$in:refreshIds}},{limit:160}):{items:[]};
  const usableFacts=facts.has_more?[]:facts.items;
  const checks=assessment.checks.map(check=>{
    const row=rows.find(row=>row.id===check.evidence_id),financial=check.display_inputs || (row?compassFinancialDetail(check,row,usableFacts.filter(r=>r.source_refresh_id===row.source_refresh_id && r.retrieval_date===check.checked_at),assessment.policy_snapshot):null);
    const presentation={meaning:compassCheckMeaning(check),why:check.score==null?`This check has no usable score. ${check.reason} Missing or unverified evidence is not counted as a negative result.`:check.reason,figures:[],...financial};
    if(check.component==='dependency') {
      const d=assessment.dependency;
      if(d?.status==='available') {presentation.figures=[{label:'Total Alliance contract exposure',value:d.exposure,unit:'GBP'},{label:'Annual company turnover',value:d.turnover.value,unit:'GBP',period:d.turnover.period_end},{label:'Exposure ÷ turnover',value:d.percentage,unit:'percent'},{label:'Contracts included',value:d.included_count,unit:'count'},{label:'Contracts excluded',value:d.excluded_count,unit:'count'}];presentation.chart={title:'Recorded exposure as a share of turnover',unit:'percent',points:history.items.filter(a=>a.dependency?.scoring_version===d.scoring_version && a.dependency?.exposure_basis===d.exposure_basis).map(a=>({date:a.assessment_date,value:a.dependency.percentage ?? null})).reverse()};presentation.why=`Alliance contract exposure is ${d.percentage.toFixed(2)}% of annual company turnover, giving the saved dependency score of ${check.score.toFixed(2)}/5. Contract totals can cover several years; this is not time-matched market share. ${d.estimated || d.incomplete?'Estimated amounts or incomplete coverage reduce confidence.':''}`;}
    }
    if(check.records?.length)presentation.figures.push({label:'Recorded evidence items',value:check.records.length,unit:'count'});
    if(check.component==='financial' && check.score!=null && !financial)presentation.limitation='The original underlying figures are not available in a matching retained snapshot. The saved score and source notes remain below; no replacement figures or financial trend have been invented.';
    presentation.score_history={title:'Recorded check score history',unit:'score',points:scoreHistory(history.items,check.key,'check')};
    return {...check,presentation};
  });
  const components=assessment.components.map(component=>({...component,presentation:{meaning:compassComponentMeanings[component.key],why:compassComponentWhy(component,checks.filter(c=>c.component===component.key)),chart:{title:'Recorded component score history',unit:'score',points:scoreHistory(history.items,component.key,'component')}}}));
  return {...assessment,checks,components};
}