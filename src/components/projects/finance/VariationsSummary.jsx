import React from 'react';
import { Link } from 'react-router-dom';
import { formatCurrency, formatDate } from '@/lib/portal';
import { moneyOrNR, moneySigned, asNum } from './financeMoney';

const STATUS_STYLE = {
  agreed: { label: 'Approved', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  open: { label: 'Pending', className: 'bg-amber-50 text-amber-700 border-amber-200' },
};

function VarStatCard({ label, value }) {
  return <div className="rounded-xl border border-slate-200 bg-white p-4"><p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p><p className="mt-1 font-heading text-lg font-semibold text-als-navy">{value}</p></div>;
}

export default function VariationsSummary({ project, decisions }) {
  const approved = decisions.filter(d => d.status === 'agreed');
  const pending = decisions.filter(d => d.status === 'open');
  const approvedTotal = approved.reduce((s, d) => s + (asNum(d.financial_adjustment) || 0), 0);
  const pendingTotal = pending.reduce((s, d) => s + (asNum(d.financial_adjustment) || 0), 0);
  const all = [...approved, ...pending].sort((a, b) => new Date(b.date_agreed || b.date_requested || 0) - new Date(a.date_agreed || a.date_requested || 0));

  return (
    <section className="rounded-xl border border-slate-200 bg-white">
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
        <h3 className="font-heading text-base font-semibold text-als-navy">Variations</h3>
        <Link to={`/projects/${project.id}?tab=delivery`} className="text-xs font-medium text-als-navy-light hover:underline">View full Decision Register →</Link>
      </div>
      <div className="grid gap-3 p-5 sm:grid-cols-3">
        <VarStatCard label="Approved Variations" value={formatCurrency(approvedTotal)} />
        <VarStatCard label="Pending Variations" value={formatCurrency(pendingTotal)} />
        <VarStatCard label="Total Variations" value={formatCurrency(approvedTotal + pendingTotal)} />
      </div>
      {all.length > 0 && (
        <div className="divide-y divide-slate-100">
          {all.map(d => {
            const st = STATUS_STYLE[d.status] || { label: d.status, className: 'bg-slate-50 text-slate-600 border-slate-200' };
            return (
              <div key={d.id} className="flex flex-wrap items-center justify-between gap-2 px-5 py-3 text-sm">
                <div className="min-w-0">
                  <p className="truncate font-medium text-slate-900">{d.decision_title}</p>
                  <p className="text-xs text-slate-500">{d.date_agreed ? `Agreed ${formatDate(d.date_agreed)}` : d.date_requested ? `Requested ${formatDate(d.date_requested)}` : ''}{d.programme_impact ? ` · ${d.programme_impact}` : ''}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-slate-900">{moneySigned(d.financial_adjustment)}</span>
                  <span className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-medium ${st.className}`}>{st.label}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
      {all.length === 0 && <p className="px-5 pb-5 text-sm text-slate-500">No variations recorded in the Decision Register.</p>}
    </section>
  );
}