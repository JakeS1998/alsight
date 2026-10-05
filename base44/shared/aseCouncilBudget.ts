import { sourceJson,makeSourceFact } from './aseSourceCommon.ts';
import { councilReturn } from './aseCouncilOds.ts';
export async function retrieveCouncilBudget(account,code,refresh,collection,officialName) {
  const facts=[],returns=[],warnings=[];
  const document=(collection.links?.documents || []).filter(doc=>/individual/i.test(doc.title) && /budget/i.test(doc.title) && !doc.withdrawn && (!doc.public_updated_at || Date.parse(doc.public_updated_at)<=Date.now())).sort((a,b)=>b.title.localeCompare(a.title))[0];
  if(!document) return {facts,returns,warnings:['No current individual-authority Revenue Budget publication was found.']};
  try {
    if(!document.base_path?.startsWith('/government/statistics/')) throw new Error('Unexpected budget publication path.');
    const page=await sourceJson('https://www.gov.uk/api/content'+document.base_path),year=Number(document.title.match(/England: (\d{4})/)?.[1]);
    if(!year) throw new Error('Budget financial year was not identified.');
    const attachments=(page.details?.attachments || []).filter(row=>/Revenue Account Budget \(RA\)/i.test(row.title) && /\.ods$/i.test(row.url || '')).slice(0,2);
    if(!attachments.length) throw new Error('No official RA ODS attachment was found.');
    for(const [part,attachment] of attachments.entries()) {
      try {
        const parsed=await councilReturn(attachment.url,code,'budget');
        if(parsed.name!==officialName) warnings.push(`Budget authority name ${parsed.name} differs from the outturn name ${officialName}; confirm identity before review.`);
        returns.push({...parsed,financial_year:year,source_url:attachment.url});
        for(const [index,metric] of parsed.facts.entries()) facts.push(makeSourceFact(account,'local_authority',code,refresh,`budget-${year}-${part}-${index}`,{component:'council_budget_return',title:`Budget: ${metric.header}`,value:`GBP ${Math.round(metric.value*1000)}`,evidence_type:'financial',currency:'GBP',period_months:12,reporting_period:`${year+1}-03-31`,source_date:String(page.public_updated_at || refresh.refreshed_at).slice(0,10),source_reference:attachment.url,notes:`ONS ${code}; ${parsed.name}; financial year ${year}/${year+1}. Estimated budget figure, not actual outturn. Original GBP thousands converted ×1000. Restricted and earmarked balances must not be assumed usable. Future period ends are context only; do not score a forecast as completed annual evidence.`}));
      } catch(error) {warnings.push(`${attachment.title}: ${error.message}`);}
    }
  } catch(error) {warnings.push(`Revenue Budget collection: ${error.message}`);}
  return {facts,returns,warnings};
}