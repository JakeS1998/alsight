import React from 'react';
export default function FlowLookupTarget({ source, mapping, disabled, onUpdate }) {
  const targets = source?.lookupTargets || [];
  if (source?.type !== 'Lookup' || !source.writable || targets.length < 2) return null;
  return <label className="block text-xs text-muted-foreground">Write-back lookup target<select aria-label="Write-back lookup target" className="mt-1 h-9 w-full rounded-md border border-input bg-card px-2 text-sm text-foreground" value={mapping?.lookupTarget?.entity || ''} disabled={disabled || !mapping} onChange={event => onUpdate({ lookupTarget: targets.find(target => target.entity === event.target.value), write: false })}><option value="">Choose a target table</option>{targets.map(target => <option key={`${target.entity}:${target.navigation}`} value={target.entity}>{target.entity}</option>)}</select></label>;
}