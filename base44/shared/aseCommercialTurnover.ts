import {normaliseCompanyNumber} from './companiesHouseData.ts';
import {readSourceResponse} from './aseSourceCommon.ts';
import {vatIdentifier} from './aseVatIdentifier.ts';
import {filedTurnoverPeriod} from './aseFiledTurnover.ts';
import {balanceSheetProxy,accountsTurnoverExemption} from './aseBalanceSheetProxy.ts';
export async function commercialTurnover(base44,account,now=new Date()) {
  const filed=await filedCommercialTurnover(base44,account,now);
  return filed.status==='available' ? {...filed,source_label:'Companies House filed accounts'} : filed;
}
export async function filedCommercialTurnover(base44,account,now=new Date(),maxAgeDays=913) {
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
    if(!candidates.length) {
      const latest=[...(snapshot.data.periods || [])].sort((a,b)=>b.end.localeCompare(a.end))[0];
      const document=snapshot.data.documents?.find(row=>row.source_url===latest?.source_url);
      const proxy=balanceSheetProxy(latest ? {...latest,filing_exemption:latest.filing_exemption || accountsTurnoverExemption(document?.xml)} : null,number,now,maxAgeDays);
      return {status:'unavailable',period_end:latest?.end,...(proxy.status==='available' ? {balance_sheet_proxy:{...proxy,refresh_id:audit.id,raw_sha256:sha,retrieved_at:audit.refreshed_at}} : {}),reason:`No numeric annual company turnover was extracted from the available filed accounts${latest?.end ? `, latest period ending ${latest.end}` : ''}. A turnover accounting-policy heading is not a reported revenue amount; a cited annual turnover figure is required.`};
    }
    const turnover=filedTurnoverPeriod(candidates[0],number,now,maxAgeDays);
    return turnover.status==='available' ? {...turnover,refresh_id:audit.id,raw_sha256:sha,retrieved_at:audit.refreshed_at} : turnover;
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