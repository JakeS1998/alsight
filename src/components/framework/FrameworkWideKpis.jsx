import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { Button } from '@/components/ui/button';
import { formatDate } from '@/lib/portal';
import { YES_NO_FIELDS } from '@/components/framework/frameworkKpiFields';
import FrameworkWideKpiForm from '@/components/framework/FrameworkWideKpiForm';
export default function FrameworkWideKpis() {
 const {user}=useAuth(),[editing,setEditing]=useState(false);
 const query=useQuery({queryKey:['framework-wide-kpis',user?.id,user?.role],enabled:!!user?.id,queryFn:async()=>{const page=await base44.entities.FrameworkWideKpi.filter({key:'primary'},{limit:1});return page.items[0] || null;},retry:false});
 const record=query.data;
 return <section className="space-y-4 rounded-panel border border-border bg-card p-4 sm:p-5"><div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="font-semibold">Framework-wide KPIs · owner: ALS</h2><p className="mt-1 text-xs text-muted-foreground">One review for the whole Framework, separate from project outcomes and stage 10 completion.</p></div>{user?.role==='admin' && record && !editing && <Button variant="outline" size="sm" onClick={()=>setEditing(true)}>Edit framework-wide KPIs</Button>}</div>
 {query.isPending ? <p role="status" className="text-sm text-muted-foreground">Loading framework-wide KPIs…</p> : query.error ? <p role="alert" className="text-sm text-destructive">Unable to load the Framework review. <button className="underline" onClick={()=>query.refetch()}>Try again</button></p> : !record ? <p className="text-sm text-muted-foreground">No framework-wide review is available.</p> : editing && user?.role==='admin' ? <FrameworkWideKpiForm record={record} onClose={()=>setEditing(false)}/> : <><dl className="grid gap-4 md:grid-cols-2">{YES_NO_FIELDS.map(([key,label])=><div key={key}><dt className="text-sm text-muted-foreground">{label}</dt><dd className="mt-1 text-sm font-medium">{record[key]==='Y' ? 'Yes' : record[key]==='N' ? 'No' : 'Not recorded'}</dd></div>)}</dl><div className="text-sm"><span className="text-muted-foreground">Framework-wide review date: </span>{record.high_level_review_date ? formatDate(record.high_level_review_date) : 'Not recorded'}</div><div><h3 className="text-sm text-muted-foreground">Evidence / review reference</h3><p className="mt-1 whitespace-pre-wrap text-sm">{record.high_level_evidence || 'Not recorded'}</p></div></>}
 </section>;
}