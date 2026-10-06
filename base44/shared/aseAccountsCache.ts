import {readSourceResponse} from './aseSourceCommon.ts';
export const accountsExtractionVersion='filed-accounts-turnover-v1';
export const accountsFilingKeys=filings=>filings.map(row=>`${row.transaction_id}:${row.date}:${row.links.document_metadata}`);
export function reusableAccounts(snapshot,number,filings) {
  return snapshot?.company_number===number && snapshot.extraction_version===accountsExtractionVersion && JSON.stringify(snapshot.filing_keys)===JSON.stringify(accountsFilingKeys(filings)) && snapshot.documents?.length===filings.length && snapshot.documents.every(row=>!row.scan_failed && !row.unsupported);
}
export async function readAccountsCache(base44,accountId,number,filings) {
  const page=await base44.entities.ASESourceRefresh.filter({account_id:accountId,source_key:'accounts',identifier:number,status:{$in:['completed','partial']}},{sort:'-refreshed_at',limit:1});
  const audit=page.items[0];
  if(!audit?.raw_file_uri || !audit.raw_sha256) return null;
  try {
    const {signed_url}=await base44.integrations.Core.CreateFileSignedUrl({file_uri:audit.raw_file_uri});
    const response=await fetch(signed_url,{signal:AbortSignal.timeout(15000)});
    if(!response.ok) return null;
    const stored=await readSourceResponse(response),sha=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',stored.bytes))).map(b=>b.toString(16).padStart(2,'0')).join('');
    if(sha!==audit.raw_sha256) return null;
    const snapshot=JSON.parse(stored.text);
    return snapshot.identifier===number && reusableAccounts(snapshot.data,number,filings) ? snapshot.data : null;
  } catch {return null;}
}
export function accountsCacheRules() {
  const filing={transaction_id:'new-accounts',date:'2026-10-06',links:{document_metadata:'/document/new'}},filings=[filing];
  const snapshot={company_number:'12345678',extraction_version:accountsExtractionVersion,filing_keys:accountsFilingKeys(filings),documents:[{filing_date:filing.date}]};
  return {unchangedFilingReused:reusableAccounts(snapshot,'12345678',filings),newFilingExtracted:!reusableAccounts(snapshot,'12345678',[{...filing,transaction_id:'replacement'}]),wrongCompanyNotReused:!reusableAccounts(snapshot,'87654321',filings),oldExtractionRefreshed:!reusableAccounts({...snapshot,extraction_version:undefined},'12345678',filings),failedExtractionRetried:!reusableAccounts({...snapshot,documents:[{scan_failed:true}]},'12345678',filings)};
}