import {blackflagSnapshot} from './aseBlackflagSnapshot.ts';
export function normaliseVatNumber(value) {
  const vat=String(value || '').trim().toUpperCase().replace(/\s/g,'').replace(/^GB/,'');
  return /^(?:\d{9}|\d{12})$/.test(vat) ? vat : null;
}
export async function vatIdentifier(base44,account) {
  const recorded=normaliseVatNumber(account.vat_number);
  if(recorded) return {vat_number:recorded,vat_source:'Account record'};
  const report=await blackflagSnapshot(base44,account);
  if(!report.data) return {reason:`No usable Account VAT number is recorded. Blackflag lookup: ${report.reason}`};
  const reported=normaliseVatNumber(report.data.vat?.vat_number);
  if(!reported) return {reason:'No usable UK VAT number is recorded on the Account or in the saved company-matched Blackflag report. Registration status remains unknown.'};
  return {vat_number:reported,vat_source:'Blackflag Alert',vat_source_reference:report.url,vat_retrieved_at:report.audit.refreshed_at,vat_source_refresh_id:report.audit.id,vat_limitation:'Third-party reported VAT identifier; not live HMRC verification and may relate to a group registration.'};
}