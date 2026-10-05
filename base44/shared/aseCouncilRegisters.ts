import {sourceJson,sourceText,makeSourceFact} from './aseSourceCommon.ts';
export const interventionPath='/government/collections/statutory-best-value-inspections-and-interventions-in-england';
export const backlogPath='/government/publications/addressing-the-local-audit-backlog-in-england-non-compliance-lists';
export const opinionPath='/government/publications/addressing-the-local-audit-backlog-modified-or-disclaimed-audit-opinions/addressing-the-local-audit-backlog-modified-or-disclaimed-audit-opinions';
export const normaliseCouncilName=value=>sourceText(value).toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
const norm=normaliseCouncilName;
export function councilNames(account,officialName) {return [...new Set([account.name,officialName].filter(Boolean).flatMap(name=>[name,name.replace(/^City of\s+/i,'')]).map(norm))].filter(name=>name.length>8);}
export async function collectCouncilRegisters(account,code,refresh,officialName) {
  const facts=[],raw={},warnings=[],names=councilNames(account,officialName);
  const add=(slug,data)=>facts.push(makeSourceFact(account,'council_governance',code,refresh,slug,{evidence_type:'governance',confidence:'Medium',...data}));
  try {
    const page=await sourceJson('https://www.gov.uk/api/content'+interventionPath),documents=page.links?.documents || [],groups=page.details?.collection_groups || [];
    const matches=groups.filter(group=>/^(Current statutory interventions|Current statutory inspections|Previous statutory interventions)$/.test(group.title)).flatMap(group=>(group.documents || []).flatMap(id=>{const doc=documents.find(item=>item.content_id===id);return doc && names.some(name=>(' '+norm(doc.title)+' ').includes(' '+name+' ')) ? [{group:group.title,title:doc.title,path:doc.base_path}] : [];})).slice(0,5);
    raw.intervention_register={title:page.title,updated:page.public_updated_at,matches};
    add('intervention-register',{component:'intervention',title:'Statutory intervention register check',value:matches.length ? 'Exact recorded-name entries found; verify operative status' : 'No exact recorded-name entry found; absence not verified',source_reference:'https://www.gov.uk'+interventionPath,source_date:String(page.public_updated_at || refresh.refreshed_at).slice(0,10),notes:`ONS ${code}; recorded names ${account.name}${officialName ? '; '+officialName : ''}. Inspection is not statutory intervention; previous intervention is not a current event. This register does not establish the absence of Section 114 notices. Confirm current primary directions and notice dates before approving any classification.`});
    for(const [index,match] of matches.entries()) if(/^\/government\//.test(match.path)) add(`intervention-${index}`,{component:'intervention',title:match.title,value:`Listed under ${match.group}; status requires review`,source_reference:'https://www.gov.uk'+match.path,source_date:String(page.public_updated_at || refresh.refreshed_at).slice(0,10),notes:`Exact recorded-name match in the central register for ONS ${code}. Check the linked directions, commencement, expiry and any subsequent ending direction. Group membership is a discovery fact, not an automatically verified ASE classification.`});
  } catch(error) {warnings.push('Intervention register: '+error.message);}
  try {
    const index=await sourceJson('https://www.gov.uk/api/content'+backlogPath),attachment=(index.details?.attachments || []).find(item=>String(item.url || '').startsWith(backlogPath+'/'));
    if(!attachment) throw new Error('No HTML non-compliance list was published.');
    const page=await sourceJson('https://www.gov.uk/api/content'+attachment.url),body=String(page.details?.body || ''),matches=[];
    for(const table of body.matchAll(/<table\b[^>]*>([\s\S]*?)<\/table>/gi)) {
      const rows=[...table[1].matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)].map(row=>[...row[1].matchAll(/<t[dh]\b[^>]*>([\s\S]*?)<\/t[dh]>/gi)].map(cell=>sourceText(cell[1])));
      const headings=[...body.slice(0,table.index).matchAll(/<h[23]\b[^>]*>([\s\S]*?)<\/h[23]>/gi)],period=sourceText(headings.at(-1)?.[1] || 'Published list');
      for(const cells of rows.slice(1)) if(names.includes(norm(cells[0]))) matches.push({period,headers:rows[0],cells});
    }
    raw.backstop_register={title:page.title,updated:page.public_updated_at,url:'https://www.gov.uk'+attachment.url,matches};
    add('backstop-register',{component:'audit',title:'Local audit backstop publication check',value:matches.length ? 'Exact council rows in published non-compliance lists; inspect period and subsequent publication' : 'No exact council row found; compliance not verified',source_reference:raw.backstop_register.url,source_date:String(page.public_updated_at || refresh.refreshed_at).slice(0,10),notes:`ONS ${code}. Inclusion is not an adverse audit opinion and may describe a historical delay now resolved. Absence is not proof of timely publication, audit completion or an unqualified opinion. Review the council statement of accounts, auditor report, exemptions and relevant financial year.`});
    for(const [index,row] of matches.slice(0,3).entries()) add(`backstop-${index}`,{component:'audit',title:`Backstop list: ${row.period}`,value:row.cells[0]+' · '+row.cells.slice(1).join('; '),source_reference:raw.backstop_register.url,source_date:String(page.public_updated_at || refresh.refreshed_at).slice(0,10),notes:row.headers.slice(1).map((header,i)=>`${header}: ${row.cells[i+1]}`).join(' | ')+' Historical publication status only; confirm the auditor opinion and current position.'});
  } catch(error) {warnings.push('Audit backstop list: '+error.message);}
  try {
    const page=await sourceJson('https://www.gov.uk/api/content'+opinionPath);
    raw.backstop_guidance={title:page.title,updated:page.public_updated_at,extract:sourceText(page.details?.body).slice(0,18000)};
    add('audit-opinion-review',{component:'audit',title:'Council audit opinion: primary report verification required',value:'Not verified; backstop-only disclaimers must not be treated as substantive governance failure',source_reference:'https://www.gov.uk'+opinionPath,source_date:String(page.public_updated_at || refresh.refreshed_at).slice(0,10),notes:`Guidance only, not an audit opinion for ${account.name}. Enter the council or auditor primary report URL, financial period and basis when reviewing. A disclaimer caused only by a statutory backstop remains context and is excluded from ASE scoring; mixed or substantive findings require separate verification.`});
  } catch(error) {warnings.push('Audit opinion guidance: '+error.message);}
  return {facts,raw,warnings};
}