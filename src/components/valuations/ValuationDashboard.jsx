import React from 'react';
import { formatCurrency, formatDate } from '@/lib/portal';
import { valuationTotals, StatusPill, sum } from './valuationUtils';

export default function ValuationDashboard({ project, valuations, meta }) {
  const ordered = [...valuations].sort((a,b) => b.number - a.number);
  const latest = ordered[0];
  const certified = Math.max(0, ...valuations.filter(v => ['approved','paid'].includes(v.status)).map(v => Number(v.approved_gross) || 0));
  const paid = sum(valuations.filter(v => v.status === 'paid'), v => v.amount_paid);
  const retention = sum(valuations.filter(v => ['approved','paid'].includes(v.status)), v => v.approved_retention);
  const basis = latest ? valuationTotals(latest) : { variations: 0 };
  const contract = basis.contract || Number(meta?.contract_sum ?? project.estimated_value ?? 0);
  const revised = contract + basis.variations;
  const prior = Math.max(0, ...valuations.filter(v => v.number < (latest?.number || 0) && ['approved','paid'].includes(v.status)).map(v => Number(v.approved_gross) || 0));
  const current = latest?.status === 'submitted' || latest?.status === 'under_review' ? valuationTotals(latest, prior).current : 0;
  const values = [[meta?.contract_sum != null || basis.contract ? 'Contract Sum' : 'Project Estimate', contract], ['Schedule Variations', basis.variations], ['Revised Contract Sum', revised], ['Previously Certified', Math.max(0, ...valuations.filter(v => v.number < (latest?.number || 0) && ['approved','paid'].includes(v.status)).map(v => Number(v.approved_gross) || 0))], ['Current Valuation Submitted', current], ['Certified to Date', certified], ['Remaining Contract Value', Math.max(0, revised - certified)], ['Retention Held', retention], ['Paid to Date', paid]];
  return <section className="rounded-2xl border border-border bg-card p-5">
    <h3 className="font-heading text-base font-semibold text-als-navy">Valuation summary</h3>
    <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{values.map(([label,value]) => <div key={label} className="rounded-xl bg-secondary p-3"><p className="text-xs text-muted-foreground">{label}</p><p className="mt-1 text-base font-semibold text-als-navy">{formatCurrency(value)}</p></div>)}</div>
    <div className="mt-5 flex flex-wrap items-center justify-between gap-2 text-sm"><span className="font-medium">{formatCurrency(certified)} of {formatCurrency(revised)} certified — {revised > 0 ? (certified / revised * 100).toFixed(1) : '0.0'}%</span><span>Latest: {latest ? `Valuation ${latest.number}` : '—'} {latest && <StatusPill status={latest.status} />}</span><span>Payment due: {formatDate(latest?.payment_due_date)}</span></div>
    <div className="mt-2 h-2 overflow-hidden rounded-full bg-secondary"><div className="h-full bg-als-navy-light" style={{ width: `${Math.min(100, revised > 0 ? certified / revised * 100 : 0)}%` }} /></div>
  </section>;
}