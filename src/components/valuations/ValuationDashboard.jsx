import React from 'react';
import { formatCurrency, formatDate } from '@/lib/portal';
import { valuationTotals, StatusPill, sum } from './valuationUtils';
import ValuationMetric from '@/components/valuations/ValuationMetric';

export default function ValuationDashboard({ project, valuations, meta }) {
  const ordered = [...valuations].sort((a,b) => b.number - a.number);
  const latest = ordered[0];
  const certified = Math.max(0, ...valuations.filter(v => ['approved','paid'].includes(v.status)).map(v => Number(v.approved_gross) || 0));
  const paid = sum(valuations.filter(v => v.status === 'paid'), v => v.amount_paid);
  const retention = sum(valuations.filter(v => ['approved','paid'].includes(v.status)), v => v.approved_retention);
  const contract = meta?.contract_sum ?? null;
  const variations = meta?.approved_variations ?? 0;
  const revised = meta?.revised_contract_sum ?? null;
  const prior = Math.max(0, ...valuations.filter(v => v.number < (latest?.number || 0) && ['approved','paid'].includes(v.status)).map(v => Number(v.approved_gross) || 0));
  const current = latest?.status === 'submitted' || latest?.status === 'under_review' ? valuationTotals(latest, prior).current : 0;
  const values = [
    ['Construction Contract Sum', contract, 'Saved Contract sum from Delivery → Construction; not the project estimate or valuation schedule.'],
    ['Agreed Contract Adjustments', variations, 'Net additions and omissions from Contract adjustment (£) on Agreed entries in Delivery → Section 7, Decision Register. Open decisions and notes are excluded.'],
    ['Revised Contract Sum', revised, 'Saved construction contract plus agreed Decision Register adjustments. Schedule variations are not added again.'],
    ['Previously Certified', prior, 'Highest cumulative approved gross amount before the latest valuation; not the sum of earlier cumulative valuations.'],
    ['Current Valuation Submitted', current, 'Latest submitted or under-review gross valuation less previously certified, before retention and deductions; otherwise £0.'],
    ['Certified to Date', certified, 'Highest cumulative approved gross amount across approved and paid valuations, before retention and deductions.'],
    ['Remaining Contract Value', revised == null ? null : Math.max(0, revised - certified), 'Revised contract sum less certified-to-date gross, with a minimum of £0. This is uncertified value, not unpaid invoices.'],
    ['Retention Held', retention, 'Total approved retention deductions across approved and paid valuations; does not track separate retention releases.'],
    ['Paid to Date', paid, 'Total recorded Amount paid on valuations marked Paid; excludes approved but unpaid amounts.'],
  ];
  return <section className="rounded-2xl border border-border bg-card p-5">
    <h3 className="font-heading text-base font-semibold text-als-navy">Valuation summary</h3>
    {contract == null && <p className="mt-2 text-sm text-muted-foreground">Save the construction Contract sum in Delivery to enable revised contract and remaining-value calculations.</p>}
    <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{values.map(([label,value,explanation]) => <ValuationMetric key={label} label={label} value={value} explanation={explanation} />)}</div>
    <div className="mt-5 flex flex-wrap items-center justify-between gap-2 text-sm"><span className="font-medium">{revised == null ? `${formatCurrency(certified)} certified · contract sum not recorded` : `${formatCurrency(certified)} of ${formatCurrency(revised)} certified — ${revised > 0 ? (certified / revised * 100).toFixed(1) : '0.0'}%`}</span><span>Latest: {latest ? `Valuation ${latest.number}` : '—'} {latest && <StatusPill status={latest.status} />}</span><span>Payment due: {formatDate(latest?.payment_due_date)}</span></div>
    <div className="mt-2 h-2 overflow-hidden rounded-full bg-secondary"><div className="h-full bg-als-navy-light" style={{ width: `${Math.min(100, revised > 0 ? certified / revised * 100 : 0)}%` }} /></div>
  </section>;
}