import React from 'react';
export default function FlowMappingRows({ fields, sourceFields, mappings, onChange, disabled }) {
  const update = (local, changes) => {
    const old = mappings.find(m => m.local === local) || { local, source: '', write: false };
    const next = { ...old, ...changes };
    onChange([...mappings.filter(m => m.local !== local), ...(next.source ? [next] : [])]);
  };
  return <div className="space-y-2">{Object.entries(fields).map(([local, type]) => {
    const mapping = mappings.find(m => m.local === local), source = sourceFields.find(f => f.name === mapping?.source);
    const compatible = sourceFields.filter(f => f.type === type || (['String', 'Memo'].includes(type) && ['String', 'Memo'].includes(f.type)) || (['Money', 'Decimal', 'Double'].includes(type) && ['Money', 'Decimal', 'Double', 'Integer', 'BigInt'].includes(f.type)));
    return <div key={local} className="grid gap-2 rounded-lg border border-border p-3 sm:grid-cols-[1fr_2fr_auto] sm:items-center">
      <label htmlFor={`flow-map-${local}`} className="text-sm font-medium capitalize">{local.replaceAll('_', ' ')}</label>
      <select id={`flow-map-${local}`} className="h-9 min-w-0 rounded-md border border-input bg-card px-2 text-sm" disabled={disabled} value={mapping?.source || ''} onChange={e => update(local, { source: e.target.value, write: false })}><option value="">Not synchronised</option>{compatible.map(f => <option key={f.name} value={f.name}>{f.name}{f.writable ? '' : ' (read-only)'}</option>)}</select>
      <label className="flex items-center gap-2 text-xs"><input type="checkbox" disabled={disabled || !source?.writable || (local === 'full_name')} checked={Boolean(mapping?.write)} onChange={e => update(local, { write: e.target.checked })} />Allow write-back</label>
    </div>;
  })}<p className="text-xs text-muted-foreground">Only checked fields can be written back. Contact full name is read-only; edit first and last name instead. Unmapped ALSight fields are preserved.</p></div>;
}