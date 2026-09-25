import React from 'react';
import { formatCurrency, formatDate } from '@/lib/portal';

export default function ValuationFields({ project, value, onChange, editable, previousCertified, managerName, contractorName, meta }) {
  const fields = [['period_start','Period start'],['period_end','Period end'],['valuation_date','Valuation date'],['payment_due_date','Payment due date']];
  return <section className="rounded-2xl border border-border bg-card p-5"><h3 className="font-heading font-semibold text-als-navy">Valuation {value.number} · {project.name}</h3>
    <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">{[['Project reference',project.project_number],['Client',project.client_name],['Contractor',contractorName],['Project Manager',managerName],[meta?.contract_sum != null ? 'Contract sum' : 'Project estimate',formatCurrency(meta?.contract_sum ?? project.estimated_value)],['Contract start',formatDate(meta?.contract_start)],['Practical completion',formatDate(project.practical_completion_date)],['Submitted by',value.submitted_by_name]].map(([label,text]) => <div key={label}><p className="text-xs text-muted-foreground">{label}</p><p className="font-medium text-foreground">{text || '—'}</p></div>)}</div>
    <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{fields.map(([key,label]) => <label key={key} className="text-xs text-muted-foreground">{label}<input type="date" disabled={!editable} value={value[key] || ''} onChange={e => onChange({ ...value, [key]: e.target.value })} className="mt-1 block w-full rounded-lg border border-border bg-card p-2 text-sm text-foreground disabled:bg-secondary" /></label>)}</div>
    <label className="mt-4 block text-xs text-muted-foreground">Covering comments<textarea disabled={!editable} value={value.notes || ''} onChange={e => onChange({ ...value, notes: e.target.value })} className="mt-1 block min-h-20 w-full rounded-lg border border-border bg-card p-2 text-sm text-foreground disabled:bg-secondary" /></label>
    <p className="mt-3 text-xs text-muted-foreground">Previously certified: {formatCurrency(previousCertified)} · Submitted: {formatDate(value.submitted_at)}</p>
  </section>;
}