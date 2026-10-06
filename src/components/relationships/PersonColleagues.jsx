import React from 'react';
import {useQuery} from '@tanstack/react-query';
import {Link} from 'react-router-dom';
import {base44} from '@/api/base44Client';
import accountContactQuery from '@/components/accounts/accountContactQuery';
export default function PersonColleagues({account,contactId}) {
  const query=useQuery({queryKey:['person-colleagues',account?.id,contactId],enabled:!!account,queryFn:()=>base44.entities.Contact.filter({...accountContactQuery(account),id:{$ne:contactId}},{sort:'full_name',limit:6,fields:['full_name','job_title','officer_role']})});
  if(!account) return null;
  return <section className="rounded-xl border border-border bg-card p-5"><h2 className="text-sm font-semibold">Other People at {account.name}</h2>{query.isPending ? <p className="mt-3 text-xs text-muted-foreground">Loading colleagues…</p> : query.error ? <p role="alert" className="mt-3 text-xs text-destructive">Colleagues could not be loaded.</p> : !query.data.items.length ? <p className="mt-3 text-xs text-muted-foreground">No other linked people are recorded yet.</p> : <ul className="mt-3 space-y-3">{query.data.items.map(p=><li key={p.id}><Link className="text-sm font-medium hover:text-primary" to={`/people/${p.id}`}>{p.full_name}</Link><p className="text-xs text-muted-foreground">{p.job_title || p.officer_role || 'Role not recorded'}</p></li>)}</ul>}</section>;
}