import React from 'react';
import { Button } from '@/components/ui/button';
import { FormField, formInputClass } from '@/components/forms/PowerForm';
import { LAD_PERIODS } from '@/components/delivery/ladSchedule';
export default function LADStageRow({ stage, index, onChange, onRemove, last }) {
  const label = `LAD stage ${index + 1}`;
  return <div className="space-y-3 rounded-lg border border-border bg-card p-3">
    <div className="flex items-center justify-between"><h5 className="text-sm font-semibold">Stage {index + 1}</h5><Button type="button" variant="ghost" size="sm" onClick={onRemove} aria-label={`Remove ${label}`}>Remove</Button></div>
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <FormField label="Rate basis"><select aria-label={`${label} rate basis`} value={stage.basis} onChange={e => onChange('basis', e.target.value)} className={formInputClass}><option value="amount">Fixed amount (£)</option><option value="percentage">% of contractor contract sum</option></select></FormField>
      <FormField label={stage.basis === 'percentage' ? 'Rate (%)' : 'Rate (£)'}><input aria-label={`${label} rate`} type="number" min="0" max={stage.basis === 'percentage' ? 100 : undefined} step="0.01" value={stage.value ?? ''} onChange={e => onChange('value', e.target.value)} className={formInputClass} /></FormField>
      <FormField label="Frequency"><select aria-label={`${label} frequency`} value={stage.period} onChange={e => onChange('period', e.target.value)} className={formInputClass}>{Object.entries(LAD_PERIODS).map(([key, name]) => <option key={key} value={key}>Per {name}</option>)}</select></FormField>
      <FormField label="Number of periods" help={last ? 'Blank = thereafter, until completion.' : 'Duration before the next stage starts.'}><input aria-label={`${label} number of periods`} type="number" min="1" max="10000" step="1" value={stage.periods ?? ''} placeholder={last ? 'Thereafter' : 'Required'} onChange={e => onChange('periods', e.target.value)} className={formInputClass} /></FormField>
    </div>
  </div>;
}