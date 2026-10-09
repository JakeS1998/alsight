import React from 'react';
import { Button } from '@/components/ui/button';
export default function UKLFDigestRecipients({ users, selected, onChange, disabled, more, onMore }) {
  const toggle = id => onChange(selected.includes(id) ? selected.filter(value => value !== id) : [...selected, id]);
  return <fieldset disabled={disabled} className="space-y-2">
    <legend className="text-sm font-semibold">Additional selected recipients</legend>
    <p className="text-xs text-muted-foreground">Choose up to 50 registered portal users; framework stakeholders are already included automatically.</p>
    <div className="max-h-56 space-y-2 overflow-y-auto rounded-lg border border-border p-3">{users.length ? users.map(person => <label key={person.id} className="flex items-start gap-3 text-sm"><input type="checkbox" checked={selected.includes(person.id)} onChange={() => toggle(person.id)} disabled={!selected.includes(person.id) && selected.length >= 50} className="mt-1" /><span>{person.full_name || 'Full name not recorded'}<span className="block text-xs text-muted-foreground">{person.email}</span></span></label>) : <p className="text-sm text-muted-foreground">No additional portal users available.</p>}</div>
    {more && <Button type="button" variant="outline" size="sm" onClick={onMore}>Load more users</Button>}
  </fieldset>;
}