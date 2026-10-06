import React from 'react';
import { formatCurrency } from '@/lib/portal';

export default function FrameworkVisualSummary({ data }) {
  if (!data) return <p className="text-sm text-slate-500">Loading UKLF reporting…</p>;
  const total = data.total || 0;
  const milestones = [['Questionnaire dated', data.questionnaire], ['Agreement signed', data.agreement], ['Call-off dated', data.calloff], ['Delivery outcome recorded', data.outcomes]];
  const outcomes = [['On time', data.onTime, data.onTimeRecorded], ['To budget', data.toBudget, data.budgetRecorded], ['Zero RIDDOR', data.safe, data.safetyRecorded]];
  return <section className="space-y-4" aria-label="UKLF visual reporting">
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <div className="rounded-xl border border-slate-200 bg-white p-5"><p className="text-sm text-slate-500">Framework projects</p><p className="mt-1 text-3xl font-bold text-als-navy">{total}</p></div>
      <div className="rounded-xl border border-slate-200 bg-white p-5"><p className="text-sm text-slate-500">Linked to ALSight</p><p className="mt-1 text-3xl font-bold text-als-navy">{data.linked || 0}</p></div>
      <div className="rounded-xl border border-slate-200 bg-white p-5"><p className="text-sm text-slate-500">Outcome records</p><p className="mt-1 text-3xl font-bold text-als-navy">{data.outcomes || 0}</p></div>
    </div>
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="rounded-xl border border-slate-200 bg-white p-5"><h2 className="mb-4 font-semibold text-als-navy">Milestone progress</h2><div className="space-y-4">{milestones.map(([label, count]) => <div key={label}><div className="mb-1 flex justify-between text-sm"><span>{label}</span><span className="font-semibold">{count || 0} / {total}</span></div><div className="h-2 overflow-hidden rounded-full bg-secondary"><div className="h-full rounded-full bg-primary" style={{ width: `${total ? Math.min(100, (count || 0) / total * 100) : 0}%` }} /></div></div>)}</div></div>
      <div className="rounded-xl border border-slate-200 bg-white p-5"><h2 className="mb-4 font-semibold text-als-navy">Delivery outcomes</h2><div className="space-y-4">{outcomes.map(([label, passed, recorded]) => <div key={label}><div className="mb-1 flex justify-between text-sm"><span>{label}</span><span className="font-semibold">{recorded ? `${Math.round((passed || 0) / recorded * 100)}%` : '—'} <span className="font-normal text-slate-500">({passed || 0} of {recorded || 0} recorded)</span></span></div><div className="h-2 overflow-hidden rounded-full bg-secondary"><div className="h-full rounded-full bg-als-navy" style={{ width: `${recorded ? Math.min(100, (passed || 0) / recorded * 100) : 0}%` }} /></div></div>)}</div></div>
    </div>
    {data.commercial && <div className="grid gap-4 sm:grid-cols-2">{[['Total Call-Off Value', data.commercial.sum_calloff_value]].map(([label, value]) => <div key={label} className="rounded-xl border border-slate-200 bg-white p-4"><p className="text-sm text-slate-500">{label}</p><p className="text-xl font-semibold text-als-navy">{formatCurrency(value || 0)}</p></div>)}</div>}
    <p className="text-xs text-slate-500">Rates use projects with each outcome recorded. Totals reflect recorded workbook rows.</p>
  </section>;
}