import React from 'react';
import { Link } from 'react-router-dom';
import { formatCurrency, formatDate } from '@/lib/portal';
import { moneyOrNR, asNum } from './financeMoney';
import { STATUSES, PAYMENT, StatusPill } from '@/components/valuations/valuationUtils';

export default function ValuationPosition({ project, valuations }) {
  const latest = [...valuations].sort((a, b) => b.number - a.number)[0];
  if (!latest) return null;
  const approved = valuations.filter(v => ['approved', 'paid'].includes(v.status));
  const certified = approved.length > 0 ? Math.max(0, ...approved.map(v => asNum(v.approved_gross) || 0)) : null;
  const paid = valuations.filter(v => v.status === 'paid').reduce((s, v) => s + (asNum(v.amount_paid) || 0), 0);
  const paidHas = valuations.some(v => v.status === 'paid');
  const appAmount = latest.approved_gross != null ? asNum(latest.approved_gross) : asNum(latest.approved_net);
  const nextDue = latest.payment_due_date;

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5">
      <div className="flex items-center justify-between">
        <h3 className="font-heading text-sm font-semibold text-als-navy">Valuation Position</h3>
        <Link to={`/projects/${project.id}?tab=valuations`} className="text-xs font-medium text-als-navy-light hover:underline">View all valuations →</Link>
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <div><p className="text-xs text-slate-500">Latest valuation</p><p className="mt-0.5 flex items-center gap-2 text-sm font-semibold text-als-navy">Valuation {latest.number} <StatusPill status={latest.status} /></p></div>
        <div><p className="text-xs text-slate-500">Application amount</p><p className="mt-0.5 text-sm font-semibold text-als-navy">{moneyOrNR(appAmount)}</p></div>
        <div><p className="text-xs text-slate-500">Certified amount</p><p className="mt-0.5 text-sm font-semibold text-als-navy">{moneyOrNR(latest.approved_gross)}</p></div>
        <div><p className="text-xs text-slate-500">Payment status</p><p className="mt-0.5 text-sm font-medium text-slate-700">{PAYMENT[latest.payment_status] || '—'}</p></div>
        <div><p className="text-xs text-slate-500">Cumulative certified</p><p className="mt-0.5 text-sm font-semibold text-als-navy">{moneyOrNR(certified)}</p></div>
        <div><p className="text-xs text-slate-500">Cumulative paid</p><p className="mt-0.5 text-sm font-semibold text-als-navy">{paidHas ? formatCurrency(paid) : 'Not recorded'}</p></div>
      </div>
      {nextDue && <p className="mt-3 text-xs text-slate-500">Next valuation due: {formatDate(nextDue)}</p>}
    </section>
  );
}