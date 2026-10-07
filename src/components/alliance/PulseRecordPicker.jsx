import React,{useEffect,useState} from 'react';
import {useQuery} from '@tanstack/react-query';
import {useAuth} from '@/lib/AuthContext';
import {base44} from '@/api/base44Client';
import {Input} from '@/components/ui/input';
import allianceRequest,{allianceError} from '@/components/alliance/allianceClient';
export default function PulseRecordPicker({kind,value,onChange}) {
  const {user}=useAuth(),[search,setSearch]=useState(''),[term,setTerm]=useState('');
  useEffect(()=>{const timer=setTimeout(()=>setTerm(search),300);return()=>clearTimeout(timer);},[search]);
  const query=useQuery({queryKey:['alliance-layer','record-picker',user?.id,user?.role,kind,term],queryFn:async()=>{if(kind==='lesson') return (await allianceRequest('lessons',{search:term})).items.map(l=>({id:l.id,name:`${l.project_name}: ${l.what_happened.slice(0,80)}`}));const field=kind==='person' ? 'full_name' : 'name';const filter={status:{$ne:'inactive'},...(term ? {[field]:{$regex:term.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'),$options:'i'}} : {})};const page=await base44.entities[kind==='person' ? 'Contact' : 'Project'].filter(filter,{sort:field,limit:20,fields:[field]});return page.items.map(r=>({id:r.id,name:r[field]}));},staleTime:60000});
  return <div className="space-y-2"><Input aria-label="Search linked records" value={search} maxLength={80} placeholder={`Search ${kind} records`} onChange={e=>{setSearch(e.target.value);onChange('');}}/>{query.isPending ? <p role="status" className="text-xs text-muted-foreground">Loading records…</p> : query.error ? <p role="alert" className="text-xs text-destructive">{allianceError(query.error)}</p> : <select aria-label="Linked record" required className="w-full rounded-md border border-input bg-card p-2 text-sm" value={value} onChange={e=>onChange(e.target.value)}><option value="">Select an accessible record</option>{query.data.map(r=><option key={r.id} value={r.id}>{r.name}</option>)}</select>}<p className="text-[11px] text-muted-foreground">Search narrows the records you are authorised to access.</p></div>;
}