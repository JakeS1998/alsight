import React from 'react';
import {Link} from 'react-router-dom';
import {useQuery} from '@tanstack/react-query';
import {base44} from '@/api/base44Client';
import accountContactQuery from '@/components/accounts/accountContactQuery';
export default function AccountKeyPeople({account}) {
  const query={$and:[accountContactQuery(account),{$or:[{system_managed:{$ne:true}},...['email','email2','email3'].map(field=>({[field]:{$regex:'\\S'}}))]}]};
  const people=useQuery({queryKey:['account-key-people',account.id,query],queryFn:()=>base44.entities.Contact.filter(query,{sort:'full_name',limit:5,fields:['full_name','job_title','officer_role','email','email2','email3','phone','mobile_phone']})});
  if (!people.isPending && !people.error && !people.data.items.length) return null;
  return <section className="account-panel"><h2>Key People</h2>{people.isPending ? <p role="status" className="text-sm text-muted-foreground">Loading key people…</p> : people.error ? <p role="alert" className="text-sm text-destructive">Key people could not be loaded.</p> : !people.data.items.length ? <p className="text-sm text-muted-foreground">No linked business contacts are recorded.</p> : <div className="account-people">{people.data.items.map(contact=>{
    const email=[contact.email,contact.email2,contact.email3].find(value=>value?.trim())?.trim();
    return <div key={contact.id} className="account-person-row"><span className="account-person-avatar" aria-hidden="true">{contact.full_name?.split(/\s+/).filter(Boolean).slice(0,2).map(word=>word[0]).join('')}</span><div className="min-w-0"><Link to={`/accounts/${account.id}/contacts/${contact.id}`} className="hover:underline">{contact.full_name}</Link><p>{contact.job_title || contact.officer_role || 'Role not recorded'}</p>{email && <a className="block break-all text-xs text-muted-foreground" href={`mailto:${email}`}>{email}</a>}{(contact.phone || contact.mobile_phone) && <a className="block text-xs text-muted-foreground" href={`tel:${contact.phone || contact.mobile_phone}`}>{contact.phone || contact.mobile_phone}</a>}</div></div>;
  })}</div>}</section>;
}