import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { RIBA_TERMS } from '@/components/projects/RequestTimescales';
const fields = [
  ['name', 'Add a project name before submitting.'], ['client_account_id', 'No client linked — the reviewer will need to identify the client.'],
  ['estimated_value', 'No estimated value — budget review will be incomplete.'], ['site_postcode', 'No site postcode — confirm the project location.'],
  ['bdm_aad_id', 'No BDM assigned — confirm who will manage this request.'], ['director_aad_id', 'No Director assigned — confirm the reviewer.'],
  ['department_id', 'No region selected — regional reporting will be incomplete.'],
  ...RIBA_TERMS.map(field => [field.key, `${field.label} is missing — expected completion cannot be calculated.`]),
  ['construction_term_weeks', 'Construction duration is missing — expected completion cannot be calculated.'],
];
export default function RequestReviewHints({ form, confirmed }) {
  const missing = fields.filter(([key]) => form[key] === '' || form[key] == null);
  const signature = missing.map(([key]) => key).join(',');
  const [dismissed, setDismissed] = useState(false);
  useEffect(() => setDismissed(false), [signature]);
  if (!missing.length || dismissed) return null;
  return <div role="alert" className="relative max-h-40 shrink-0 overflow-y-auto rounded-lg border border-destructive/30 bg-muted/40 p-3 pr-9 text-sm">
    <button type="button" aria-label="Dismiss review hints" onClick={() => setDismissed(true)} className="absolute right-2 top-2 text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
    <p className="mb-1 font-semibold text-destructive">Check these details before confirming</p>
    <ul className="list-disc space-y-1 pl-4 text-muted-foreground">{missing.map(([key, hint]) => <li key={key}>{hint}{confirmed.includes(key) && <span className="text-xs"> Marked unavailable in the brief.</span>}</li>)}</ul>
    <p className="mt-2 text-xs text-muted-foreground">Except for the project name, these are advisory and do not prevent submission.</p>
  </div>;
}