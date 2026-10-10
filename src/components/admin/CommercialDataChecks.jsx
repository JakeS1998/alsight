import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { financeCall } from '@/components/finance/financeClient';
import useCommercialScope from '@/components/finance/useCommercialScope';
export default function CommercialDataChecks() {
 const scope=useCommercialScope();
 const status=useQuery({queryKey:['finance-status',scope],queryFn:()=>financeCall({action:'status'})});
 const summary=useQuery({queryKey:['finance','dataverse-summary',scope,status.data?.sync?.active_generation],queryFn:()=>financeCall({action:'summary'}),enabled:status.data?.source==='dataverse'&&Boolean(status.data?.confirmed),staleTime:60000});
 const data=summary.data;
 const missing=(data?.po_commitments?.missing_count||0)+(data?.po_commitments?.partial_count||0);
 const priorities=data?[
  ['POs with incomplete or unavailable values',missing],
  ['Invoices missing net values',data.amounts.find(r=>r.kind==='invoices'&&!r.has_amount)?.count||0],
  ['Projects needing a link',data.matches.filter(r=>['unmatched','ambiguous'].includes(r.status)).reduce((n,r)=>n+r.count,0)]
 ]:[];
 return <section className="rounded-xl border border-border bg-card p-5">
  <h2 className="font-heading text-lg font-semibold">Commercial data checks</h2>
  <p className="mt-2 text-sm text-muted-foreground">Coverage is measured from the completed snapshot, not assumed from saved mappings.</p>
  {(status.isPending||summary.isFetching)&&<p role="status" className="mt-4 text-sm text-muted-foreground">Checking commercial data…</p>}
  {(status.error||summary.error)&&<p role="alert" className="mt-4 text-sm text-destructive">{(status.error||summary.error).message}</p>}
  {status.data&&!summary.isFetching&&!data&&!summary.error&&<p className="mt-4 text-sm text-muted-foreground">Commercial checks will be available after the first Dataverse finance snapshot completes.</p>}
  {data&&<>
   <div className="mt-4 grid gap-4 md:grid-cols-3">{priorities.map(([label,amount])=><div key={label} className="rounded-lg border border-border p-4"><p className={`text-2xl font-semibold ${amount>0?'text-destructive':'text-foreground'}`}>{amount.toLocaleString('en-GB')}</p><p className="mt-1 text-sm text-muted-foreground">{label}</p></div>)}</div>
   {missing>0&&<p className="mt-3 text-sm text-destructive">{data.po_commitments?.partial_count||0} POs use partial line-item sums; {data.po_commitments?.missing_count||0} POs have no available net value. Commitment totals are incomplete.</p>}
   {!data.invoices_have_values&&<p className="mt-3 text-sm text-muted-foreground">Sales-invoice net value is unavailable, not zero.</p>}
   {data.coverage_pending&&<p className="mt-3 text-sm text-muted-foreground">A new sync is in progress; table-level mapping coverage will update when that snapshot completes.</p>}
  </>}
 </section>;
}