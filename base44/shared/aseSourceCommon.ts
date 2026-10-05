import { normaliseCompanyNumber } from './companiesHouseData.ts';
export const sourceNames={blackflag:'Blackflag Alert',gazette:'The Gazette',hmrc:'HMRC VAT',local_authority:'MHCLG / GOV.UK'};
export function sourceIdentifier(account,key) {
  if(key==='hmrc') { const vat=String(account.vat_number || '').replace(/^GB/i,'').replace(/\s/g,''); if(!/^(?:\d{9}|\d{12})$/.test(vat)) throw new Error('Record a valid UK VAT number in this Account first.'); return vat; }
  if(key==='local_authority') { const code=String(account.local_authority_code || '').trim().toUpperCase(); if(!/^E\d{8}$/.test(code)) throw new Error('Record the council’s nine-character ONS authority code first (for example E08000032).'); return code; }
  return normaliseCompanyNumber(account.company_number);
}
export function evidencePrefix(account,key,identifier) { return `ase-source:${account.id}:${key}:${identifier}:`; }
export function makeSourceFact(account,key,identifier,refresh,slug,data) {
  const today=refresh.refreshed_at.slice(0,10);
  return {account_id:account.id,assessment_id:null,external_key:evidencePrefix(account,key,identifier)+slug,source:sourceNames[key],source_refresh_id:refresh.id,company_number:['blackflag','gazette'].includes(key) ? identifier : undefined,retrieval_date:refresh.refreshed_at,source_date:today,reporting_period:today,evidence_type:'event',severity:'none',confidence:'Medium',score_eligible:false,is_demo:false,...data,title:String(data.title).slice(0,200),value:String(data.value).slice(0,200),notes:String(data.notes || '').slice(0,1000)};
}
export async function sourceFetch(url,options={},maxBytes=3000000) {
  const allowed=['blackflagalert.com','www.thegazette.co.uk','www.gov.uk','assets.publishing.service.gov.uk','api.service.hmrc.gov.uk'];
  if(!allowed.includes(new URL(url).hostname)) throw new Error('Unapproved source destination.');
  const response=await fetch(url,{...options,redirect:'manual',signal:AbortSignal.timeout(20000)});
  if(response.status>=300 && response.status<400) throw new Error('Source redirected to an unverified destination; no evidence was imported.');
  if(Number(response.headers.get('content-length'))>maxBytes) throw new Error('Source response exceeds its size limit.');
  const reader=response.body?.getReader(),chunks=[]; let size=0;
  if(reader) for(;;) { const {done,value}=await reader.read(); if(done) break; size+=value.byteLength; if(size>maxBytes) {await reader.cancel();throw new Error('Source response exceeds its size limit.');} chunks.push(value); }
  const bytes=new Uint8Array(size);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.length;}
  return {status:response.status,ok:response.ok,text:new TextDecoder().decode(bytes),bytes};
}
export async function sourceJson(url,options={}) { const response=await sourceFetch(url,options); if(!response.ok) throw new Error(`Source returned HTTP ${response.status}; no clean result has been inferred.`); return JSON.parse(response.text); }
export function sourceText(html) { return String(html).replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,'').replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi,'').replace(/<[^>]+>/g,' ').replace(/&amp;/g,'&').replace(/&nbsp;/g,' ').replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/\s+/g,' ').trim(); }