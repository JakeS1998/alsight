import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { formatCurrency } from '@/lib/portal';
import { moneyOrNR, asNum } from './financeMoney';
import { RIBA_LABELS, RIBA_STAGES } from './financeCalculations';
import { ChevronDown, ChevronRight } from 'lucide-react';

export default function ProfessionalFees({ project, consultants, currentContractValue }) {
  const [open, setOpen] = useState(null);
  const totalFees = consultants.reduce((s, c) => s + (c.total || 0), 0);
  const hasAny = consultants.some(c => c.total != null);
  const pct = hasAny && currentContractValue > 0 ? (totalFees / currentContractValue) * 100 : null;

  return (
    <section className="rounded-xl border border-slate-200 bg-white">
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
        <h3 className="font-heading text-base font-semibold text-als-navy">Professional Fees</h3>
        <Link to={`/projects/${project.id}?tab=delivery`} className="text-xs font-medium text-als-navy-light hover:underline">View Delivery Team →</Link>
      </div>
      {hasAny && (
        <div className="grid gap-3 p-5 sm:grid-cols-2">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4"><p className="text-xs font-medium uppercase tracking-wide text-slate-500">Total Professional Fees</p><p className="mt-1 font-heading text-lg font-semibold text-als-navy">{formatCurrency(totalFees)}</p></div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4"><p className="text-xs font-medium uppercase tracking-wide text-slate-500">Fees as % of Contract Value</p><p className="mt-1 font-heading text-lg font-semibold text-als-navy">{pct != null ? `${pct.toFixed(1)}%` : 'Not recorded'}</p></div>
        </div>
      )}
      <div className="divide-y divide-slate-100">
        {consultants.map((c, i) => {
          const isOpen = open === i;
          return (
            <div key={i}>
              <button onClick={() => setOpen(isOpen ? null : i)} className="flex w-full items-center justify-between px-5 py-3.5 text-left hover:bg-slate-50">
                <div className="flex items-center gap-3 min-w-0">
                  {isOpen ? <ChevronDown className="h-4 w-4 text-slate-400" /> : <ChevronRight className="h-4 w-4 text-slate-400" />}
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-900">{c.role}</p>
                    <p className="truncate text-xs text-slate-500">{c.supplier || 'Supplier not recorded'}</p>
                  </div>
                </div>
                <p className="text-sm font-semibold text-slate-900">{moneyOrNR(c.total)}</p>
              </button>
              {isOpen && (
                <div className="border-t border-slate-100 bg-slate-50/50 px-5 py-3">
                  <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
                    {RIBA_STAGES.map(s => (
                      <div key={s}><p className="text-xs text-slate-500">{RIBA_LABELS[s]}</p><p className="text-sm font-medium text-slate-800">{moneyOrNR(c.stageFees[s])}</p></div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
      {consultants.length === 0 && <p className="px-5 pb-5 text-sm text-slate-500">No consultant appointments recorded in the Delivery Team.</p>}
    </section>
  );
}