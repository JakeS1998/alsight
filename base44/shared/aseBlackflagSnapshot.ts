import {normaliseCompanyNumber} from './companiesHouseData.ts';
import {readSourceResponse} from './aseSourceCommon.ts';
export async function blackflagSnapshot(base44,account,now=new Date()) {
  let number;
  try {number=normaliseCompanyNumber(account.company_number);} catch {return {reason:'A valid company number is required for Blackflag evidence.'};}
  const page=await base44.entities.ASESourceRefresh.filter({account_id:account.id,source_key:'blackflag',identifier:number,status:{$in:['completed','partial']},refreshed_at:{$lte:now.toISOString()}},{sort:'-refreshed_at',limit:1});
  const audit=page.items[0];
  if(!audit?.raw_file_uri || !audit.raw_sha256) return {reason:'No saved Blackflag report is available. New automatic retrieval requires an authorised Blackflag API connection.'};
  try {
    const {signed_url}=await base44.integrations.Core.CreateFileSignedUrl({file_uri:audit.raw_file_uri});
    const response=await fetch(signed_url,{signal:AbortSignal.timeout(15000)});
    if(!response.ok) throw new Error('The saved Blackflag report is unavailable.');
    const stored=await readSourceResponse(response,3000000);
    const sha=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',stored.bytes))).map(b=>b.toString(16).padStart(2,'0')).join('');
    if(sha!==audit.raw_sha256) throw new Error('Blackflag report integrity validation failed.');
    const snapshot=JSON.parse(stored.text);
    if(snapshot.identifier!==number || snapshot.data?.company?.company_number!==number) throw new Error('Blackflag report does not match this company.');
    return {data:snapshot.data,audit,number,sha,url:`https://blackflagalert.com/company?company=${number}`};
  } catch(error) {return {reason:String(error.message).slice(0,250)};}
}
export async function blackflagTurnover(base44,account,now=new Date()) {
  const report=await blackflagSnapshot(base44,account,now);
  if(!report.data) return {status:'unavailable',reason:report.reason};
  const rows=(Array.isArray(report.data.financials) ? report.data.financials : []).filter(row=>/^\d{4}-\d{2}-\d{2}$/.test(row.period_end_date || '') && Date.parse(row.period_end_date)<=now.getTime()).sort((a,b)=>b.period_end_date.localeCompare(a.period_end_date));
  const row=rows[0];
  if(!row || !Number.isFinite(row.turnover) || row.turnover<=0 || (now.getTime()-Date.parse(row.period_end_date))/86400000>913) return {status:'unavailable',reason:'The latest Blackflag financial period has no usable positive turnover or is older than 30 months. No amount is inferred.'};
  const start=/^\d{4}-\d{2}-\d{2}$/.test(row.period_start_date || '') ? row.period_start_date : null;
  const days=start ? (Date.parse(row.period_end_date)-Date.parse(start))/86400000+1 : null;
  if(start && (days<365 || days>366 || !Number.isFinite(days))) return {status:'unavailable',reason:'Blackflag turnover covers a non-annual period and is not substituted for annual turnover.'};
  return {status:'available',value:row.turnover,currency:'GBP',period_start:start,period_end:row.period_end_date,source_reference:report.url,source_label:'Blackflag Alert',source_date:row.period_end_date,refresh_id:report.audit.id,raw_sha256:report.sha,retrieved_at:report.audit.refreshed_at,company_number:report.number,annual_verified:!!start,limitation:start ? 'Blackflag-reported financial figures, not independently verified against filed accounts.' : 'Blackflag does not supply the period start: annual duration is unconfirmed. Comparison is indicative, not verified annual concentration.'};
}