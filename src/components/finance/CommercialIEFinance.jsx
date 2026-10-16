import React,{useEffect} from 'react';
import {Link} from 'react-router-dom';
import {useQuery,useQueryClient} from '@tanstack/react-query';
import {base44} from '@/api/base44Client';
import {useAuth} from '@/lib/AuthContext';
import {ieCall,IE_ROLES} from '@/components/ie/ieClient';
import {IE_FINANCE_GROUPS} from '@/components/ie/ieFinanceFields';
import {ieMoney} from '@/components/ie/ieWorkConfig';
import formatOverviewNumber from '@/components/dashboard/formatOverviewNumber';
import useCommercialScope from '@/components/finance/useCommercialScope';
import {Button} from '@/components/ui/button';
export default function CommercialIEFinance(){
 const {user}=useAuth(),scope=useCommercialScope(),cache=useQueryClient(),enabled=IE_ROLES.includes(user?.role);
 const query=useQuery({queryKey:['ie-commercial-finance',scope],enabled,queryFn:()=>ieCall('commercialFinance'),staleTime:60000,retry:false});
 useEffect(()=>{
  if(!enabled)return;
  const refresh=()=>cache.invalidateQueries({queryKey:['ie-commercial-finance']});
  const stopEngagements=base44.entities.IEEngagement.subscribe(refresh),stopFinance=base44.entities.IEFinance.subscribe(refresh);
  return ()=>{stopEngagements();stopFinance();};
 },[enabled,scope,cache]);
 if(!enabled)return null;
 const data=query.data;
 return <section className="finance-card finance-section" aria-label="I&E commercial values"><header className="flex flex-wrap items-center justify-between gap-3"><div><h2>Insights &amp; Engagement</h2><p className="mt-2 text-sm text-muted-foreground">I&E service values and fee types, kept separate from construction figures.</p></div><Link to="/insights-engagement" className="text-sm font-semibold underline">Open I&amp;E workspace</Link></header>
 {query.isPending?<p role="status" className="mt-5 text-sm">Loading I&amp;E finance…</p>:query.error?<div role="alert" className="mt-5 space-y-3"><p className="text-sm text-destructive">{query.error.message}</p><Button variant="outline" onClick={()=>query.refetch()}>Try again</Button></div>:<>
 <dl className="mt-6 grid gap-4 sm:grid-cols-3">{[['I&E service value',data.headlines.serviceValue,true],['I&E projects',data.headlines.total,false],['Projects with finance',data.recorded,false]].map(([label,value,currency])=><div key={label} className="rounded-lg border border-border bg-secondary/40 p-4"><dt className="text-xs text-muted-foreground">{label}</dt><dd className="mt-2 text-2xl font-bold tabular-nums" title={currency?ieMoney(value):String(value)}>{value==null?'Not recorded':formatOverviewNumber(value,currency)}</dd></div>)}</dl>
 {!data.recorded&&<p className="mt-5 text-sm text-muted-foreground">No detailed finance recorded yet. Open an I&amp;E project’s Finance tab to record its fees and costs.</p>}
 <div className="mt-6 grid gap-6 lg:grid-cols-2">{IE_FINANCE_GROUPS.map(group=><section key={group.title} className="overflow-hidden rounded-lg border border-border"><h3 className="bg-als-navy px-4 py-3 text-sm font-bold text-sidebar-foreground">{group.title}</h3><dl className="divide-y divide-border">{group.fields.filter(([key])=>key!=='engagement_value').map(([key,label])=><div key={key} className="flex items-start justify-between gap-4 px-4 py-3 text-sm"><dt>{label}</dt><dd className="shrink-0 font-semibold tabular-nums" title={ieMoney(data.totals[key])}>{data.totals[key]==null?'Not recorded':formatOverviewNumber(data.totals[key],true)}</dd></div>)}</dl></section>)}</div>
 <p className="mt-5 text-xs leading-6 text-muted-foreground">GBP excluding VAT, across all accessible I&amp;E projects and statuses, independent of construction filters. Service value uses workbook Value, replaced by saved engagement value when recorded. Fee and cost totals use imported or saved project finance; blank amounts contribute £0. FOC, fee values and costs are separate measures, not additive income. ALS cost is a recorded total, not an additional component cost.</p>
 </>}
 <div className="mt-6 border-t border-border pt-4"><h3 className="text-sm font-bold">I&amp;E invoices — Coming soon</h3><p className="mt-2 text-xs text-muted-foreground">Invoice mapping is being reviewed. I&amp;E invoiced payment is a recorded total, not a connected invoice ledger.</p></div></section>;
}