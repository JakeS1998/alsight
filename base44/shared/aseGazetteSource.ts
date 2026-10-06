import { sourceJson,sourceFetch,sourceText,makeSourceFact } from './aseSourceCommon.ts';
import {gazetteWaitSeconds} from './aseProviderPolicy.ts';
import {gazetteRobotsPolicy} from './aseGazettePolicy.ts';
export async function retrieveGazette(account,number,refresh) {
  if(gazetteWaitSeconds()) throw new Error('Gazette collection is permitted only between 21:00 and 07:00 Europe/London. Automated runs wait until the permitted window.');
  const url=`https://www.thegazette.co.uk/all-notices/notice/data.json?text=${encodeURIComponent(number)}&categorycode=24&results-page-size=10&sort-by=latest-date`;
  const policy=await gazetteRobotsPolicy();policy.assertAllowed(url);await policy.pause();
  const raw=await sourceJson(url,{headers:{Accept:'application/json','User-Agent':policy.ua}}),entries=Array.isArray(raw.entry) ? raw.entry : raw.entry ? [raw.entry] : [],total=Number(raw['f:total']);
  if(!Number.isSafeInteger(total) || total<0 || raw['f:total']==null || raw['f:total']==='' || (total===0 && entries.length)) throw new Error('Gazette result format was not recognised.');
  const notices=[];
  for(const entry of entries.slice(0,10)) {
    await policy.pause();
    if(gazetteWaitSeconds()) throw new Error('Gazette overnight collection window ended; retry in the next permitted window.');
    const id=String(entry.id || '').match(/\/notice\/([A-Za-z0-9-]+)$/)?.[1];
    if(!id) throw new Error('Gazette notice identifier was not recognised.');
    const reference=`https://www.thegazette.co.uk/notice/${id}`;policy.assertAllowed(reference);
    const page=await sourceFetch(reference,{headers:{'User-Agent':policy.ua}});
    if(!page.ok) {const error=new Error(`Gazette notice verification returned HTTP ${page.status}.`);error.status=page.status;error.retryAfter=page.retryAfter;throw error;}
    const text=sourceText(page.text),escaped=number.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
    const matched=new RegExp(`(?:Company (?:Number|number|No\\.?)|Registered (?:Number|number))\\s*:?\\s*\\(?\\s*${escaped}(?![A-Za-z0-9])`,'i').test(text);
    notices.push({id,reference,title:entry.title || 'Insolvency notice',category:entry.category?.['@term'] || '',published:String(entry.published || '').slice(0,10),matched,text:text.slice(0,18000)});
  }
  const facts=[makeSourceFact(account,'gazette',number,refresh,'search',{component:'gazette_search',title:'Gazette corporate insolvency search',value:`${total} search matches; ${notices.filter(n=>n.matched).length} notice bodies matched`,source_reference:url,evidence_type:'event',notes:`Search by company number. First ${Math.min(10,total)} results reviewed; historic notices do not establish current insolvency. A successful zero-result search is clean for this Gazette check only, not proof of absence of all adverse events.`})];
  for(const notice of notices.filter(n=>n.matched)) facts.push(makeSourceFact(account,'gazette',number,refresh,`notice-${notice.id}`,{component:'adverse',title:notice.title,value:notice.category || 'Notice requires review',source_reference:notice.reference,source_date:/^\d{4}-\d{2}-\d{2}$/.test(notice.published) ? notice.published : refresh.refreshed_at.slice(0,10),reporting_period:refresh.refreshed_at.slice(0,10),severity:'moderate',confidence:'High',notes:`Exact company number confirmed in notice body. Published ${notice.published}. Check current status, resolution and materiality; this is not an automatic adverse-event classification.`}));
  if(total===0) facts.push(makeSourceFact(account,'gazette',number,refresh,'clean-search',{component:'adverse',title:'Clean Gazette record · no insolvency notices found',value:'5',source_reference:url,evidence_type:'event',confidence:'Medium',notes:'Successful company-number Gazette insolvency search returned zero results. Counts as a clean record under the configured ASE rule; limited to this Gazette search, not a complete credit or court-register check. Company name equality is not required.'}));
  const warnings=['Gazette search is not a complete credit or court-register check. Successful zero-result searches count as a clean Gazette record under the configured ASE rule; failed or incomplete checks remain unknown.'];
  if(total>10) warnings.push('Search has more than ten notices; results are partial. Review the linked complete search.');
  if(notices.some(n=>!n.matched)) warnings.push('Some search hits did not provide an exact company-number match and were not imported as adverse evidence.');
  return {facts,raw:{company_number:number,feed:raw,notices},summary:{company_number:number,search_matches:total,matched_notices:notices.filter(n=>n.matched).length,complete:total<=10},warnings};
}