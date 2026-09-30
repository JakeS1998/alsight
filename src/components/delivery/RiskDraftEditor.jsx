import React from 'react';
import { RISK_COLUMNS } from '@/components/delivery/riskRegisterColumns';
export default function RiskDraftEditor({ row, index, onChange, disabled }) {
  return <details open={index === 0 ? true : undefined} className="rounded-lg border border-border p-3">
    <summary className="cursor-pointer break-words text-sm font-medium">{row.reference || `Risk ${index+1}`} · {row.title || 'Missing description'}</summary>
    <label className="mt-3 flex items-center gap-2 text-sm"><input type="checkbox" checked={row.selected} disabled={disabled} onChange={e => onChange(index, 'selected', e.target.checked)} />Include this risk</label>
    <fieldset disabled={disabled || !row.selected} className="mt-3 grid gap-3 sm:grid-cols-2">{RISK_COLUMNS.map(col => <label key={col.key} className={`text-xs ${col.fullWidth ? 'sm:col-span-2' : ''}`}>
      {col.label}{col.required ? ' *' : ''}
      {col.type === 'calculated' ? <output className="mt-1 block rounded-md bg-muted p-2">{col.calculate(row) ?? '—'}</output> : col.type === 'select' ? <select aria-label={col.label} value={row[col.key] ?? ''} onChange={e => onChange(index, col.key, e.target.value)} className="mt-1 w-full rounded-md border border-input bg-background p-2 text-sm"><option value="">Needs review</option>{col.options.map(option => <option value={option.value} key={option.value}>{option.label}</option>)}</select> : col.type === 'textarea' ? <textarea aria-label={col.label} rows={3} value={row[col.key] ?? ''} onChange={e => onChange(index, col.key, e.target.value)} className="mt-1 w-full rounded-md border border-input bg-background p-2 text-sm" /> : <input aria-label={col.label} type={col.type === 'number' ? 'number' : 'text'} min={col.min} step={col.step} value={row[col.key] ?? ''} onChange={e => onChange(index, col.key, e.target.value)} className="mt-1 w-full rounded-md border border-input bg-background p-2 text-sm" />}
    </label>)}</fieldset>
  </details>;
}