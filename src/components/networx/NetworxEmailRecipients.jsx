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
  const query = useQuery({queryKey:['networx-recipients',user?.id,entity,recordId,term],queryFn:()=>networxEmailClient({action:'recipients',entity,recordId,search:term}),enabled:entity==='account' && term.length>=2,retry:false,gcTime:0,refetchOnWindowFocus:false});
  const choices = term.length>=2 ? query.data?.recipients || [] : initial;
  const rows = selected && !choices.some(row=>key(row)===key(selected)) ? [selected,...choices] : choices;
  return <div className="space-y-2">
    <label htmlFor="networx-email-recipient" className="block text-sm font-medium">To</label>
    {entity==='account' && <Input aria-label="Search linked Dataverse contacts" placeholder="Find a linked contact by name or email" maxLength={80} value={search} onChange={event=>setSearch(event.target.value)}/>}
    {query.isFetching && <p role="status" className="text-xs text-muted-foreground">Searching linked contacts…</p>}
    {query.error && <p role="alert" className="text-xs text-destructive">{query.error.message}</p>}
    <select id="networx-email-recipient" name="recipient" required value={selected ? key(selected) : ''} onChange={event=>setSelected(rows.find(row=>key(row)===event.target.value) || null)} className="h-10 w-full rounded-md border border-input bg-card px-3 text-sm text-foreground"><option value="">Choose a Dataverse recipient</option>{rows.map(row=><option key={key(row)} value={key(row)}>{row.name} · {row.address}</option>)}</select>
    <p className="text-xs text-muted-foreground">{entity==='account' ? 'Choose the organisation’s email or a linked contact. Search returns up to 20 matching contacts.' : 'Emails stay linked to this person.'}{!initial.length && ' No email address is recorded yet; add one in Dataverse first.'}</p>
  </div>;
}