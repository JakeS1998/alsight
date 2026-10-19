import React,{useEffect,useState} from 'react';
import {useQuery} from '@tanstack/react-query';
import {base44} from '@/api/base44Client';
import searchRecords from '@/components/search/searchRecords';
import SearchableSelect from '@/components/forms/SearchableSelect';
export default function PortalOrganisationSelect({value,onChange,role}){
 const [search,setSearch]=useState(''),[term,setTerm]=useState('');
 useEffect(()=>{const timer=setTimeout(()=>setTerm(search.trim()),300);return()=>clearTimeout(timer);},[search]);
 const query=useQuery({queryKey:['portal-organisation-options',role,term],queryFn:()=>searchRecords(base44.entities.Account,{...(role==='client' || role==='supplier' ? {account_type:role} : {}),dataverse_id:{$regex:'\\S'}},['name'],term,{sort:'name',limit:50,fields:['name','dataverse_id']})}),selected=useQuery({queryKey:['portal-selected-organisation',value],enabled:!!value,queryFn:()=>base44.entities.Account.filter({dataverse_id:value},{limit:1,fields:['name','dataverse_id']})});
 const rows=query.data?.items || [],current=selected.data?.items[0];
 return <div className="space-y-2"><input aria-label="Search organisations for portal access" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search organisations…" className="w-full rounded-lg border border-input bg-background p-2 text-sm"/><SearchableSelect externalSearch searchTerm={term} aria-label="Organisation access" value={value || ''} onChange={e=>onChange(e.target.value)} className="w-full rounded-lg border border-input bg-background p-2 text-sm"><option value="">Select organisation</option>{current && !rows.some(a=>a.dataverse_id===value) && <option value={value}>{current.name}</option>}{rows.map(a=><option key={a.id} value={a.dataverse_id}>{a.name}</option>)}</SearchableSelect>{query.data?.has_more && <p className="text-xs text-muted-foreground">Refine the search to find other organisations.</p>}{query.error && <p role="alert" className="text-xs text-destructive">Organisation choices could not be loaded.</p>}</div>;
}