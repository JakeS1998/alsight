import React from 'react';
import FlowColumnRow from '@/components/dataverse/FlowColumnRow';
import { matchFlowChoices } from '@/components/dataverse/flowMappingTypes';
export default function FlowMappingRows({ fields, sourceFields = [], mappings, onChange, disabled, enums = {}, readOnly = false, prefix = '', preservedFields = [], columnPlans = {}, onPlansChange, suggestions = [], loaded = false, required }) {
  const update = (local, changes) => {
    const old = mappings.find(m => m.local === local) || { local, source: '', write: false };
    const next = { ...old, ...changes };
    onChange([...mappings.filter(m => m.local !== local), ...(next.source ? [next] : [])]);
  };
  const plan = (local, mode) => { const next = { ...columnPlans }; if (mode) { next[local] = mode; onChange(mappings.filter(m => m.local !== local)); } else delete next[local]; onPlansChange(next); };
  const columns = { ...fields, ...Object.fromEntries(preservedFields.filter(f => !fields[f]).map(f => [f, null])) };
  return <div className="space-y-2">{Object.entries(columns).map(([local, type]) => {
    const mapping = mappings.find(m => m.local === local), source = sourceFields.find(f => f.name === mapping?.source);
    const compatible = type ? sourceFields.filter(f => !mappings.some(m => m.local !== local && m.source === f.name)) : [];
    const choose = name => { const chosen = sourceFields.find(f => f.name === name), values = matchFlowChoices(['Picklist', 'State', 'Status'].includes(chosen?.type) ? chosen.options || [] : [], enums[local]); const next = { ...columnPlans }; delete next[local]; onPlansChange(next); update(local, { source: name, type: chosen?.type, localType: chosen?.localType, queryName: chosen?.queryName, write: false, lookupTarget: chosen?.lookupTargets?.length === 1 ? chosen.lookupTargets[0] : undefined, values, origin: 'manual' }); };
    return <FlowColumnRow key={local} prefix={prefix} local={local} type={source?.localType || mapping?.localType || type} mapping={mapping} source={source} compatible={compatible} suggested={suggestions.find(m => m.local === local)?.source} mode={columnPlans[local]} disabled={disabled} loaded={loaded} readOnly={readOnly} required={required === local} choices={['Picklist', 'State', 'Status'].includes(source?.type) ? enums[local] : undefined} onChoose={choose} onUpdate={changes => update(local, changes)} onPlan={mode => plan(local, mode)} />;
  })}<p className="text-xs text-muted-foreground">Save the column setup to apply these decisions. Only checked write-back fields can be edited in Dataverse; unmapped and Base44-only fields stay unchanged during sync.</p></div>;
}