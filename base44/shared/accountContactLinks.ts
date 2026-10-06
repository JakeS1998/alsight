const escape=value=>String(value || '').replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
const normalise=value=>String(value || '').trim().toLowerCase();
const sharedDomains=new Set(['gmail.com','googlemail.com','outlook.com','hotmail.com','hotmail.co.uk','live.com','yahoo.com','yahoo.co.uk','icloud.com','aol.com','msn.com','btinternet.com','proton.me','protonmail.com','mail.com','gov.uk','org.uk','co.uk']);
const emailDomains=contact=>[...new Set(['email','email2','email3'].map(field=>normalise(contact[field]).split('@')[1]).filter(domain=>domain?.includes('.') && !sharedDomains.has(domain)))];
export function accountContactDomains(account) {
  let website='';
  if(account.website) {try {website=new URL(/^https?:\/\//i.test(account.website) ? account.website : `https://${account.website}`).hostname.toLowerCase().replace(/^www\./,'');}catch { /* Invalid websites are not matching evidence. */ }}
  return [...new Set([website,...emailDomains(account)].filter(domain=>domain?.includes('.') && !sharedDomains.has(domain)))];
}
export function accountContactQuery(account) {
  const clauses=[];
  if(account.company_number?.trim())clauses.push({company_number:{$regex:`^${escape(account.company_number.trim())}$`,$options:'i'}});
  for(const name of new Set([account.company_name,account.name].map(normalise).filter(Boolean)))clauses.push({company_name:{$regex:`^${escape(name)}$`,$options:'i'}});
  for(const domain of accountContactDomains(account))for(const field of ['email','email2','email3'])clauses.push({[field]:{$regex:`@${escape(domain)}$`,$options:'i'}});
  if(account.primary_contact_id){clauses.push({dataverse_id:account.primary_contact_id});if(/^[a-f0-9]{24}$/i.test(account.primary_contact_id))clauses.push({id:account.primary_contact_id});}
  return clauses.length ? {$or:clauses} : {company_number:'__no_recorded_account_identity__'};
}
export function contactAccountQuery(contacts) {
  const clauses=[],numbers=[...new Set(contacts.map(c=>normalise(c.company_number)).filter(Boolean))],names=[...new Set(contacts.map(c=>normalise(c.company_name)).filter(Boolean))],domains=[...new Set(contacts.flatMap(emailDomains))],ids=[...new Set(contacts.flatMap(c=>[c.id,c.dataverse_id]).filter(Boolean))];
  if(numbers.length)clauses.push({company_number:{$regex:`^(?:${numbers.map(escape).join('|')})$`,$options:'i'}});
  if(names.length)for(const field of ['name','company_name'])clauses.push({[field]:{$regex:`^(?:${names.map(escape).join('|')})$`,$options:'i'}});
  if(ids.length)clauses.push({primary_contact_id:{$in:ids}});
  if(domains.length){const pattern=domains.map(escape).join('|');clauses.push({email:{$regex:`@(?:${pattern})$`,$options:'i'}},{website:{$regex:`^(?:https?://)?(?:www\\.)?(?:${pattern})(?:[/:?#]|$)`,$options:'i'}});}
  return clauses.length ? {$or:clauses} : {id:{$in:[]}};
}
export function resolveContactAccount(accounts,contact) {
  const domains=emailDomains(contact),tests=[a=>a.primary_contact_id && [contact.id,contact.dataverse_id].includes(a.primary_contact_id),a=>normalise(contact.company_number) && normalise(a.company_number)===normalise(contact.company_number),a=>normalise(contact.company_name) && [a.name,a.company_name].some(name=>normalise(name)===normalise(contact.company_name)),a=>accountContactDomains(a).some(domain=>domains.includes(domain))];
  for(const test of tests){const matches=accounts.filter(test);if(matches.length)return matches.length===1 ? matches[0] : null;}
  return null;
}