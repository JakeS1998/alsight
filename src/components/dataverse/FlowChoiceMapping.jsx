import React from 'react';
import { matchFlowChoices, normalisedChoice } from '@/components/dataverse/flowMappingTypes';
export default function FlowChoiceMapping({ source, choices, values = {}, onChange, disabled }) {
  if (!['Picklist', 'State', 'Status'].includes(source?.type) || !source.options?.length) return null;
  const defaults = matchFlowChoices(source.options, choices);
  const matched = matchFlowChoices(source.options, choices, values);
  return <div className="space-y-2 rounded-md bg-muted p-3 sm:col-span-3">
    <p className="text-xs font-medium">Choices from the selected Dataverse column</p>
    <p className="text-xs text-muted-foreground">Dropdown options come directly from Dataverse. Each choice maps automatically to its label or an existing matching ALSight value; saved selections are kept. Reload column options to pick up Dataverse changes.</p>
    {source.options.map(option => {
      const hasMatch = Object.hasOwn(matched, option.value);
      const automatic = hasMatch && normalisedChoice(matched[option.value]) === normalisedChoice(option.label);
      return <label key={option.value} className="grid grid-cols-2 items-center gap-3 text-xs">
        <span>{option.label} ({option.value})<span className={hasMatch ? 'ml-2 text-muted-foreground' : 'ml-2 text-destructive'}>{automatic ? 'Auto-matched' : hasMatch ? 'Saved selection' : 'Needs selection'}</span></span>
        <select className="h-8 min-w-0 rounded border border-input bg-card px-2" disabled={disabled} value={hasMatch ? matched[option.value] : '__unmapped__'} onChange={e => onChange({ ...matched, [option.value]: e.target.value })}>
          {hasMatch && !source.options.some(choice => defaults[choice.value] === matched[option.value]) && <option value={matched[option.value]}>{matched[option.value] || '(blank)'} (saved)</option>}
          {source.options.map(choice => <option key={choice.value} value={defaults[choice.value]}>{choice.label || '(blank)'}</option>)}
        </select>
      </label>;
    })}
  </div>;
}