import {sourceJson,sourceText,makeSourceFact} from './aseSourceCommon.ts';
import {councilNames,normaliseCouncilName} from './aseCouncilRegisters.ts';
export async function discoverGovernanceDocuments(account,code,refresh,officialName) {
  const facts=[],raw=[],warnings=[],names=councilNames(account,officialName),seen=new Set();
  for(const [component,terms] of [['audit','audit report value for money'],['intervention','Section 114 notice statutory intervention']]) {
    try {
      const url='https://www.gov.uk/api/search.json?'+new URLSearchParams({q:`${officialName || account.name} ${terms}`,count:'4',fields:'title,link,description,public_timestamp'}),search=await sourceJson(url);
      for(const item of (search.results || []).slice(0,4)) {
        if(!/^\/government\//.test(item.link || '') || seen.has(item.link) || !new RegExp(component==='audit' ? 'audit|value for money' : 'section 114|intervention|best value|commissioner','i').test(item.title+' '+item.description)) continue;
        seen.add(item.link);
        try {
          const page=await sourceJson('https://www.gov.uk/api/content'+item.link),text=sourceText(page.details?.body || ''),identity=names.some(name=>(' '+normaliseCouncilName(page.title+' '+text)+' ').includes(' '+name+' ')),date=String(page.public_updated_at || item.public_timestamp || '').slice(0,10);
          if(!identity || !/^\d{4}-\d{2}-\d{2}$/.test(date) || Date.parse(date)>Date.now()) continue;
          const document={component,title:page.title,url:'https://www.gov.uk'+item.link,published:date,extract:text.slice(0,18000),attachments:(page.details?.attachments || []).slice(0,8).map(row=>({title:row.title,url:row.url}))}; raw.push(document);
          facts.push(makeSourceFact(account,'council_governance',code,refresh,`document-${component}-${raw.length}`,{component,title:document.title,value:'Council name found in official document; current status and meaning require primary-source review',evidence_type:component==='audit' ? 'governance' : 'event',source_date:date,source_reference:document.url,notes:`ONS ${code}; an exact recorded council-name phrase occurs in the document. That mention may be historical or incidental. Source publication/update date is not the event commencement date. Review operative directions or the signed Section 114 notice; no rating is inferred from search relevance or text mentions.`}));
        } catch(error) {warnings.push(`Document ${item.title}: ${error.message}`);}
      }
    } catch(error) {warnings.push(`${component} discovery: ${error.message}`);}
  }
  return {facts,raw,warnings};
}