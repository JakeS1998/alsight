import React from 'react';
import { formatCurrency } from '@/lib/portal';
export default function CommercialInsightsPanel({data}) {
 const lines=data.top_kind==='line_items';
 const cost=data.amounts.find(row=>row.kind===data.top_kind&&row.has_amount);
 const largest=data.top[0],share=cost?.sum_amount>0&&largest?largest.sum_amount/cost.sum_amount*100:null;
 const invoices=data.amounts.find(row=>row.kind==='invoices'&&row.has_amount);
 const missing=data.amounts.find(row=>row.kind===data.top_kind&&!row.has_amount)?.count||0;
 return <section className="finance-card finance-accent flex flex-1 flex-col" aria-labelledby="commercial-insights-title">
  <h2 id="commercial-insights-title">Commercial insights</h2>
  <p className="finance-muted mt-2">Based on the completed snapshot and the data you can access.</p>
  <dl className="mt-5 grid flex-1 content-between gap-5">
   <div className="border-b border-border pb-5"><dt className="text-sm font-semibold text-muted-foreground">{lines?'Recorded line-item cost base':'Recorded PO commitments'}</dt><dd className="mt-2 text-2xl font-bold">{cost?formatCurrency(cost.sum_amount):'Unavailable'}</dd><dd className="finance-small mt-2">{lines?'Line-item costs are a separate view, not an amount to add to PO header commitments.':'Net PO header values, excluding VAT.'}{missing>0&&` ${missing.toLocaleString('en-GB')} records have no net value, so this total is incomplete.`}</dd></div>
   <div className="border-b border-border pb-5"><dt className="text-sm font-semibold text-muted-foreground">{lines?'Largest single PO cost':'Largest project commitment'}</dt><dd className="mt-2 text-2xl font-bold">{largest?formatCurrency(largest.sum_amount):'Unavailable'}</dd><dd className="finance-small mt-2">{largest?`${largest.project_name||'Project lookup missing'}${share!==null?` represents ${share.toFixed(1)}% of the recorded ${lines?'line-item cost base':'PO commitments'}.`:'.'}`:'No valued costs are available for comparison.'}</dd></div>
   <div><dt className="text-sm font-semibold text-muted-foreground">Income and cash visibility</dt><dd className="mt-2 text-2xl font-bold">{invoices?formatCurrency(invoices.sum_amount):'Invoice value unavailable'}</dd><dd className="finance-small mt-2">{invoices?'Recorded sales-invoice net value is not proof of payment.':'There is no valued sales-invoice data in this snapshot.'} Payment and receipt sources are not included, so cash collection, outstanding receivables and realised margin cannot be established.</dd></div>
  </dl>
 </section>;
}