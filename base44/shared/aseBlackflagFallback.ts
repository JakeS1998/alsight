import {normaliseCompanyNumber} from './companiesHouseData.ts';
import {readSourceResponse} from './aseSourceCommon.ts';
import {blackflagFallbackComponents,blackflagFinancialFallback,primaryFinancialEvidence} from './aseBlackflagFallbackRules.ts';
export async function selectBlackflagFallback(base44,account,evidence,now) {
  const baseline=evidence.map(row=>row.source==='Blackflag Alert' ? {...row,score_eligible:false,automatic_eligible:false,automatic_reason:'Blackflag context only unless current, integrity-checked financial fallback rules qualify this figure.'} : row);
  if(!account.company_number) return baseline;
  const companyNumber=normaliseCompanyNumber(account.company_number),canonical={...account,company_number:companyNumber};
  const [auditPage,primaryPage]=await Promise.all([
    base44.entities.ASESourceRefresh.filter({account_id:account.id,source_key:'blackflag',identifier:companyNumber,status:{$in:['completed','partial']},refreshed_at:{$gte:new Date(now.getTime()-86400000).toISOString(),$lte:now.toISOString()}},{sort:'-refreshed_at',limit:1}),
    base44.entities.ASEEvidence.filter({account_id:account.id,assessment_id:null,company_number:companyNumber,source:{$in:['Companies House','Companies House filed accounts']},component:{$in:blackflagFallbackComponents},score_eligible:true},{limit:100})
  ]);
  if(primaryPage.has_more) throw new Error('More than 100 primary financial records: narrow the evidence set before assessing.');
  const primary=primaryPage.items.filter(row=>primaryFinancialEvidence(row,canonical,now)),audit=auditPage.items[0];
  const merge=rows=>Array.from(new Map([...baseline,...primary,...rows].map(row=>[row.id,row])).values());
  if(!audit?.raw_file_uri || !/^[a-f0-9]{64}$/.test(audit.raw_sha256 || '')) return merge([]);
  const page=await base44.entities.ASEEvidence.filter({account_id:account.id,assessment_id:null,source:'Blackflag Alert',company_number:companyNumber,source_refresh_id:audit.id,raw_file_uri:audit.raw_file_uri,component:{$in:blackflagFallbackComponents}},{limit:40});
  if(page.has_more) throw new Error('Blackflag financial fallback exceeds its evidence limit.');
  if(!page.items.length) return merge([]);
  const {signed_url}=await base44.integrations.Core.CreateFileSignedUrl({file_uri:audit.raw_file_uri});
  const response=await readSourceResponse(await fetch(signed_url,{redirect:'manual',signal:AbortSignal.timeout(15000)}),3000000);
  if(!response.ok) return merge([]);
  const sha=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',response.bytes))).map(byte=>byte.toString(16).padStart(2,'0')).join('');
  if(sha!==audit.raw_sha256) return merge([]);
  const stored=JSON.parse(response.text);
  if(stored.source!=='Blackflag Alert' || stored.identifier!==companyNumber || stored.retrieved_at!==audit.refreshed_at) return merge([]);
  return merge(blackflagFinancialFallback(page.items,stored.data,canonical,primary,now));
}