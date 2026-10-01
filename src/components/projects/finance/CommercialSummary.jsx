import React, { useState } from 'react';
import DashboardInfoTooltip from '@/components/dashboard/DashboardInfoTooltip';
import { moneyOrNR, moneySigned } from './financeMoney';

const HEALTH = {
  healthy: { label: 'Healthy', className: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
  watch: { label: 'Watch', className: 'bg-amber-50 text-amber-700 border-amber-200', dot: 'bg-amber-500' },
  risk: { label: 'At Risk', className: 'bg-rose-50 text-rose-700 border-rose-200', dot: 'bg-rose-500' },
  not_enough_data: { label: 'Not enough data', className: 'bg-slate-50 text-slate-500 border-slate-200', dot: 'bg-slate-300' },
};

function SummaryCard({ label, value, sub, help }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex items-center gap-1.5">
        <span className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</span>
        {help && <DashboardInfoTooltip label={label}>{help}</DashboardInfoTooltip>}
      </div>
      <p className="mt-1.5 font-heading text-xl font-semibold text-als-navy">{value}</p>
      {sub && <p className="mt-0.5 text-xs text-slate-400">{sub}</p>}
    </div>
  );
}

function HealthBadge({ health }) {
  const [showWhy, setShowWhy] = useState(false);
  const h = HEALTH[health.status];
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex items-center gap-1.5">
        <span className="text-xs font-medium uppercase tracking-wide text-slate-500">Commercial Health</span>
      </div>
      <div className="mt-1.5 flex items-center gap-2">
        <span className={`h-2.5 w-2.5 rounded-full ${h.dot}`} />
        <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-sm font-semibold ${h.className}`}>{h.label}</span>
      </div>
      {health.factors.length > 0 && (
        <button onClick={() => setShowWhy(s => !s)} className="mt-2 text-xs font-medium text-als-navy-light hover:underline">
          {showWhy ? 'Hide factors' : 'Why?'}
        </button>
      )}
      {showWhy && (
        <ul className="mt-2 space-y-1">
          {health.factors.map((f, i) => (
            <li key={i} className="flex items-start gap-1.5 text-xs text-slate-600">
              <span className={`mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full ${f.level === 'risk' ? 'bg-rose-500' : 'bg-amber-500'}`} />
              {f.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function WaterfallStep({ label, value, accent, isLast }) {
  return (
    <>
      <div className="flex flex-col items-center text-center">
        <p className="text-xs text-slate-500">{label}</p>
        <p className={`mt-0.5 text-sm font-semibold ${accent || 'text-als-navy'}`}>{value}</p>
      </div>
      {!isLast && <span className="mx-1 text-slate-300">→</span>}
    </>
  );
}

export default function CommercialSummary({ summary, health }) {
  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard label="Original Contract Sum" value={moneyOrNR(summary.contractSum)} help="The contract sum when the construction contract was entered into." />
        <SummaryCard label="Approved Variations" value={moneySigned(summary.approvedVariations)} help="Agreed financial adjustments from the Decision Register." />
        <SummaryCard label="Current Contract Value" value={moneyOrNR(summary.currentContractValue)} help="Original contract sum plus approved variations." />
        <SummaryCard label="Certified to Date" value={moneyOrNR(summary.certifiedToDate)} help="Cumulative value certified through the valuation process." />
        <SummaryCard label="Paid to Date" value={moneyOrNR(summary.paidToDate)} help="Total amount paid across all completed valuations." />
        <SummaryCard label="Remaining Contract Value" value={moneyOrNR(summary.remainingContractValue)} help="Current contract value less certified value to date." />
        <SummaryCard label="Forecast Final Cost" value={moneyOrNR(summary.forecastFinalCost)} help="Current forecast of the total construction cost at completion." />
        <SummaryCard label="Pending Variations" value={moneySigned(summary.pendingVariations)} help="Open financial adjustments awaiting agreement." />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-xl border border-slate-200 bg-white p-4">
          <h3 className="text-xs font-medium uppercase tracking-wide text-slate-500">Contract Value Waterfall</h3>
          <div className="mt-3 flex flex-wrap items-center justify-center gap-y-2">
            <WaterfallStep label="Original Contract" value={moneyOrNR(summary.contractSum)} />
            <WaterfallStep label="Approved Variations" value={moneySigned(summary.approvedVariations)} accent={summary.approvedVariations > 0 ? 'text-emerald-600' : summary.approvedVariations < 0 ? 'text-rose-600' : ''} />
            <WaterfallStep label="Current Contract" value={moneyOrNR(summary.currentContractValue)} />
            <WaterfallStep label="Forecast Final Cost" value={moneyOrNR(summary.forecastFinalCost)} isLast />
          </div>
        </div>
        <HealthBadge health={health} />
      </div>
    </div>
  );
}