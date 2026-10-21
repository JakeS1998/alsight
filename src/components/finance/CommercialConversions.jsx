import React from 'react';
import {useQuery} from '@tanstack/react-query';
import {base44} from '@/api/base44Client';
import useCommercialScope from '@/components/finance/useCommercialScope';
import {Button} from '@/components/ui/button';
const reasons=['Budget','Political','Insurance','Planning','Cabinet','Community','Other'];
export default function CommercialConversions(){
 const scope=useCommercialScope(),q=useQuery({queryKey:['commercial-conversions',scope],queryFn:async()=>{const {data}=await base44.functions.invoke('manageProjectLifecycle',{action:'metrics'});if(data.error)throw new Error(data.error);return data;},staleTime:60000,retry:false});
 const d=q.data,percent=n=>n===null?'—':`${n.toFixed(1)}%`,ended=d?.reasons.reduce((sum,row)=>sum+row.count,0)||0;
 return <section className="finance-card finance-section" aria-label="Conversion KPIs"><h2>Conversion KPIs</h2><p className="finance-small mt-2">All-time results within your permitted portfolio. Completion uses actual practical completion dates, not inactive status.</p>{q.isPending&&<p role="status" className="mt-4">Loading conversion figures…</p>}{q.error&&<div className="mt-4"><p role="alert" className="text-destructive">{q.error.response?.data?.error||q.error.message}</p><Button variant="outline" onClick={()=>q.refetch()}>Try again</Button></div>}{d&&<><div className="mt-5 grid gap-4 md:grid-cols-3">{[
 ['Opportunity to project',percent(d.opportunityRate),`${d.convertedOpportunities} of ${d.totalOpportunities} visible opportunities have a linked project.`],
 ['Project to completion',percent(d.completionRate),`${d.completedProjects} of ${d.totalProjects} projects have an actual practical completion date on or before today.`],
 ['Projects ended',String(ended),'Confirmed End Project decisions, recorded from the introduction of ending-reason tracking.'],
 ].map(([label,value,note])=><div key={label} className="rounded-panel border border-border bg-muted p-5"><h3 className="text-sm font-semibold">{label}</h3><p className="my-2 text-3xl font-extrabold tabular-nums">{value}</p><p className="finance-small">{note}</p></div>)}</div><h3 className="mt-6 mb-3">Project ending reasons</h3>{ended===0?<p className="finance-muted">No confirmed project endings recorded yet. Historical inactive projects are not assigned guessed reasons.</p>:<div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{reasons.map(reason=>{const count=d.reasons.find(r=>r.reason===reason)?.count||0;return <div key={reason} className="rounded-panel border border-border p-4"><p className="text-sm font-semibold">{reason}</p><p className="mt-1 text-xl font-bold">{count} <span className="text-sm font-normal text-muted-foreground">({(count/ended*100).toFixed(1)}%)</span></p></div>;})}</div>}</>}</section>;
}