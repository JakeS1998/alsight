import React from 'react';
import { FormField, formInputClass } from '@/components/forms/PowerForm';
import { formatCurrency, formatDate } from '@/lib/portal';
import LADScheduleEditor from '@/components/delivery/LADScheduleEditor';
export default function ConstructionLADTerms({ delivery, setField, automation }) {
  return <div className="space-y-3 rounded-lg border border-border bg-muted/30 p-4">
    <h4 className="text-sm font-semibold">Liquidated and ascertained damages (LADs)</h4>
    <div className="grid gap-4 sm:grid-cols-2">

      <FormField label="LAD completion date (including agreed EOT)"><input aria-label="LAD completion date (including agreed EOT)" type="date" value={delivery.lad_completion_date || ''} onChange={e => setField('lad_completion_date', e.target.value)} className={formInputClass} /></FormField>
      <FormField label="LAD terms / reference"><textarea aria-label="LAD terms / reference" rows={2} value={delivery.lad_terms || ''} onChange={e => setField('lad_terms', e.target.value)} className={`${formInputClass} h-auto py-2`} /></FormField>
    </div>
    <LADScheduleEditor delivery={delivery} setField={setField} />
    <p className="text-xs text-muted-foreground">The completion date defaults to Original PC, otherwise the main-page expected construction completion; enter the adjusted contractual date when an EOT is agreed.</p>
    <p className="text-sm">{automation.amount == null ? automation.ladReason : `Indicative exposure: ${formatCurrency(automation.amount)} · ${automation.delayDays} day${automation.delayDays === 1 ? '' : 's'} beyond ${formatDate(automation.baseline)}`}</p>
    {automation.ladBreakdown.map(row => <p key={row.index} className="text-xs text-muted-foreground">Stage {row.index + 1}: {row.periods} started {row.period}{row.periods === 1 ? '' : 's'} × {formatCurrency(row.rate)} = {formatCurrency(row.amount)}</p>)}
    <p className="text-xs text-muted-foreground">Date-based estimate only, not confirmation that LADs are payable. For unfinished works, the later of Forecast PC and today is used; recorded actual completion stops the calculation.</p>
  </div>;
}