import React from 'react';
import {useQuery} from '@tanstack/react-query';
import {base44} from '@/api/base44Client';
import organisationQueryPolicy from '@/components/data/organisationQueryPolicy';
export default function CompanyNameLookupProgress() {
  const query=useQuery({queryKey:['company-name-lookup-progress'],queryFn:async()=>{const page=await base44.entities.CompanyNameLookupRun.filter({},{sort:'-created_date',limit:1}),run=page.items[0];if(!run) return null;const totals=await base44.entities.CompanyNameLookupResult.aggregate({query:{run_id:run.id},groupBy:'outcome',limit:10});return {run,totals:totals.rows};},refetchInterval:state=>state.state.data?.run.status==='running' ? 60000 : false,...organisationQueryPolicy});
  if(query.isPending) return <p role="status" className="text-xs text-muted-foreground">Checking company name lookup progress…</p>;
  if(query.error) return <p role="alert" className="text-xs text-destructive">Company name lookup progress is unavailable. <button className="underline" onClick={()=>query.refetch()}>Try again</button></p>;
  if(!query.data) return null;
  const {run,totals}=query.data,count=outcome=>totals.find(row=>row.outcome===outcome)?.count || 0;
  return <section className="rounded-xl border border-border bg-card p-5"><h3 className="font-semibold">Companies House · missing company numbers</h3><p className="mt-2 text-sm">{run.status==='running' ? 'Exact-name search running in the background' : 'Exact-name search complete'} · {run.eligible_count} profiles in the original search.</p><p className="mt-2 text-xs text-muted-foreground">{count('matched')} numbers added · {count('no_match')} without an exact match · {count('ambiguous')} ambiguous · {count('failed')} failed · {count('skipped')} skipped.</p><p className="mt-2 text-xs text-muted-foreground">Only a unique current registered-name match is saved, ignoring case and repeated whitespace. Similar names and duplicate exact matches are left unchanged; existing company numbers are never overwritten.</p></section>;
}