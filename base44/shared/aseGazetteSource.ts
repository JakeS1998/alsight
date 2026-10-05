import { sourceJson,sourceFetch,sourceText,makeSourceFact } from './aseSourceCommon.ts';
export async function retrieveGazette(account,number,refresh) {
  const url=`https://www.thegazette.co.uk/insolvency/notice/data.json?text=${encodeURIComponent(number)}&results-page-size=10&sort-by=latest-date`;
  const raw=await sourceJson(url),entries=Array.isArray(raw.entry) ? raw.entry : raw.entry ? [raw.entry] : [],total=Number(raw['f:total']);
  if(!Number.isFinite(total)) throw new Error('Gazette result format was not recognised.');
  const notices=await Promise.all(entries.slice(0,10).map(async entry=>{
    const id=String(entry.id || '').match(/\/notice\/([A-Za-z0-9-]+)$/)?.[1];
    if(!id) throw new Error('Gazette notice identifier was not recognised.');
    const reference=`https://www.thegazette.co.uk/notice/${id}`,page=await sourceFetch(reference);
    if(!page.ok) throw new Error(`Gazette notice verification returned HTTP ${page.status}.`);
    const text=sourceText(page.text),escaped=number.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
    const matched=new RegExp(`(?:Company (?:Number|number|No\\.?)|Registered (?:Number|number))\\s*:?\\s*\\(?\\s*${escaped}(?![A-Za-z0-9])`,'i').test(text);
    return {id,reference,title:entry.title || 'Insolvency notice',category:entry.category?.['@term'] || '',published:String(entry.published || '').slice(0,10),matched,text:text.slice(0,18000)};
  }));
  const facts=[makeSourceFact(account,'gazette',number,refresh,'search',{component:'gazette_search',title:'Gazette corporate insolvency search',value:`${total} search matches; ${notices.filter(n=>n.matched).length} notice bodies matched`,source_reference:url,evidence_type:'event',notes:`Search by company number. First ${Math.min(10,total)} results reviewed; historic notices do not establish current insolvency, and zero search results do not prove absence of all adverse events.`})];
  for(const notice of notices.filter(n=>n.matched)) facts.push(makeSourceFact(account,'gazette',number,refresh,`notice-${notice.id}`,{component:'adverse',title:notice.title,value:notice.category || 'Notice requires review',source_reference:notice.reference,source_date:/^\d{4}-\d{2}-\d{2}$/.test(notice.published) ? notice.published : refresh.refreshed_at.slice(0,10),reporting_period:refresh.refreshed_at.slice(0,10),severity:'moderate',confidence:'High',notes:`Exact company number confirmed in notice body. Published ${notice.published}. Check current status, resolution and materiality; this is not an automatic adverse-event classification.`}));
  const warnings=['Gazette search is not a complete credit or court-register check. No favourable ASE score is inferred from an empty search.'];
  if(total>10) warnings.push('Search has more than ten notices; results are partial. Review the linked complete search.');
  if(notices.some(n=>!n.matched)) warnings.push('Some search hits did not provide an exact company-number match and were not imported as adverse evidence.');
  return {facts,raw:{feed:raw,notices},summary:{company_number:number,search_matches:total,matched_notices:notices.filter(n=>n.matched).length,complete:total<=10},warnings};
}