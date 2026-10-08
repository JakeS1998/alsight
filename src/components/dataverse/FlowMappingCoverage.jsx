import React from 'react';
export default function FlowMappingCoverage({ spec, mappings = [] }) {
  const mapped = new Set(mappings.map(mapping => mapping.local));
  const unmapped = [...Object.keys(spec.fields).filter(field => !mapped.has(field)), ...(spec.preservedFields || [])];
  return <details className="rounded-lg border border-border bg-muted p-3 text-xs"><summary className="cursor-pointer font-medium">{mapped.size} mapped fields · {unmapped.length} preserved fields</summary><p className="mt-2 text-muted-foreground">These fields are not refreshed by Dataverse. Existing values, including placeholders, stay unchanged.</p><div className="mt-2 flex flex-wrap gap-2">{unmapped.map(field => <span key={field} className="rounded border border-border bg-card px-2 py-1">{field.replaceAll('_', ' ')}</span>)}</div></details>;
}