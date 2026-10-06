import { sourceJson,sourceText,makeSourceFact } from './aseSourceCommon.ts';
export async function retrieveCouncilContext(account,code,refresh,officialName) {
  const facts=[],support=[],documentsFound=[],warnings=[],norm=name=>String(name || '').toLowerCase().replace(/[^a-z0-9]/g,'');
  try {
    const collection=await sourceJson('https://www.gov.uk/api/content/government/collections/exceptional-financial-support-for-local-authorities');
    const documents=(collection.links?.documents || []).filter(doc=>/\/guidance\/exceptional-financial-support-for-local-authorities-for-\d{4}-\d{2}$/.test(doc.base_path || '') && (!doc.public_updated_at || Date.parse(doc.public_updated_at)<=Date.now())).sort((a,b)=>b.base_path.localeCompare(a.base_path)).slice(0,2);
    if(!documents.length) warnings.push('No current Exceptional Financial Support annual publication was found.');
    for(const document of documents) {
      try {
        const page=await sourceJson('https://www.gov.uk/api/content'+document.base_path),body=String(page.details?.body || '');
        const matches=[...body.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)].map(match=>[...match[1].matchAll(/<t[dh]\b[^>]*>([\s\S]*?)<\/t[dh]>/gi)].map(cell=>sourceText(cell[1]))).filter(cells=>norm(cells[0])===norm(officialName));
        const row=matches.length===1 ? matches[0] : null;
        if(matches.length>1) warnings.push('Multiple authority rows in the support publication; no automatic classification.');
        const year=document.base_path.match(/for-(\d{4})-/)?.[1],value=row ? row.slice(1).join('; ') : 'No exact authority row found in this published list',url='https://www.gov.uk'+document.base_path;
        support.push({url,value,code,authority_name:row?.[0] || '',exact_match:!!row,financial_year:Number(year),source_date:String(page.public_updated_at || refresh.refreshed_at).slice(0,10)});
        facts.push(makeSourceFact(account,'local_authority',code,refresh,`efs-${year}`,{component:'efs',title:`Exceptional Financial Support register · ${year}`,value,evidence_type:'event',source_date:String(page.public_updated_at || refresh.refreshed_at).slice(0,10),source_reference:url,notes:`Matched against official return name ${officialName} for ONS ${code}. In-principle support, applications, approvals and final capitalisation directions must be distinguished. No matched row does not prove absence of support. Explicit current-year support agreed in principle can score at Low confidence under the broader evidence rule; ambiguous amounts, bare list entries and unmatched rows remain context.`,severity:row ? 'moderate' : 'none'}));
      } catch(error) {warnings.push(`Exceptional Financial Support: ${error.message}`);}
    }
  } catch(error) {warnings.push(`Exceptional Financial Support collection: ${error.message}`);}
  try {
    const url='https://www.gov.uk/api/search.json?'+new URLSearchParams({q:`${officialName} statutory intervention Section 114 audit`,count:'3',fields:'title,link,description,public_timestamp',filter_organisations:'ministry-of-housing-communities-local-government'});
    const search=await sourceJson(url);
    for(const [index,document] of (search.results || []).slice(0,3).entries()) {
      if(!String(document.link || '').startsWith('/government/')) continue;
      const item={title:document.title,description:document.description || '',url:'https://www.gov.uk'+document.link,published:document.public_timestamp};documentsFound.push(item);
      facts.push(makeSourceFact(account,'local_authority',code,refresh,`governance-${index}`,{component:'intervention',title:item.title,value:'Official document candidate; identity and current status require review',evidence_type:'governance',source_reference:item.url,source_date:item.published?.slice(0,10) || refresh.refreshed_at.slice(0,10),notes:item.description+' Search relevance is not proof of an intervention or Section 114 notice. Confirm the authority, operative dates and current status from the linked document.'}));
    }
  } catch(error) {warnings.push(`Governance document discovery: ${error.message}`);}
  return {facts,support,documentsFound,warnings};
}