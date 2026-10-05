import React from 'react';
import {Link} from 'react-router-dom';
import {useQuery} from '@tanstack/react-query';
import {base44} from '@/api/base44Client';
import accountContactQuery from '@/components/accounts/accountContactQuery';
export default function AccountKeyPeople({account}) {
  const query={$and:[accountContactQuery(account),{$or:['email','email2','email3'].map(field=>({[field]:{$regex:'\\S'}}))}]};
  const people=useQuery({queryKey:['account-key-people',account.id,query],queryFn:()=>base44.entities.Contact.filter(query,{sort:'full_name',limit:5,fields:['full_name','job_title','officer_role','email','email2','email3']})});
  return <section className="account-panel"><h2>Key People</h2>{people.isPending ? <p role="status" className="text-sm text-muted-foreground">Loading key people…</p> : people.error ? <p role="alert" className="text-sm text-destructive">Key people could not be loaded.</p> : !people.data.items.length ? <p className="text-sm text-muted-foreground">No linked contacts with an email address are recorded.</p> : <div className="account-people">{people.data.items.map(contact=>{
    const email=[contact.email,contact.email2,contact.email3].find(value=>value?.trim())?.trim();
    return <div key={contact.id}><Link to={`/accounts/${account.id}/contacts/${contact.id}`} className="hover:underline">{contact.full_name}</Link><p>{contact.job_title || contact.officer_role || 'Role not recorded'}</p><a className="text-xs text-muted-foreground" href={`mailto:${email}`}>{email}</a></div>;
  })}</div>}</section>;
}