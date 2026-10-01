import React from 'react';
import { FormGrid, FormField, formInputClass } from '@/components/forms/PowerForm';
import { DropdownWithNotes } from '@/components/delivery/DropdownWithNotes';
export const SCOPING_KEYS = ['funding_route', 'funding_route_notes', 'feasibility_status', 'feasibility_notes', 'probability', 'site_visit_completed', 'target_programme', 'scope_summary', 'client_objectives', 'initial_constraints', 'key_stakeholders', 'next_action'];
const FUNDING = ['UK Leisure Framework', 'Local Authority Capital', 'Sport England', 'Salix', 'Section 106', 'Other'];
const FEASIBILITY = [{ value: 'not_started', label: 'Not started' }, { value: 'in_progress', label: 'In progress' }, { value: 'complete', label: 'Complete' }];
export default function ScopingFields({ value, setField, children, readOnly = false }) {
  return <fieldset disabled={readOnly}><FormGrid>
    <DropdownWithNotes label="Funding route" value={value.funding_route} onChange={v => setField('funding_route', v)} options={FUNDING} notes={value.funding_route_notes} onNotesChange={v => setField('funding_route_notes', v)} />
    {children}
    <DropdownWithNotes label="Feasibility / options appraisal" value={value.feasibility_status} onChange={v => setField('feasibility_status', v)} options={FEASIBILITY} notes={value.feasibility_notes} onNotesChange={v => setField('feasibility_notes', v)} />
    <FormField label="Probability / confidence (%)"><input type="number" min="0" max="100" value={value.probability ?? ''} onChange={e => setField('probability', e.target.value === '' ? null : Number(e.target.value))} className={formInputClass} /></FormField>
    <FormField label="Site visit completed?"><label className="flex h-10 items-center gap-2 text-sm"><input type="checkbox" checked={!!value.site_visit_completed} onChange={e => setField('site_visit_completed', e.target.checked)} className="h-4 w-4 rounded border-input accent-primary" />Completed</label></FormField>
    <FormField label="Target programme"><input value={value.target_programme || ''} onChange={e => setField('target_programme', e.target.value)} className={formInputClass} /></FormField>
    {[['scope_summary', 'Scope summary'], ['client_objectives', 'Client objectives'], ['initial_constraints', 'Initial constraints'], ['key_stakeholders', 'Key stakeholders']].map(([key, label]) => <FormField key={key} label={label}><textarea rows={2} value={value[key] || ''} onChange={e => setField(key, e.target.value)} className={`${formInputClass} h-auto py-2`} /></FormField>)}
    <FormField label="Next action"><input value={value.next_action || ''} onChange={e => setField('next_action', e.target.value)} className={formInputClass} /></FormField>
  </FormGrid></fieldset>;
}