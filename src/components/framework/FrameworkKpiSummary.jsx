import React,{useState} from 'react';
import {useQuery} from '@tanstack/react-query';
import {base44} from '@/api/base44Client';
import {useAuth} from '@/lib/AuthContext';
import organisationQueryPolicy from '@/components/data/organisationQueryPolicy';
import FrameworkKpiHeadlines from '@/components/framework/FrameworkKpiHeadlines';
import FrameworkKpiPeriodTable from '@/components/framework/FrameworkKpiPeriodTable';
export default function FrameworkKpiSummary() {
 const {user}=useAuth(),currentYear=new Date().getFullYear(),[year,setYear]=useState(currentYear);
 const query=useQuery({queryKey:['framework-kpi-summary',user?.id,user?.role,year],enabled:!!user?.id,...organisationQueryPolicy,staleTime:60000,retry:false,queryFn:async()=>{const {data}=await base44.functions.invoke('getStakeholderFrameworkReport',{workspaceAction:'kpiSummary',year});if(data.error)throw new Error(data.error);return data;}});
 return <section className="space-y-5 rounded-panel border border-border bg-card p-5 shadow-sm"><div className="flex flex-wrap items-center justify-between gap-3"><h2 className="text-lg font-semibold">Framework KPIs</h2><label className="text-sm">Calendar year <select value={year} onChange={e=>setYear(Number(e.target.value))} className="ml-2 rounded-md border border-input bg-background p-2">{Array.from({length:currentYear-2025},(_,index)=>2026+index).map(value=><option key={value}>{value}</option>)}</select></label></div>{query.isPending ? <p role="status" className="text-sm text-muted-foreground">Loading Framework KPI totals…</p> : query.error ? <p role="alert" className="text-sm text-destructive">Unable to load KPI totals. <button className="underline" onClick={()=>query.refetch()}>Try again</button></p> : <><FrameworkKpiHeadlines data={query.data}/><FrameworkKpiPeriodTable periods={query.data.periods}/></>}</section>;
}