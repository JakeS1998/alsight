import React from 'react';
import { formatCurrency } from '@/lib/portal';
import { contractorBuildUp } from './contractorBuildUp';

export default function ContractorBuildUp({ deliveryTeam, ohpSurveysPct, ohpRiba57Pct, onOhpChange }) {
  const build = contractorBuildUp(deliveryTeam, ohpSurveysPct, ohpRiba57Pct);
  if (!build.hasContractor) {
    return <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-3 text-sm text-slate-500">No contractor in the Delivery Team. Add a contractor with fees per RIBA stage to build up their fee.</div>;
  }
  return <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Contractor build-up (auto-calculated)</p>
    <div className="overflow-x-auto"><table className="w-full text-sm">
      <thead className="text-left text-xs text-slate-500"><tr>
        <th className="py-1.5 pr-2">Stage group</th>
        <th className="py-1.5 pr-2 text-right">Base</th>
        <th className="py-1.5 pr-2 text-right">OHP %</th>
        <th className="py-1.5 pr-2 text-right">OHP £</th>
        <th className="py-1.5 pr-2 text-right">Total</th>
      </tr></thead>
      <tbody className="divide-y divide-slate-200">
        <tr>
          <td className="py-1.5 pr-2 font-medium text-slate-700">Surveys (RIBA 1-4)</td>
          <td className="py-1.5 pr-2 text-right tabular-nums">{formatCurrency(build.surveysBase)}</td>
          <td className="py-1.5 pr-2 text-right"><input type="number" min="0" step="0.1" value={ohpSurveysPct} onChange={e => onOhpChange('surveys', e.target.value)} className="h-8 w-20 rounded-lg border border-input bg-background px-2 text-right text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20" /></td>
          <td className="py-1.5 pr-2 text-right tabular-nums text-slate-600">{formatCurrency(build.surveysOhp)}</td>
          <td className="py-1.5 pr-2 text-right tabular-nums font-semibold text-slate-900">{formatCurrency(build.surveysTotal)}</td>
        </tr>
        <tr>
          <td className="py-1.5 pr-2 font-medium text-slate-700">RIBA 5-7 (authorised activities)</td>
          <td className="py-1.5 pr-2 text-right tabular-nums">{formatCurrency(build.riba57Base)}</td>
          <td className="py-1.5 pr-2 text-right"><input type="number" min="0" step="0.1" value={ohpRiba57Pct} onChange={e => onOhpChange('riba57', e.target.value)} className="h-8 w-20 rounded-lg border border-input bg-background px-2 text-right text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20" /></td>
          <td className="py-1.5 pr-2 text-right tabular-nums text-slate-600">{formatCurrency(build.riba57Ohp)}</td>
          <td className="py-1.5 pr-2 text-right tabular-nums font-semibold text-slate-900">{formatCurrency(build.riba57Total)}</td>
        </tr>
      </tbody>
      <tfoot><tr className="border-t-2 border-slate-300">
        <td className="py-2 pr-2 font-semibold text-slate-900" colSpan={4}>Contractor total (with OHP)</td>
        <td className="py-2 pr-2 text-right tabular-nums font-bold text-primary">{formatCurrency(build.total)}</td>
      </tr></tfoot>
    </table></div>
  </div>;
}