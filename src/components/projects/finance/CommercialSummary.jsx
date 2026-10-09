import React, { useState } from 'react';
import DashboardInfoTooltip from '@/components/dashboard/DashboardInfoTooltip';
import { moneyOrNR, moneySigned } from './financeMoney';
import ContractValueWaterfall from './ContractValueWaterfall';
import RiskAllowanceCard from '@/components/projects/finance/RiskAllowanceCard';

const HEALTH = {
  healthy: { label: 'Healthy', className: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
  watch: { label: 'Watch', className: 'bg-amber-50 text-amber-700 border-amber-200', dot: 'bg-amber-500' },
  risk: { label: 'At Risk', className: 'bg-rose-50 text-rose-700 border-rose-200', dot: 'bg-rose-500' },
  not_enough_data: { label: 'Not enough data', className: 'bg-slate-50 text-slate-500 border-slate-200', dot: 'bg-slate-300' },
};

function SummaryCard({ label, value, sub, help, valueClass, cardClass }) {
  return (
    <div className={`rounded-xl border border-slate-200 p-4 ${cardClass || 'bg-white'}`}>
      <div className="flex items-center gap-1.5">
        <span className="text-xs font-medium uppercase tracking-wide text-[#6e737c]">{label}</span>
        {help && <DashboardInfoTooltip label={label}>{help}</DashboardInfoTooltip>}
      </div>
      <p className={`mt-1.5 font-heading text-lg font-semibold ${valueClass || 'text-[#0d1117]'}`}>{value}</p>
      {sub && <p className="mt-0.5 text-xs text-[#6e737c]">{sub}</p>}
    </div>
  );
}

function HealthBadge({ health }) {
  const [showWhy, setShowWhy] = useState(false);
  const h = HEALTH[health.status];
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <span className="text-xs font-medium uppercase tracking-wide text-[#6e737c]">Commercial Health</span>
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

export default function CommercialSummary({ summary, health, projectId }) {
  return (
    <div className="space-y-4">
      {/* Operational headline cards */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard label="Certified to Date" value={moneyOrNR(summary.certifiedToDate)} help="Cumulative value certified through the valuation process." />
        <SummaryCard label="Paid to Date" value={moneyOrNR(summary.paidToDate)} help="Total amount paid across all completed valuations." />
        <SummaryCard label="Remaining Contract Value" value={moneyOrNR(summary.remainingContractValue)} help="Current contract value less certified value to date." />
        <HealthBadge health={health} />
      </div>

      {/* Waterfall chart */}
      <ContractValueWaterfall summary={summary} />

      {/* Waterfall summary cards */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
        <SummaryCard
          label="Original Contract Sum"
          value={moneyOrNR(summary.contractSum)}
          sub="Construction contract value at appointment"
          help="The contract sum when the construction contract was entered into."
        />
        <SummaryCard
          label="Approved Variations"
          value={moneySigned(summary.approvedAdditions)}
          sub={summary.approvedVariationCount ? `${summary.approvedVariationCount} approved variation${summary.approvedVariationCount !== 1 ? 's' : ''}` : 'No approved variations'}
          valueClass="text-[#fd8c3f]"
          help="Agreed positive financial adjustments from the Decision Register."
        />
        <SummaryCard
          label="Approved Omissions"
          value={summary.approvedOmissions ? moneySigned(-summary.approvedOmissions) : moneyOrNR(0)}
          sub={summary.approvedOmissionCount ? `${summary.approvedOmissionCount} approved omission${summary.approvedOmissionCount !== 1 ? 's' : ''}` : 'No approved omissions'}
          valueClass="text-rose-700"
          cardClass="bg-rose-50/40"
          help="Agreed negative financial adjustments (omissions) from the Decision Register."
        />
        <SummaryCard
          label="Current Contract Value"
          value={moneyOrNR(summary.currentContractValue)}
          sub="Original + approved variations"
          help="Original contract sum plus net approved variations."
        />
        <SummaryCard
          label="Pending Variations"
          value={moneySigned(summary.pendingVariations)}
          sub={summary.pendingVariationCount ? `${summary.pendingVariationCount} pending variation${summary.pendingVariationCount !== 1 ? 's' : ''}` : 'No pending variations'}
          valueClass="text-[#fd8c3f]"
          cardClass="bg-orange-50/40"
          help="Open financial adjustments awaiting agreement."
        />
        <RiskAllowanceCard estimate={summary.riskEstimate} projectId={projectId} />
        <SummaryCard
          label="Forecast Final Cost"
          value={moneyOrNR(summary.forecastFinalCost)}
          sub={summary.riskAllowance == null ? 'Risk allowance is not yet estimated' : 'Current value + pending changes + estimated risk use'}
          help="Current contract value plus pending variations and the indicative score-based contingency-use estimate, not the entire contingency budget. Not estimated when the risk allowance is unavailable."
        />
      </div>
    </div>
  );
}