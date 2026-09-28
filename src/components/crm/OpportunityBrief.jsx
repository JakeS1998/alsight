import React, { useState } from 'react';
import { Button } from '@/components/ui/button';

const FIELDS = [
  ['site_postcode', 'Site postcode'], ['funding_route', 'Funding route'],
  ['target_programme', 'Target programme'], ['key_stakeholders', 'Key stakeholders'],
  ['scope_summary', 'Scope of works'], ['client_objectives', 'Client objectives'],
  ['initial_constraints', 'Site / project constraints'],
];
export default function OpportunityBrief({ item, onSave, canEdit, saving }) {
  const [draft, setDraft] = useState(Object.fromEntries(FIELDS.map(([key]) => [key, item[key] || ''])));
  return <section className="space-y-4 rounded-xl border border-border bg-card p-5">
    <div><h2 className="font-semibold">Project design brief</h2><p className="text-sm text-muted-foreground">Capture the early scope before delivery begins.</p></div>
    {canEdit && item.status === 'open' ? <form onSubmit={e => { e.preventDefault(); onSave(draft); }} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">{FIELDS.map(([key, label]) => <label key={key} className={`block space-y-1 text-sm ${['scope_summary','client_objectives','initial_constraints'].includes(key) ? 'sm:col-span-2' : ''}`}><span>{label}</span>{['scope_summary','client_objectives','initial_constraints'].includes(key) ? <textarea rows={3} maxLength={5000} value={draft[key]} onChange={e => setDraft({ ...draft, [key]: e.target.value })} className="w-full rounded-lg border border-input p-2" /> : <input maxLength={500} value={draft[key]} onChange={e => setDraft({ ...draft, [key]: e.target.value })} className="w-full rounded-lg border border-input p-2" />}</label>)}</div>
      <Button disabled={saving}>{saving ? 'Saving…' : 'Save design brief'}</Button>
    </form> : <dl className="grid gap-4 sm:grid-cols-2">{FIELDS.map(([key, label]) => <div key={key}><dt className="text-xs text-muted-foreground">{label}</dt><dd className="whitespace-pre-wrap text-sm">{item[key] || '—'}</dd></div>)}</dl>}
  </section>;
}