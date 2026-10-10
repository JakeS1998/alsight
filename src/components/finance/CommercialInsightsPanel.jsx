import React from 'react';
import { formatCurrency } from '@/lib/portal';
import AliceInsight from '@/components/alice/AliceInsight';
export default function CommercialInsightsPanel({data}) {
 const lines=data.top_kind==='line_items';
 const cost=data.amounts.find(row=>row.kind===data.top_kind&&row.has_amount);
 const largest=data.top[0],share=cost?.sum_amount>0&&largest?largest.sum_amount/cost.sum_amount*100:null;
 const invoices=data.amounts.find(row=>row.kind==='invoices'&&row.has_amount);
 const missing=data.amounts.find(row=>row.kind===data.top_kind&&!row.has_amount)?.count||0;
 return <div className="flex flex-1 flex-col [&>section]:flex [&>section]:flex-1 [&>section]:flex-col">
  <AliceInsight title="ALICE Commercial insights">
  <p className="finance-muted mt-2">Based on the completed snapshot and the data you can access.</p>
  <dl className="mt-5 grid flex-1 content-between gap-5">
   <div className="border-b border-border pb-5"><dt className="text-sm font-semibold text-muted-foreground">PO commitments</dt><dd className="mt-2 text-2xl font-bold">{data.po_commitments?.amount!=null?formatCurrency(data.po_commitments.amount):'Unavailable'}</dd><dd className="finance-small mt-2">Net of VAT. Recorded header values take priority; blank headers use available line-item sums without double-counting. {(data.po_commitments?.partial_count||0)>0&&`${data.po_commitments.partial_count.toLocaleString('en-GB')} POs use partial sums. `}{(data.po_commitments?.missing_count||0)>0&&`${data.po_commitments.missing_count.toLocaleString('en-GB')} POs have no available value.`}</dd></div>
   <div className="border-b border-border pb-5"><dt className="text-sm font-semibold text-muted-foreground">{lines?'Largest single PO cost':'Largest project commitment'}</dt><dd className="mt-2 text-2xl font-bold">{largest?formatCurrency(largest.sum_amount):'Unavailable'}</dd><dd className="finance-small mt-2">{largest?`${largest.project_name||'Project lookup missing'}${share!==null?` represents ${share.toFixed(1)}% of the recorded ${lines?'line-item cost base':'PO commitments'}.`:'.'}`:'No valued costs are available for comparison.'}</dd></div>
   <div><dt className="text-sm font-semibold text-muted-foreground">Income and cash visibility</dt><dd className="mt-2 text-2xl font-bold">{invoices?formatCurrency(invoices.sum_amount):'Invoice value unavailable'}</dd><dd className="finance-small mt-2">{invoices?'Recorded sales-invoice net value is not proof of payment.':'There is no valued sales-invoice data in this snapshot.'} Payment and receipt sources are not included, so cash collection, outstanding receivables and realised margin cannot be established.</dd></div>
  </dl>
  </AliceInsight>
 </div>;
}