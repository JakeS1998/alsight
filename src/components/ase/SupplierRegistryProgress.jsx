import React from 'react';
import {useQuery} from '@tanstack/react-query';
import {Link} from 'react-router-dom';
import {base44} from '@/api/base44Client';
import organisationQueryPolicy from '@/components/data/organisationQueryPolicy';
export default function SupplierRegistryProgress() {
  const query=useQuery({queryKey:['supplier-registry-progress'],queryFn:async()=>{const page=await base44.entities.SupplierRegistryRun.filter({},{sort:'-created_date',limit:1});return page.items[0] || null;},refetchInterval:state=>state.state.data?.status==='running' ? 60000 : false,...organisationQueryPolicy});
  const run=query.data;
  if(query.isPending) return <p role="status" className="text-xs text-muted-foreground">Checking supplier refresh progress…</p>;
  if(query.error) return <p role="alert" className="text-xs text-destructive">Supplier refresh progress could not be loaded. <button className="underline" onClick={()=>query.refetch()}>Try again</button></p>;
  if(!run) return null;
  const phases={registry:'Company details',accounts:'Turnover and filed accounts',structure:'Corporate structure',linkage:'Matching shared PSCs across ALSight'};
  return <section className="rounded-xl border border-border bg-card p-5"><h3 className="font-semibold">Supplier Companies House refresh</h3><p className="mt-2 text-sm">{run.status==='completed' ? 'Complete' : 'Running in the background'} · {run.processed_count || 0} of {run.eligible_count} suppliers processed.</p>{run.status==='running' && <p className="mt-2 text-xs text-muted-foreground">Current stage: {phases[run.phase]}. You can close this page; progress is saved between requests.</p>}<p className="mt-2 text-xs text-muted-foreground">{run.failed_count || 0} source checks failed. Missing or undisclosed turnover remains unavailable; this refresh does not publish or change All Seeing Eye ratings.</p>{run.errors?.length>0 && <details className="mt-3 text-xs"><summary className="cursor-pointer">Recent failed checks</summary><ul className="mt-2 space-y-2">{run.errors.map((error,index)=><li key={index}>{error.account_id ? <Link className="font-semibold underline" to={`/accounts/${error.account_id}`}>{error.name}</Link> : error.name} · {phases[error.phase]}: {error.message}</li>)}</ul></details>}</section>;
}