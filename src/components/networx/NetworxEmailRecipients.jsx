import React, { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/lib/AuthContext';
import { Input } from '@/components/ui/input';
import networxEmailClient from '@/components/networx/networxEmailClient';
const key = row=>`${row.entity}:${row.id}`;
export default function NetworxEmailRecipients({entity,recordId,initial}) {
  const {user} = useAuth();
  const [search,setSearch] = useState(''), [term,setTerm] = useState(''), [selected,setSelected] = useState(null);
  useEffect(()=>{const timer=setTimeout(()=>setTerm(search.trim()),250);return ()=>clearTimeout(timer);},[search]);
  const query = useQuery({queryKey:['networx-recipients',user?.id,entity,recordId,term],queryFn:()=>networxEmailClient({action:'recipients',entity,recordId,search:term}),enabled:term.length>=2,retry:false,gcTime:0,refetchOnWindowFocus:false});
  const choices = term.length>=2 ? query.data?.recipients || [] : initial;
  const rows = selected && !choices.some(row=>key(row)===key(selected)) ? [selected,...choices] : choices;
  return <div className="space-y-2">
    <label htmlFor="networx-email-recipient" className="block text-sm font-medium">To</label>
    <Input aria-label="Search all Dataverse contacts" placeholder="Search all Dataverse contacts by name or email" maxLength={80} value={search} onChange={event=>setSearch(event.target.value)}/>
    {query.isFetching && <p role="status" className="text-xs text-muted-foreground">Searching Dataverse contacts…</p>}
    {query.error && <p role="alert" className="text-xs text-destructive">{query.error.message}</p>}
    <select id="networx-email-recipient" name="recipient" required value={selected ? key(selected) : ''} onChange={event=>setSelected(rows.find(row=>key(row)===event.target.value) || null)} className="h-10 w-full rounded-md border border-input bg-card px-3 text-sm text-foreground"><option value="">Choose a Dataverse recipient</option>{rows.map(row=><option key={key(row)} value={key(row)}>{row.name} · {row.address}{row.linked ? ' · Linked to this relationship' : ''}</option>)}</select>
    <p className="text-xs text-muted-foreground">Search all contacts accessible through your Dataverse account. Linked contacts appear first, followed by other matches, up to 20 contacts. The email stays linked to this relationship.{term.length>=2 && !query.isFetching && !query.error && !choices.length && ' No matching contacts with an active email address were found.'}</p>
  </div>;
}