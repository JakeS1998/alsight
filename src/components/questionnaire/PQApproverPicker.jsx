import React,{useState} from 'react';
import {useQuery} from '@tanstack/react-query';
import {base44} from '@/api/base44Client';
import {Button} from '@/components/ui/button';
export default function PQApproverPicker({projectId,onSelect,disabled,excluded}) {
 const [search,setSearch]=useState(''),[term,setTerm]=useState('');
 const query=useQuery({queryKey:['pq-approvers',projectId,term],enabled:term.length>=2,retry:false,queryFn:async()=>{const {data}=await base44.functions.invoke('manageProjectQuestionnaire',{action:'recipients',projectId,search:term});return data.items;}});
 return <div className="space-y-2"><label className="block text-sm font-medium" htmlFor="pq-approver-search">Find a registered approver</label><div className="flex gap-2"><input id="pq-approver-search" className="min-w-0 flex-1 rounded-md border border-input bg-background p-2 text-sm" value={search} maxLength={80} placeholder="Name or email" disabled={disabled} onChange={event=>setSearch(event.target.value)}/><Button type="button" variant="outline" disabled={disabled||search.trim().length<2} onClick={()=>setTerm(search.trim())}>Search</Button></div>
 {query.isFetching&&<p role="status" className="text-sm">Finding approvers…</p>}{query.error&&<p role="alert" className="text-sm text-destructive">{query.error.response?.data?.error||query.error.message}</p>}
 {query.data&&<ul className="max-h-48 overflow-auto rounded-md border border-border">{query.data.length?query.data.map(person=><li key={person.id}><button type="button" disabled={disabled||excluded.includes(person.id)} onClick={()=>{onSelect(person);setSearch('');setTerm('');}} className="w-full p-3 text-left text-sm hover:bg-muted disabled:opacity-50">{person.name}<span className="block text-xs text-muted-foreground">{person.email}{excluded.includes(person.id)?' · Already selected':''}</span></button></li>):<li className="p-3 text-sm text-muted-foreground">No matching internal app users.</li>}</ul>}</div>;
}