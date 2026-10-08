import React from 'react';
import { matchFlowChoices, normalisedChoice } from '@/components/dataverse/flowMappingTypes';
export default function FlowChoiceMapping({ source, choices, values = {}, onChange, disabled }) {
  if (!source?.options?.length || !choices) return null;
  const matched = matchFlowChoices(source.options, choices, values);
  return <div className="space-y-2 rounded-md bg-muted p-3 sm:col-span-3">
    <p className="text-xs font-medium">Dataverse choices auto-match ALSight values</p>
    <p className="text-xs text-muted-foreground">Matching ignores case, spaces and punctuation, and recognises N/A and TBC. Existing selections are kept; only unmatched choices need a selection.</p>
    {source.options.map(option => {
      const hasMatch = Object.hasOwn(matched, option.value);
      const automatic = hasMatch && normalisedChoice(matched[option.value]) === normalisedChoice(option.label);
      return <label key={option.value} className="grid grid-cols-2 items-center gap-3 text-xs">
        <span>{option.label} ({option.value})<span className={hasMatch ? 'ml-2 text-muted-foreground' : 'ml-2 text-destructive'}>{automatic ? 'Auto-matched' : hasMatch ? 'Saved selection' : 'Needs selection'}</span></span>
        <select className="h-8 min-w-0 rounded border border-input bg-card px-2" disabled={disabled} value={hasMatch ? matched[option.value] : '__unmapped__'} onChange={e => onChange({ ...matched, [option.value]: e.target.value })}>
          <option value="__unmapped__" disabled={hasMatch}>Choose a value</option>{choices.map(choice => <option key={choice} value={choice}>{choice || '(blank)'}</option>)}
        </select>
      </label>;
    })}
  </div>;
}