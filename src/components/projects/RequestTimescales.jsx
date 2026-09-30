import React from 'react';
import { FormSection, FormGrid, FormField, formInputClass } from '@/components/forms/PowerForm';

export const RIBA_TERMS = [
  { key: 'riba1_term_weeks', label: 'RIBA 1 term (weeks)' },
  { key: 'riba2_term_weeks', label: 'RIBA 2 term (weeks)' },
  { key: 'riba3_term_weeks', label: 'RIBA 3 term (weeks)' },
  { key: 'riba4_term_weeks', label: 'RIBA 4 term (weeks)' },
];
export default function RequestTimescales({ form, setForm }) {
  return <FormSection title="Site & Timescales" description="Where the project is and the duration of each RIBA stage">
    <FormGrid>
      <FormField label="Site postcode"><input value={form.site_postcode} onChange={event => setForm(current => ({ ...current, site_postcode: event.target.value }))} className={formInputClass} /></FormField>
      {[...RIBA_TERMS, { key: 'construction_term_weeks', label: 'Construction / RIBA 5–7 term (weeks)' }].map(field => <FormField key={field.key} label={field.label}>
        <input type="number" min="0" step="any" aria-label={field.label} value={form[field.key]} onChange={event => setForm(current => ({ ...current, [field.key]: event.target.value }))} className={formInputClass} />
      </FormField>)}
    </FormGrid>
  </FormSection>;
}