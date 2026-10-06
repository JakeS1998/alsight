import {accountContactDomains} from '@/components/accounts/accountContactQuery';
const escape=value=>String(value || '').replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
const normalise=value=>String(value || '').trim().toLowerCase();
const emailDomains=contact=>accountContactDomains({email:contact.email}).concat(accountContactDomains({email:contact.email2}),accountContactDomains({email:contact.email3}));
export default function contactAccountQuery(contact) {
  const clauses=[],domains=[...new Set(emailDomains(contact))],ids=[contact.id,contact.dataverse_id].filter(Boolean);
  if(contact.company_number?.trim())clauses.push({company_number:{$regex:`^${escape(contact.company_number.trim())}$`,$options:'i'}});
  if(contact.company_name?.trim())for(const field of ['name','company_name'])clauses.push({[field]:{$regex:`^${escape(contact.company_name.trim())}$`,$options:'i'}});
  if(ids.length)clauses.push({primary_contact_id:{$in:ids}});
  if(domains.length){const pattern=domains.map(escape).join('|');clauses.push({email:{$regex:`@(?:${pattern})$`,$options:'i'}},{website:{$regex:`^(?:https?://)?(?:www\\.)?(?:${pattern})(?:[/:?#]|$)`,$options:'i'}});}
  return clauses.length ? {$or:clauses} : {id:{$in:[]}};
}
export function resolveContactAccount(accounts,contact) {
  const domains=emailDomains(contact),tests=[a=>a.primary_contact_id && [contact.id,contact.dataverse_id].includes(a.primary_contact_id),a=>normalise(contact.company_number) && normalise(a.company_number)===normalise(contact.company_number),a=>normalise(contact.company_name) && [a.name,a.company_name].some(name=>normalise(name)===normalise(contact.company_name)),a=>accountContactDomains(a).some(domain=>domains.includes(domain))];
  for(const test of tests){const matches=accounts.filter(test);if(matches.length)return matches.length===1 ? matches[0] : null;}
  return null;
}