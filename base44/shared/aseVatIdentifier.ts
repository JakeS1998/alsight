export function normaliseVatNumber(value) {
  const vat=String(value || '').trim().toUpperCase().replace(/\s/g,'').replace(/^GB/,'');
  return /^(?:\d{9}|\d{12})$/.test(vat) ? vat : null;
}
export async function vatIdentifier(base44,account) {
  const recorded=normaliseVatNumber(account.vat_number);
  if(recorded) return {vat_number:recorded,vat_source:'Account record'};
  return {reason:'No usable UK VAT number is recorded on this relationship. Registration status remains unknown.'};
}