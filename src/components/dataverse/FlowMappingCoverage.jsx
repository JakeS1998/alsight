import React from 'react';
export default function FlowMappingCoverage({ spec, mappings = [], columnPlans = {}, dirty = false }) {
  const fields = [...new Set([...Object.keys(spec.fields || {}), ...(spec.preservedFields || [])])];
  const mapped = new Set(mappings.filter(mapping => mapping.source).map(mapping => mapping.local));
  const groups = [
    { label: 'New column needed', tone: 'border-destructive/30 bg-destructive/10 text-destructive', fields: fields.filter(field => columnPlans[field] === 'needs_dataverse') },
    { label: 'Not mapped — decision needed', tone: 'border-primary/40 bg-primary/10 text-foreground', fields: fields.filter(field => !mapped.has(field) && !columnPlans[field] && !(spec.preservedFields || []).includes(field)) },
    { label: 'Base44 only', tone: 'border-border bg-muted text-muted-foreground', fields: fields.filter(field => columnPlans[field] === 'base44_only' || (!mapped.has(field) && !columnPlans[field] && (spec.preservedFields || []).includes(field))) }
  ];
  const gaps = groups[0].fields.length + groups[1].fields.length;
  return <details className="rounded-lg border border-border bg-card p-3 text-xs">
    <summary className="cursor-pointer font-medium">
      <span className={gaps ? 'mr-2 text-destructive' : 'mr-2 text-success'}>{gaps ? `Gaps flagged: ${gaps}` : 'No mapping gaps'}</span>
      <span>{fields.filter(field => mapped.has(field)).length} mapped · {groups[0].fields.length} new column needed · {groups[1].fields.length} not mapped · {groups[2].fields.length} Base44 only</span>
      {dirty && <span className="ml-2 text-muted-foreground">(unsaved changes)</span>}
    </summary>
    <p className="mt-3 text-muted-foreground">Use Mapped columns setup to map a column or mark it as New column needed or Base44 only. Base44-only fields are intentional exclusions, not mapping gaps.</p>
    <div className="mt-3 space-y-3">{groups.map(group => <section key={group.label}>
      <h4 className="font-semibold">{group.label} ({group.fields.length})</h4>
      {group.fields.length ? <div className="mt-2 flex flex-wrap gap-2">{group.fields.map(field => <span key={field} className={`rounded border px-2 py-1 ${group.tone}`}><span className="capitalize">{field.replaceAll('_', ' ')}</span> · {group.label}</span>)}</div> : <p className="mt-1 text-muted-foreground">None</p>}
    </section>)}</div>
  </details>;
}