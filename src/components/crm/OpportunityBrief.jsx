import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import ScopingFields, { SCOPING_KEYS } from '@/components/delivery/ScopingFields';
import { FormField, formInputClass } from '@/components/forms/PowerForm';
import { chance } from '@/components/crm/crm';

export default function OpportunityBrief({ item, onSave, canEdit, saving }) {
  const [draft, setDraft] = useState(() => ({ ...Object.fromEntries(SCOPING_KEYS.map(key => [key, item[key] ?? ''])), site_postcode: item.site_postcode || '', probability: chance(item), site_visit_completed: !!item.site_visit_completed }));
  return <section className="space-y-4 rounded-xl border border-border bg-card p-5">
    <div><h2 className="font-semibold">Opportunity &amp; Scoping</h2><p className="text-sm text-muted-foreground">The same scoping fields used in project management, carried across automatically on handover.</p></div>
    <ScopingFields value={draft} setField={(key, value) => setDraft(previous => ({ ...previous, [key]: value }))} readOnly={!canEdit || item.status !== 'open'}>
      <FormField label="Site postcode"><input value={draft.site_postcode} onChange={event => setDraft(previous => ({ ...previous, site_postcode: event.target.value }))} className={formInputClass} /></FormField>
    </ScopingFields>
    {canEdit && item.status === 'open' && <Button disabled={saving} onClick={() => onSave(draft)}>{saving ? 'Saving…' : 'Save scoping'}</Button>}
  </section>;
}