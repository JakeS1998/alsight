import React, { useState } from 'react';
import { formatCurrency } from '@/lib/portal';
import { valuationTotals, StatusPill } from './valuationUtils';
import ValuationFields from './ValuationFields';
import ValuationSchedule from './ValuationSchedule';
import ValuationDeductions from './ValuationDeductions';
import ValuationActions from './ValuationActions';
import ValuationEvidence from './ValuationEvidence';
import ValuationActivity from './ValuationActivity';

export default function ValuationDetail({ project, initial, valuations, user, onAction, onBack, managerName, contractorName, meta }) {
  const [value, setValue] = useState(initial);
  const [busy, setBusy] = useState(false); const [error, setError] = useState('');
  const role = user?.role;
  const editable = ['draft','returned'].includes(value.status) && (role === 'project_manager' || role === 'admin');
  const previousCertified = Math.max(0, ...valuations.filter(v => v.id !== value.id && v.number < value.number && ['approved','paid'].includes(v.status)).map(v => Number(v.approved_gross) || 0));
  const totals = valuationTotals(value, previousCertified);
  const hasOver = (value.items || []).some(i => Number(i.previous || 0) + Number(i.completed || 0) + Number(i.materials || 0) > Number(i.contract_value || 0) + Number(i.variations || 0));
  const [saved, setSaved] = useState(false);
  const change = next => { setValue(next); setSaved(false); };
  const run = async (action, extra = {}) => {
    if (busy) return;
    if (action === 'submit') {
      if (hasOver || !value.period_start || !value.period_end || !value.valuation_date || !(value.items || []).length || value.items.some(i => !i.description?.trim()) || (value.deductions || []).some(d => !d.description?.trim())) { setError('Complete the period, valuation date, schedule and deductions; no item may exceed its revised value.'); return; }
      if (!(value.attachments || []).some(file => file.type === 'NOP' && file.file_uri)) { setError('Upload the required NOP document before submitting.'); return; }
    }
    setBusy(true); setError('');
    try {
      if (action === 'submit') await onAction('save', { ...value }, value.id);
      const result = await onAction(action, action === 'save' ? { ...value } : extra, value.id);
      setValue(['attachment','comment'].includes(action) && editable ? { ...result, period_start: value.period_start, period_end: value.period_end, valuation_date: value.valuation_date, payment_due_date: value.payment_due_date, notes: value.notes, items: value.items, deductions: value.deductions, retention_percent: value.retention_percent } : result);
      if (action === 'save' || action === 'submit') setSaved(true);
      return result;
    } catch(err) { setError(err.response?.data?.error || err.message || 'Unable to update valuation'); }
    finally { setBusy(false); }
  };
  return <div className="space-y-5"><button onClick={onBack} className="text-sm font-medium text-als-navy-light">← Back to valuations</button><div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="font-heading text-xl font-semibold text-als-navy">Valuation {value.number}</h2><p className="text-sm text-muted-foreground">Create → Complete → Attach Evidence → Submit → Alliance Review → Approve → Pay</p></div><StatusPill status={value.status} /></div>
    {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-destructive">{error}</p>}
    <ValuationFields project={project} value={value} onChange={change} editable={editable} previousCertified={previousCertified} managerName={managerName} contractorName={contractorName} meta={meta} />
    <ValuationSchedule value={value} onChange={change} editable={editable} previousCertified={previousCertified} />
    <ValuationDeductions value={value} onChange={change} editable={editable} canAdjust={role === 'admin'} />
    <div className="rounded-2xl border border-als-navy-light bg-card p-5 text-lg font-semibold text-als-navy">Amount due this valuation: {formatCurrency(totals.due)}{hasOver && <p className="text-sm text-orange-700">One or more items exceed their revised value.</p>}</div>
    <ValuationEvidence value={value} editable={editable} onAction={run} />
    <ValuationActions key={value.id} value={value} role={role} editable={editable} onAction={run} busy={busy} previousCertified={previousCertified} />
    {saved && editable && <p role="status" className="text-sm text-emerald-700">Draft saved. You can return to it later from the valuation register.</p>}
    <ValuationActivity value={value} onAction={run} busy={busy} />
  </div>;
}