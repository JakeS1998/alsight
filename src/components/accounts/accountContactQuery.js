const escape = value => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const normalise = value => String(value || '').trim().toLowerCase();
const sharedDomains = new Set(['gmail.com','googlemail.com','outlook.com','hotmail.com','live.com','yahoo.com','yahoo.co.uk','icloud.com','aol.com','gov.uk','org.uk','co.uk']);
export function accountContactDomains(account) {
  let websiteDomain = '';
  if (account.website) {
    try { websiteDomain = new URL(/^https?:\/\//i.test(account.website) ? account.website : `https://${account.website}`).hostname.toLowerCase().replace(/^www\./, ''); }
    catch { /* Invalid recorded websites are not used for matching. */ }
  }
  return [...new Set([websiteDomain,normalise(account.email).split('@')[1]].filter(domain => domain?.includes('.') && !sharedDomains.has(domain)))];
}
export default function accountContactQuery(account) {
  const clauses = [];
  if (account.company_number?.trim()) clauses.push({ company_number: { $regex: `^${escape(account.company_number.trim())}$`, $options: 'i' } });
  for (const name of new Set([account.company_name,account.name].map(normalise).filter(Boolean))) clauses.push({ company_name: { $regex: `^${escape(name)}$`, $options: 'i' } });
  for (const domain of accountContactDomains(account)) clauses.push({ email: { $regex: `@${escape(domain)}$`, $options: 'i' } });
  if (account.primary_contact_id) clauses.push({ dataverse_id: account.primary_contact_id });
  return clauses.length ? { $or: clauses } : { company_number: '__no_recorded_account_identity__' };
}
export function contactBelongsToAccount(account,contact) {
  if (!account || !contact) return false;
  return !!(account.primary_contact_id && [contact.id,contact.dataverse_id].includes(account.primary_contact_id))
    || !!(normalise(account.company_number) && normalise(account.company_number) === normalise(contact.company_number))
    || [account.name,account.company_name].some(name => normalise(name) && normalise(name) === normalise(contact.company_name))
    || accountContactDomains(account).includes(normalise(contact.email).split('@')[1]);
}