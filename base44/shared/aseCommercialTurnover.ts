import {normaliseCompanyNumber} from './companiesHouseData.ts';
import {blackflagTurnover} from './aseBlackflagSnapshot.ts';
import {readSourceResponse} from './aseSourceCommon.ts';
import {vatIdentifier} from './aseVatIdentifier.ts';
export async function commercialTurnover(base44,account,now=new Date()) {
  const reported=await blackflagTurnover(base44,account,now);
  if(reported.status==='available') return reported;
  const filed=await filedCommercialTurnover(base44,account,now);
  return filed.status==='available' ? {...filed,source_label:'Companies House filed accounts'} : {status:'unavailable',reason:`Blackflag: ${reported.reason} Companies House: ${filed.reason}`};
}
export async function filedCommercialTurnover(base44,account,now=new Date()) {
  if(!account.company_number) return {status:'unavailable',reason:'No Companies House number is recorded.'};
  if(!/^(?:\d{1,8}|[A-Z]{2}\d{1,6})$/i.test(String(account.company_number).trim())) return {status:'unavailable',reason:'The recorded Companies House number is invalid.'};
  const number=normaliseCompanyNumber(account.company_number);
  const page=await base44.entities.ASESourceRefresh.filter({account_id:account.id,source_key:'accounts',identifier:number,status:{$in:['completed','partial']},refreshed_at:{$lte:now.toISOString()}},{sort:'-refreshed_at',limit:1});
  const audit=page.items[0];
  if(!audit?.raw_file_uri || !audit.raw_sha256) return {status:'unavailable',reason:'No integrity-checked filed accounts snapshot is available. Refresh Companies House accounts in ASE Sources.'};
  try {
    const {signed_url}=await base44.integrations.Core.CreateFileSignedUrl({file_uri:audit.raw_file_uri});
    const response=await fetch(signed_url,{signal:AbortSignal.timeout(15000)});
    if(!response.ok) return {status:'unavailable',reason:'The stored accounts snapshot is unavailable.'};
    const stored=await readSourceResponse(response,3000000);
    const sha=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',stored.bytes))).map(b=>b.toString(16).padStart(2,'0')).join('');
    if(sha!==audit.raw_sha256) return {status:'unavailable',reason:'The accounts snapshot failed integrity validation.'};
    const snapshot=JSON.parse(stored.text);
    if(snapshot.identifier!==number || snapshot.data?.company_number!==number) return {status:'unavailable',reason:'Turnover evidence does not match this company.'};
    const candidates=(snapshot.data.periods || []).filter(period=>period.metrics?.revenue).sort((a,b)=>b.end.localeCompare(a.end));
    const period=candidates[0],metric=period?.metrics?.revenue;
    if(!period) return {status:'unavailable',reason:'Turnover is not disclosed in the available accounts. No revenue is inferred from other financial figures.'};
    const days=(Date.parse(metric.end)-Date.parse(metric.start))/86400000+1,age=(now.getTime()-Date.parse(period.end))/86400000;
    const source=new URL(period.source_url);
    if(period.origin==='pdf' || metric.annual!==true || !Number.isFinite(days) || !Number.isFinite(age) || !Number.isFinite(Date.parse(period.filed_at)) || metric.end!==period.end || days<365 || days>366 || !(metric.value>0) || !Number.isFinite(metric.value) || !/(?:^|:)(?:TurnoverRevenue|Revenue|Turnover)$/.test(metric.concept || '') || age<0 || age>913 || Date.parse(period.filed_at)<Date.parse(period.end) || Date.parse(period.filed_at)>now.getTime() || source.protocol!=='https:' || source.hostname!=='find-and-update.company-information.service.gov.uk' || !source.pathname.startsWith(`/company/${number}/filing-history/`)) return {status:'unavailable',reason:'The latest disclosed turnover is stale, non-annual, non-positive or unverified. ALICE PDF figures are not independently verified and cannot be used as this denominator.'};
    return {status:'available',value:metric.value,currency:'GBP',period_start:metric.start,period_end:period.end,source_reference:source.href,source_date:period.filed_at,refresh_id:audit.id,raw_sha256:sha,retrieved_at:audit.refreshed_at,company_number:number};
  } catch(error) {return {status:'unavailable',reason:'Stored turnover evidence could not be verified: '+String(error.message).slice(0,200)};}
}
export async function hmrcStatus(base44,account) {
  const identifier=await vatIdentifier(base44,account),vat=identifier.vat_number;
  if(!vat) return {status:'Not available',reason:identifier.reason};
  const page=await base44.entities.ASESourceRefresh.filter({account_id:account.id,source_key:'hmrc',identifier:vat},{sort:'-refreshed_at',limit:1});
  const audit=page.items[0];
  if(!audit) return {...identifier,status:'Not checked',reason:`A VAT number is available from ${identifier.vat_source}, but no stored HMRC verification is available. Production credentials and Check a UK VAT Number v2 access are required.`};
  const blocked=audit.status==='failed';
  return {...identifier,status:blocked ? 'Blocked / unavailable' : audit.status==='pending' ? 'Pending' : 'Recorded check',checked_at:audit.refreshed_at,reason:blocked ? (audit.error || 'HMRC verification failed; registration remains unknown.') : audit.status==='pending' ? 'Verification has not completed.' : audit.summary?.identity_matched ? 'A company-matched result was recorded. This is a dated VAT check, not a financial-health conclusion.' : 'A result was recorded, but company identity or registration needs review.',refresh_id:audit.id};
}