import React from 'react';
import { formatCurrency, formatDate } from '@/lib/portal';
import { moneyOrNR, pctOrNR } from './financeMoney';

export default function RetentionSummary({ project, retention }) {
  if (!retention) return null;
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5">
      <h3 className="font-heading text-base font-semibold text-als-navy">Retention</h3>
      <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <div><p className="text-xs text-slate-500">Retention percentage</p><p className="mt-0.5 text-sm font-semibold text-als-navy">{pctOrNR(retention.pct)}</p></div>
        <div><p className="text-xs text-slate-500">Current retention held</p><p className="mt-0.5 text-sm font-semibold text-als-navy">{moneyOrNR(retention.held)}</p></div>
        <div><p className="text-xs text-slate-500">Retention at Practical Completion</p><p className="mt-0.5 text-sm font-semibold text-als-navy">{retention.held > 0 ? formatCurrency(retention.held / 2) : 'Not recorded'}</p></div>
        <div><p className="text-xs text-slate-500">First release (at PC)</p><p className="mt-0.5 text-sm font-medium text-slate-700">{retention.firstRelease ? formatDate(retention.firstRelease) : 'Not recorded'}</p></div>
        <div><p className="text-xs text-slate-500">Remaining retention</p><p className="mt-0.5 text-sm font-semibold text-als-navy">{retention.held > 0 ? formatCurrency(retention.held / 2) : 'Not recorded'}</p></div>
        <div><p className="text-xs text-slate-500">Final release target</p><p className="mt-0.5 text-sm font-medium text-slate-700">{retention.finalRelease ? formatDate(retention.finalRelease) : 'Not recorded'}</p></div>
      </div>
    </section>
  );
}