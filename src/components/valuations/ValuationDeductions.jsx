import React from 'react';
import { formatCurrency } from '@/lib/portal';
import { valuationTotals } from './valuationUtils';

export default function ValuationDeductions({ value, onChange, editable, canAdjust }) {
  const deductions = value.deductions || [];
  const total = valuationTotals(value);
  return <section className="rounded-2xl border border-border bg-card p-5"><h3 className="font-heading font-semibold text-als-navy">Retention & deductions</h3>
    <label className="mt-3 block text-sm">Retention percentage <input type="number" min="0" max="100" step="0.01" disabled={!editable || !canAdjust} value={value.retention_percent ?? 0} onChange={e => onChange({ ...value, retention_percent: e.target.value })} className="ml-2 w-24 rounded-lg border border-border bg-card p-2 disabled:bg-secondary" />% <span className="ml-2 text-muted-foreground">{formatCurrency(total.retention)}</span></label>
    <div className="mt-4 space-y-2">{deductions.map((d,i) => <div key={i} className="grid gap-2 sm:grid-cols-[1fr_140px_1fr_auto]"><input aria-label="Deduction description" placeholder="Contra charge, LAD, insurance…" disabled={!editable} value={d.description || ''} onChange={e => onChange({ ...value, deductions: deductions.map((x,j) => j === i ? { ...x, description: e.target.value } : x) })} className="rounded-lg border border-border p-2 text-sm" /><input aria-label="Deduction amount" type="number" min="0" step="0.01" disabled={!editable} value={d.amount ?? 0} onChange={e => onChange({ ...value, deductions: deductions.map((x,j) => j === i ? { ...x, amount: e.target.value } : x) })} className="rounded-lg border border-border p-2 text-sm" /><input aria-label="Deduction notes" placeholder="Notes" disabled={!editable} value={d.notes || ''} onChange={e => onChange({ ...value, deductions: deductions.map((x,j) => j === i ? { ...x, notes: e.target.value } : x) })} className="rounded-lg border border-border p-2 text-sm" />{editable && <button className="text-sm text-red-600" onClick={() => onChange({ ...value, deductions: deductions.filter((_,j) => j !== i) })}>Remove</button>}</div>)}</div>
    {editable && <button className="mt-3 text-sm font-semibold text-als-navy-light" onClick={() => onChange({ ...value, deductions: [...deductions, { description: '', amount: 0, notes: '' }] })}>+ Add deduction</button>}
  </section>;
}