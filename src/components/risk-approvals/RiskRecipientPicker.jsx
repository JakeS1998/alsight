import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
export default function RiskRecipientPicker({ projectId, value, onChange, disabled }) {
  const [search, setSearch] = useState('');
  const [term, setTerm] = useState('');
  const query = useQuery({ queryKey: ['risk-approval-recipients', projectId, term], enabled: term.length >= 2, queryFn: async () => (await base44.functions.invoke('manageRiskApprovals', { action: 'recipients', project_id: projectId, search: term })).data.items });
  return <div className="min-w-0 space-y-2">
    {value ? <div className="flex items-center justify-between gap-2 rounded-md border bg-background p-2 text-sm"><span className="min-w-0 break-words">{value.name}<span className="block text-xs text-muted-foreground">{value.email}</span></span><Button type="button" variant="ghost" size="sm" disabled={disabled} onClick={() => { onChange(null); setTerm(''); setSearch(''); }}>Change</Button></div> : <>
      <div className="flex gap-2"><Input aria-label="Find registered recipient" value={search} maxLength={100} disabled={disabled} placeholder="Registered name or email" onChange={event => setSearch(event.target.value)} /><Button type="button" variant="outline" disabled={disabled || search.trim().length < 2} onClick={() => setTerm(search.trim())}>Search</Button></div>
      {query.isFetching && <p role="status" className="text-xs text-muted-foreground">Finding registered recipients…</p>}
      {query.error && <p role="alert" className="text-xs text-destructive">Unable to find recipients.</p>}
      {query.data && !query.data.length && <p className="text-xs text-muted-foreground">No registered recipients found.</p>}
      {!!query.data?.length && <ul className="max-h-44 overflow-y-auto rounded-md border bg-card">{query.data.map(person => <li key={person.id}><button type="button" disabled={disabled} className="w-full p-2 text-left text-sm hover:bg-muted" onClick={() => onChange(person)}>{person.name}<span className="block text-xs text-muted-foreground">{person.email}</span></button></li>)}</ul>}
    </>}
  </div>;
}