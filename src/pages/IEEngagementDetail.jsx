import React,{useState} from 'react';
import {Link,useParams} from 'react-router-dom';
import {useQuery} from '@tanstack/react-query';
import {useAuth} from '@/lib/AuthContext';
import {ieCall,IE_STATUSES} from '@/components/ie/ieClient';
import {Button} from '@/components/ui/button';
import {StatusBadge} from '@/components/StatusBadge';
import IEQueryState from '@/components/ie/IEQueryState';
import IEOverview from '@/components/ie/IEOverview';
import IERecentChanges from '@/components/ie/IERecentChanges';
import IEEngagementForm from '@/components/ie/IEEngagementForm';
export default function IEEngagementDetail(){const {engagementId}=useParams(),{user}=useAuth(),[editing,setEditing]=useState(false);const query=useQuery({queryKey:['ie-detail',engagementId,user.id,user.role],queryFn:()=>ieCall('detail',{id:engagementId}),retry:false});const item=query.data?.item;return <IEQueryState query={query}>{item&&<div className="space-y-5"><Link to="/insights-engagement" className="text-sm font-semibold hover:underline">Back to I &amp; E</Link><header className="rounded-hero border border-border bg-card p-6"><div className="flex flex-wrap items-start justify-between gap-3"><div className="min-w-0"><p className="break-all text-xs text-muted-foreground">{item.reference}</p><h1 className="mt-2 font-heading text-2xl font-bold">{item.name}</h1><p className="mt-2 text-sm text-muted-foreground">{item.client_name} · {item.owner_name}</p></div><div className="flex items-center gap-3"><StatusBadge status={item.status} map={IE_STATUSES}/>{query.data.canEdit&&<Button onClick={()=>setEditing(true)}>Edit engagement</Button>}</div></div></header><IEOverview data={query.data}/><IERecentChanges events={query.data.events}/>{editing&&<IEEngagementForm item={item} onClose={()=>setEditing(false)}/>}</div>}</IEQueryState>;}