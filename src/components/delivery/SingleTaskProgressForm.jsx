import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { FormSection, FormGrid, FormField, formInputClass } from '@/components/forms/PowerForm';

const FIELDS = {
  agreement: [['scope_summary', 'Task scope', 'textarea'], ['client_objectives', 'Client objectives', 'textarea']],
  works: [['contractor', 'Task supplier / contractor', 'text'], ['contract_start', 'Works start', 'date'], ['forecast_pc', 'Target completion', 'date'], ['key_site_issues', 'Works update / issues', 'textarea']],
  completion: [['pc_achieved', 'Task completion date', 'date'], ['pc_certificate', 'Completion confirmation (link)', 'text'], ['lessons_learned', 'Completion notes', 'textarea']],
};
export default function SingleTaskProgressForm({ phase, delivery, setField, onSave, saving, children }) {
  const [error, setError] = useState('');
  const save = async () => { setError(''); try { await onSave(); } catch (failure) { setError(failure.message || 'Unable to save task details.'); } };
  return <FormSection title={phase === 'agreement' ? 'Task scope' : phase === 'works' ? '2 · Works' : '3 · Completion'}>
    <FormGrid>{FIELDS[phase].map(([key, label, type]) => <FormField key={key} label={label}>
      {type === 'textarea' ? <textarea rows={3} value={delivery[key] || ''} onChange={event => setField(key, event.target.value)} className={`${formInputClass} h-auto py-2`} /> : <input type={type} value={type === 'date' ? String(delivery[key] || '').slice(0, 10) : delivery[key] || ''} onChange={event => setField(key, event.target.value)} className={formInputClass} />}
    </FormField>)}</FormGrid>
    {phase === 'completion' && <FormField label="Client handover"><select value={delivery.client_handover || ''} onChange={event => setField('client_handover', event.target.value)} className={formInputClass}><option value="">Not recorded</option><option value="outstanding">Outstanding</option><option value="partial">Partial</option><option value="complete">Complete</option></select></FormField>}
    {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
    <div className="flex justify-end"><Button type="button" disabled={saving} onClick={save}>{saving ? 'Saving…' : 'Save task details'}</Button></div>
    {children}
  </FormSection>;
}