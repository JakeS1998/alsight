import React,{useState,useEffect} from 'react';
import {useQuery} from '@tanstack/react-query';
import {base44} from '@/api/base44Client';
import {useAuth} from '@/lib/AuthContext';
import {INTERNAL_ROLES} from '@/lib/portal';
import FrameworkPulse from '@/components/framework/FrameworkPulse';
import FrameworkAttention from '@/components/framework/FrameworkAttention';
import FrameworkRecentActivity from '@/components/framework/FrameworkRecentActivity';
import FrameworkJourney from '@/components/framework/FrameworkJourney';
import FrameworkOutcomes from '@/components/framework/FrameworkOutcomes';
import FrameworkWorkspaceExplorer from '@/components/framework/FrameworkWorkspaceExplorer';
import FrameworkWorkspaceHeader from '@/components/framework/FrameworkWorkspaceHeader';
import organisationQueryPolicy from '@/components/data/organisationQueryPolicy';
export default function UKLFReports() {
 const {user}=useAuth(),allowed=INTERNAL_ROLES.includes(user?.role) || user?.role==='framework_stakeholder';
 const [search,setSearch]=useState(''),[term,setTerm]=useState(''),[filters,setFilters]=useState({}),[days,setDays]=useState(30);
 useEffect(()=>{const timer=setTimeout(()=>setTerm(search.trim()),400);return()=>clearTimeout(timer);},[search]);
 const query=useQuery({queryKey:['framework-workspace','summary',user?.id,user?.role,days,'fees'],enabled:allowed,queryFn:async()=>{const {data}=await base44.functions.invoke('getStakeholderFrameworkReport',{workspaceAction:'summary',days});if(data.error)throw new Error(data.error);return data;},...organisationQueryPolicy,staleTime:60000});
 const data=query.data || {};
 const attentionFilter=next=>{setSearch('');setTerm('');setFilters(next);requestAnimationFrame(()=>document.getElementById('framework-projects')?.scrollIntoView({behavior:'smooth',block:'start'}));};
 if(!allowed)return <p className="p-6 text-muted-foreground">Framework reporting is available to UKLF stakeholders and the internal team.</p>;
 return <div className="space-y-5"><FrameworkWorkspaceHeader/>{query.error && <p role="alert" className="rounded-panel border border-border bg-card p-4 text-sm text-destructive">Framework summary unavailable. <button className="underline" onClick={()=>query.refetch()}>Try again</button></p>}{query.isPending && <p role="status" className="text-sm text-muted-foreground">Loading Framework context…</p>}<div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-[1.25fr_1fr_1fr]"><FrameworkPulse data={data}/><FrameworkAttention data={data} onFilter={attentionFilter}/><FrameworkRecentActivity data={data} days={days} onDays={setDays}/></div><div className="grid gap-4 xl:grid-cols-[1.3fr_1fr]"><FrameworkJourney data={data} stage={filters.stage} onFilter={attentionFilter}/><FrameworkOutcomes data={data}/></div><FrameworkWorkspaceExplorer filters={filters} onFilter={setFilters} search={search} onSearch={setSearch} term={term} user={user}/></div>;
}