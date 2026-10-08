import React from 'react';
import FlowChoiceMapping from '@/components/dataverse/FlowChoiceMapping';
import { compatibleFlowType, normalisedChoice } from '@/components/dataverse/flowMappingTypes';
export default function FlowMappingRows({ fields, sourceFields, mappings, onChange, disabled, enums = {}, readOnly = false, prefix = '' }) {
  const update = (local, changes) => {
    const old = mappings.find(m => m.local === local) || { local, source: '', write: false };
    const next = { ...old, ...changes };
    onChange([...mappings.filter(m => m.local !== local), ...(next.source ? [next] : [])]);
  };
  return <div className="space-y-2">{Object.entries(fields).map(([local, type]) => {
    const mapping = mappings.find(m => m.local === local), source = sourceFields.find(f => f.name === mapping?.source);
    const compatible = sourceFields.filter(f => compatibleFlowType(type, f.type));
    const choose = name => { const chosen = sourceFields.find(f => f.name === name), values = {}; for (const option of chosen?.options || []) { const value = enums[local]?.find(choice => normalisedChoice(choice) === normalisedChoice(option.label)); if (value !== undefined) values[option.value] = value; } update(local, { source: name, write: false, values }); };
    return <div key={local} className="grid gap-2 rounded-lg border border-border p-3 sm:grid-cols-[1fr_2fr_auto] sm:items-center">
      <label htmlFor={`flow-map-${prefix}-${local}`} className="text-sm font-medium capitalize">{local.replaceAll('_', ' ')}</label>
      <select id={`flow-map-${prefix}-${local}`} className="h-9 min-w-0 rounded-md border border-input bg-card px-2 text-sm" disabled={disabled} value={mapping?.source || ''} onChange={e => choose(e.target.value)}><option value="">Not synchronised</option>{compatible.map(f => <option key={f.name} value={f.name}>{f.label} · {f.name}{f.writable ? '' : ' (read-only)'}</option>)}</select>
      <label className="flex items-center gap-2 text-xs"><input type="checkbox" disabled={disabled || readOnly || !source?.writable || local === 'full_name' || (source?.type === 'Boolean' && type === 'String')} checked={Boolean(mapping?.write)} onChange={e => update(local, { write: e.target.checked })} />Allow write-back</label>
      <FlowChoiceMapping source={source} choices={enums[local]} values={mapping?.values} onChange={values => update(local, { values })} disabled={disabled} />
    </div>;
  })}<p className="text-xs text-muted-foreground">Only checked fields can be written back. Contact full name is read-only; edit first and last name instead. Unmapped ALSight fields are preserved.</p></div>;
}