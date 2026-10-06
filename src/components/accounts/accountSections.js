const typeOf = account => String(account.organisation_type || '').trim().toLowerCase().replace(/[\s-]+/g, '_');
export function isCouncilAccount(account) {
  const type = typeOf(account);
  if (/local_authority|council|public_body|government/.test(type)) return true;
  if (/company|\bltd\b|\bplc\b|(?:^|_)llp(?:_|$)|limited_liability_partnership/.test(type)) return false;
  return !!account.local_authority_code || account.relationship_types?.includes('local_authority') || /\bcouncil\b|local authority|\bborough\b/i.test(account.name || '');
}
export function hasCompanyRegistry(account) {
  return !isCouncilAccount(account) && !!(account.company_number || account.company_type || /company|\bltd\b|\bplc\b|(?:^|_)llp(?:_|$)|limited_liability_partnership/.test(typeOf(account)));
}
export function hasSupplierQualification(account) {
  return !isCouncilAccount(account) && [account.account_type, ...(account.relationship_types || [])].some(type => ['supplier', 'consultant', 'contractor'].includes(type));
}