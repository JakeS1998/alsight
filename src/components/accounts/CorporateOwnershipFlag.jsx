import React from 'react';
export default function CorporateOwnershipFlag({ownership}) {
  if (!ownership) return null;
  const individuals=ownership.individual_pscs || [];
  const parent=ownership.corporate_parent_confirmed;
  return <div className="mt-4 rounded-md border border-border bg-muted p-3 text-xs">
    <p className="font-semibold">{individuals.length ? `Individual PSCs recorded (${individuals.length})` : ownership.corporate_psc_count ? 'Corporate PSCs recorded' : 'No named current PSCs returned'}</p>
    {individuals.length>0 && <ul className="mt-2 space-y-2" aria-label="Current individual persons with significant control">{individuals.map((person,index)=><li key={`${person.name}-${index}`}><span className="font-medium">{person.name}</span>{person.controls?.length>0 && <p className="text-muted-foreground">{person.controls.map(control=>control.replaceAll('-',' ')).join('; ')}</p>}</li>)}</ul>}
    <p className="mt-2 font-semibold">PCG: {parent ? 'Potential corporate guarantor identified' : 'Corporate guarantor not established'}</p>
    <p className="mt-1 text-muted-foreground">{parent ? 'A corporate parent is linked in the PSC register. A parent company guarantee still needs confirmation of ownership, financial strength, legal capacity and willingness to guarantee.' : individuals.length && !ownership.corporate_psc_count && ownership.register_complete ? 'Only individual PSCs are recorded. Individuals cannot provide a parent company guarantee; any personal guarantee is a separate arrangement. This does not rule out a corporate parent outside the PSC disclosures.' : 'PSC disclosures do not establish a unique majority-controlling corporate parent. Further ownership checks are needed before treating a parent company guarantee as an option.'}</p>
    {!ownership.register_complete && <p className="mt-2 text-muted-foreground">PSC register retrieval is incomplete; ownership and guarantee options remain unconfirmed.</p>}
    <a className="mt-2 inline-block underline" href={ownership.source_reference} target="_blank" rel="noreferrer">View Companies House PSC register</a>
  </div>;
}