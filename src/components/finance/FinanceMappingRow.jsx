import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { financeCall } from '@/components/finance/financeClient';
export default function FinanceMappingRow({mapping,onSaved}){
 const [search,setSearch]=useState(''),[selected,setSelected]=useState(''),[busy,setBusy]=useState(false),[error,setError]=useState('');
 const q=useQuery({queryKey:['finance-project-search',search],queryFn:()=>financeCall({action:'projects',search}),enabled:search.trim().length>=2,staleTime:60000});
 const choices=search.trim().length>=2?(q.data?.items||[]):mapping.candidates||[];
 async function save(){setBusy(true);setError('');try{await financeCall({action:'map',sourceKey:mapping.source_key,projectId:selected});onSaved();}catch(e){setError(e.message);}finally{setBusy(false);}}
 return <div className="grid gap-3 border-b border-border p-4 lg:grid-cols-[1fr_1fr_auto]"><div><p className="font-semibold">{mapping.source_name||'Name missing'}</p><p className="text-sm text-muted-foreground">Source code: {mapping.source_code||'Not supplied'} · {mapping.status}</p>{mapping.project_name&&<p className="text-sm">Linked: {mapping.project_name} ({mapping.project_code})</p>}</div><div className="space-y-2"><Input aria-label={`Find project for ${mapping.source_name}`} placeholder="Search project name or code…" value={search} onChange={e=>{setSearch(e.target.value);setSelected('');}}/><select aria-label="Choose project" className="w-full rounded-md border border-input bg-card p-2 text-sm" value={selected} onChange={e=>setSelected(e.target.value)}><option value="">Choose a project</option>{choices.map(p=><option key={p.id} value={p.id}>{p.name} · {p.project_number||'No code'}</option>)}</select>{q.isFetching&&<p className="text-xs text-muted-foreground">Finding projects…</p>}{q.error&&<p className="text-xs text-destructive">{q.error.message}</p>}</div><div><Button disabled={!selected||busy} onClick={save}>{busy?'Saving…':'Save link'}</Button>{error&&<p role="alert" className="mt-2 text-sm text-destructive">{error}</p>}</div></div>;
}