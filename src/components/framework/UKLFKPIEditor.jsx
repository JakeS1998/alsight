import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';

const OUTCOMES = [
  ['completed_on_time', 'Completed on time'],
  ['completed_to_budget', 'Completed to budget'],
];

export default function UKLFKPIEditor({ report, defaults = {}, onSaved, onCancel, frameworkContext = false }) {
  const [form, setForm] = useState({
    completed_on_time: report.completed_on_time || defaults.completed_on_time || '',
    completed_to_budget: report.completed_to_budget || defaults.completed_to_budget || '',
    riddor_incidents: frameworkContext && !['Y','N'].includes(report.zero_riddor) ? '' : report.riddor_incidents ?? (report.zero_riddor === 'N' ? '' : 0),
    local_spend: report.local_spend ?? '',
    apprenticeships: report.apprenticeships ?? '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const set = (key, value) => setForm(previous => ({ ...previous, [key]: value }));
  const save = async event => {
    event.preventDefault(); setSaving(true); setError('');
    try {
      const { data } = await base44.functions.invoke('updateUKLFKpis', {
        reportId: report.id,
        frameworkContext,
        kpis: {
          completed_on_time: form.completed_on_time,
          completed_to_budget: form.completed_to_budget,
          riddor_incidents: form.riddor_incidents === '' ? null : Number(form.riddor_incidents),
          ...(!frameworkContext ? {local_spend: form.local_spend === '' ? null : Number(form.local_spend)} : {}),
          apprenticeships: form.apprenticeships === '' ? null : Number(form.apprenticeships),
        },
      });
      onSaved(data.kpis);
    } catch { setError('Unable to save KPIs. Please try again.'); }
    finally { setSaving(false); }
  };
  return <form onSubmit={save} className="mt-5 space-y-4 border-t border-border pt-5">
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {OUTCOMES.map(([key, label]) => <label key={key} className="text-sm font-medium text-foreground">{label}<select value={form[key]} onChange={e => set(key, e.target.value)} disabled={saving} className="mt-1 block h-10 w-full rounded-md border border-input bg-background px-3 text-sm"><option value="">Not recorded</option><option value="Y">Yes</option><option value="N">No</option></select></label>)}
      <label className="text-sm font-medium text-foreground">RIDDOR incidents<input type="number" min="0" max="100000" step="1" required value={form.riddor_incidents} onChange={e => set('riddor_incidents', e.target.value)} disabled={saving} className="mt-1 block h-10 w-full rounded-md border border-input bg-background px-3 text-sm" /></label>
      {!frameworkContext && <label className="text-sm font-medium text-foreground">Local spend (£)<input type="number" min="0" max="1000000000000" step="0.01" value={form.local_spend} onChange={e => set('local_spend', e.target.value)} disabled={saving} placeholder="Not recorded" className="mt-1 block h-10 w-full rounded-md border border-input bg-background px-3 text-sm" /></label>}
      <label className="text-sm font-medium text-foreground">Apprenticeships<input type="number" min="0" max="100000" step="1" value={form.apprenticeships} onChange={e => set('apprenticeships', e.target.value)} disabled={saving} placeholder="Not recorded" className="mt-1 block h-10 w-full rounded-md border border-input bg-background px-3 text-sm" /></label>
    </div>
    {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
    <div className="flex gap-2"><button type="submit" disabled={saving} className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50">{saving ? 'Saving…' : 'Save KPIs'}</button><button type="button" onClick={onCancel} disabled={saving} className="rounded-md border border-input px-4 py-2 text-sm font-medium">Cancel</button></div>
  </form>;
}