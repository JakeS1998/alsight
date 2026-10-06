import { sourceJson,makeSourceFact } from './aseSourceCommon.ts';
import { councilReturn } from './aseCouncilOds.ts';
import { retrieveCouncilBudget } from './aseCouncilBudget.ts';
import { retrieveCouncilContext } from './aseCouncilContext.ts';
import {councilAutomaticMetrics} from './aseCouncilAutomaticMetrics.ts';
import {councilSupportEvidence} from './aseCouncilSupport.ts';
export async function retrieveLocalAuthority(account,code,refresh) {
  const collection=await sourceJson('https://www.gov.uk/api/content/government/collections/local-authority-revenue-expenditure-and-financing');
  const documents=(collection.links?.documents || []).filter(doc=>/individual.*outturn/i.test(doc.title) && !doc.withdrawn && (!doc.public_updated_at || Date.parse(doc.public_updated_at)<=Date.now())).sort((a,b)=>{const year=doc=>Number(doc.title.match(/England: (\d{4})/)?.[1] || 0);return year(b)-year(a);}).slice(0,3);
  const facts=[],warnings=[],returns=[];let officialName='';
  for(const document of documents) {
    try {
      if(!document.base_path?.startsWith('/government/statistics/')) throw new Error('Unexpected GOV.UK publication path.');
      const page=await sourceJson('https://www.gov.uk/api/content'+document.base_path);
      const attachment=page.details?.attachments?.find(item=>/summary \(RS\)/i.test(item.title) && /\.ods$/i.test(item.url || ''));
      if(!attachment) throw new Error('No RS ODS return attached.');
      const parsed=await councilReturn(attachment.url,code),year=Number(document.title.match(/England: (\d{4})/)?.[1]);
      if(!year) throw new Error('Financial year was not identified.');
      officialName=parsed.name;returns.push({...parsed,financial_year:year,source_url:attachment.url,source_date:String(page.public_updated_at || refresh.refreshed_at).slice(0,10)});
      for(const [index,metric] of parsed.facts.entries()) facts.push(makeSourceFact(account,'local_authority',code,refresh,`return-${year}-${index}`,{component:'council_financial_return',title:metric.header,value:`GBP ${Math.round(metric.value*1000)}`,evidence_type:'financial',currency:'GBP',period_months:12,reporting_period:`${year+1}-03-31`,source_date:String(page.public_updated_at || refresh.refreshed_at).slice(0,10),source_reference:attachment.url,confidence:parsed.certification==='Y' ? 'High' : 'Medium',notes:`ONS ${code}; ${parsed.name}; ${parsed.sheet}. Original value ${metric.value} in GBP thousands, converted ×1000. Certification: ${parsed.certification || 'not stated'}. Raw return, not a normalised ASE ratio. Verify usable General Fund reserves and exclusions before scoring; totals may include restricted balances.`}));
    } catch(error) {warnings.push(`${document.title}: ${error.message}`);}
  }
  if(!returns.length) throw new Error('No financial return matched this ONS authority code. '+warnings.join(' ').slice(0,500));
    const budget=await retrieveCouncilBudget(account,code,refresh,collection,officialName);
  const context=await retrieveCouncilContext(account,code,refresh,officialName);
  const {support,documentsFound}=context;
  facts.push(...budget.facts,...context.facts);
  warnings.push(...budget.warnings,...context.warnings);
  const normalised=councilAutomaticMetrics(account,code,refresh,returns,budget.returns,officialName);
  warnings.push(...normalised.warnings,'Exact ONS identity and unambiguous definitions remain required. Published completed-year uncertified metrics and explicit current-year support agreed in principle can score with Low confidence. Generic reserves, ambiguous support lists, audit guidance and search results stay context. No absence is inferred.');
  const supportFacts=councilSupportEvidence(account,code,refresh,support,officialName);
  const combined=[...normalised.facts,...supportFacts,...facts];if(combined.length>40) warnings.push('Context records limited to 40; complete parsed returns remain in the private source snapshot.');
  return {facts:combined.slice(0,40),raw:{code,returns,budget_returns:budget.returns,support,governance_candidates:documentsFound},summary:{authority_code:code,authority_name:officialName,financial_years:returns.map(row=>row.financial_year),budget_years:[...new Set(budget.returns.map(row=>row.financial_year))],support_registers:support.length,governance_candidates:documentsFound.length},warnings};
}