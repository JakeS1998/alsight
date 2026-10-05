import { sourceJson,sourceText,makeSourceFact } from './aseSourceCommon.ts';
import { councilReturn } from './aseCouncilOds.ts';
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
      officialName=parsed.name;returns.push({...parsed,financial_year:year,source_url:attachment.url});
      for(const [index,metric] of parsed.facts.entries()) facts.push(makeSourceFact(account,'local_authority',code,refresh,`return-${year}-${index}`,{component:'council_financial_return',title:metric.header,value:`GBP ${Math.round(metric.value*1000)}`,evidence_type:'financial',currency:'GBP',period_months:12,reporting_period:`${year+1}-03-31`,source_date:String(page.public_updated_at || refresh.refreshed_at).slice(0,10),source_reference:attachment.url,confidence:parsed.certification==='Y' ? 'High' : 'Medium',notes:`ONS ${code}; ${parsed.name}; ${parsed.sheet}. Original value ${metric.value} in GBP thousands, converted ×1000. Certification: ${parsed.certification || 'not stated'}. Raw return, not a normalised ASE ratio. Verify usable General Fund reserves and exclusions before scoring; totals may include restricted balances.`}));
    } catch(error) {warnings.push(`${document.title}: ${error.message}`);}
  }
  if(!returns.length) throw new Error('No financial return matched this ONS authority code. '+warnings.join(' ').slice(0,500));
  const norm=name=>String(name || '').toLowerCase().replace(/[^a-z0-9]/g,'');
  if(!norm(account.name).includes(norm(officialName))) warnings.push(`This ONS code resolves to ${officialName}; verify that this is the intended Account before approving evidence.`);
  const supportCollection=await sourceJson('https://www.gov.uk/api/content/government/collections/exceptional-financial-support-for-local-authorities');
  const supportDocs=(supportCollection.links?.documents || []).filter(doc=>/\/guidance\/exceptional-financial-support-for-local-authorities-for-\d{4}-\d{2}$/.test(doc.base_path || '') && (!doc.public_updated_at || Date.parse(doc.public_updated_at)<=Date.now())).sort((a,b)=>b.base_path.localeCompare(a.base_path)).slice(0,2);
  const support=[];
  for(const document of supportDocs) {
    const page=await sourceJson('https://www.gov.uk/api/content'+document.base_path),body=String(page.details?.body || '');
    const row=[...body.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)].map(match=>[...match[1].matchAll(/<t[dh]\b[^>]*>([\s\S]*?)<\/t[dh]>/gi)].map(cell=>sourceText(cell[1]))).find(cells=>norm(cells[0])===norm(officialName));
    const year=document.base_path.match(/for-(\d{4})-/)?.[1],value=row ? row.slice(1).join('; ') : 'No exact authority row found in this published list';
    support.push({url:'https://www.gov.uk'+document.base_path,value});
    facts.push(makeSourceFact(account,'local_authority',code,refresh,`efs-${year}`,{component:'efs',title:`Exceptional Financial Support register · ${year}`,value,evidence_type:'event',source_date:String(page.public_updated_at || refresh.refreshed_at).slice(0,10),source_reference:'https://www.gov.uk'+document.base_path,notes:`Matched against official return name ${officialName} for ONS ${code}. In-principle support, applications, approvals and final capitalisation directions must be distinguished. No matched row does not prove absence of support. Administrator review is required for ASE classification.`,severity:row ? 'moderate' : 'none'}));
  }
  const searchUrl='https://www.gov.uk/api/search.json?'+new URLSearchParams({q:`${officialName} statutory intervention Section 114 audit`,count:'3',fields:'title,link,description,public_timestamp',filter_organisations:'ministry-of-housing-communities-local-government'});
  const search=await sourceJson(searchUrl);
  const documentsFound=(search.results || []).slice(0,3).map(document=>({title:document.title,description:document.description || '',url:'https://www.gov.uk'+document.link,published:document.public_timestamp}));
  for(const [index,document] of documentsFound.entries()) if(document.url.startsWith('https://www.gov.uk/government/')) facts.push(makeSourceFact(account,'local_authority',code,refresh,`governance-${index}`,{component:'intervention',title:document.title,value:'Official document candidate; identity and current status require review',evidence_type:'governance',source_reference:document.url,source_date:document.published?.slice(0,10) || refresh.refreshed_at.slice(0,10),notes:document.description+' Search relevance is not proof of an intervention or Section 114 notice. Confirm the authority, operative dates and current status from the linked document.'}));
  warnings.push('Financial returns, support registers and governance search results are imported for review, not automatically scored. Council audit opinions and Section 114 status still require primary-document verification.');
  return {facts,raw:{code,returns,support,governance_candidates:documentsFound},summary:{authority_code:code,authority_name:officialName,financial_years:returns.map(row=>row.financial_year),support_registers:support.length,governance_candidates:documentsFound.length},warnings};
}