import React,{useState} from 'react';
import {useQueryClient} from '@tanstack/react-query';
import useFrameworkPathwayKpis from '@/components/framework/useFrameworkPathwayKpis';
import UKLFKPIEditor from '@/components/framework/UKLFKPIEditor';
import FrameworkKpiValues from '@/components/framework/FrameworkKpiValues';
export default function FrameworkPathwayKpis({project}) {
 const query=useFrameworkPathwayKpis(project),cache=useQueryClient(),[editing,setEditing]=useState(false);
 if(project.procurement_route===false)return null;
 const report=query.data?.report;
 return <section className="mt-5 space-y-3 rounded-lg border border-border bg-card p-4"><h3 className="font-semibold">UKLF KPIs · required before stage 10 is complete</h3>{query.isPending ? <p role="status">Loading UKLF KPIs…</p> : query.error ? <p role="alert">Unable to check KPIs. <button className="underline" onClick={()=>query.refetch()}>Try again</button></p> : !report ? <p>A linked UKLF record is required. Create or link it in Framework reporting before closing this project.</p> : <><p className="text-sm text-muted-foreground">{query.complete ? 'All required UKLF KPIs are recorded.' : 'Stage 10 remains incomplete until all UKLF KPIs are recorded.'}</p>{!query.complete && <p className="text-xs text-muted-foreground">Missing: {query.data.kpiCompletion?.missing?.join(', ')}</p>}<button type="button" className="rounded-md border border-input px-3 py-2 text-sm" onClick={()=>setEditing(value=>!value)}>{editing ? 'Hide KPI editor' : 'Complete UKLF KPIs'}</button>{editing ? <UKLFKPIEditor report={report} defaults={query.data.defaults} onCancel={()=>setEditing(false)} onSaved={()=>{setEditing(false);cache.invalidateQueries({queryKey:['framework-pathway-kpis']});}}/> : <FrameworkKpiValues report={report}/>}</>}</section>;
}