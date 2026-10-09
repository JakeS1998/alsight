import React from 'react';
import { Button } from '@/components/ui/button';
import LADStageRow from '@/components/delivery/LADStageRow';
import { getLADStages, ladStageError } from '@/components/delivery/ladSchedule';
import { formatCurrency } from '@/lib/portal';
export default function LADScheduleEditor({ delivery, setField }) {
  const stages = getLADStages(delivery), error = ladStageError(stages);
  const save = value => setField('lad_stages', value);
  const add = () => save([...stages.map((stage, index) => index === stages.length - 1 && (stage.periods == null || stage.periods === '') ? { ...stage, periods: 1 } : stage), { basis: 'amount', value: '', period: 'week', periods: null }]);
  return <div className="space-y-3">
    <p className="text-xs text-muted-foreground">Rates apply in stage order. Percentages use the contractor contract sum excluding VAT: {delivery.contract_sum == null || delivery.contract_sum === '' ? 'not recorded' : formatCurrency(delivery.contract_sum)}.</p>
    <p className="text-xs text-muted-foreground">Each started period is charged in full. Months and years follow calendar anniversaries, clamped to month-end where needed.</p>
    {stages.map((stage, index) => <LADStageRow key={index} stage={stage} index={index} last={index === stages.length - 1} onChange={(key, value) => save(stages.map((item, i) => i === index ? { ...item, [key]: value } : item))} onRemove={() => save(stages.filter((_, i) => i !== index))} />)}
    {!stages.length && <p className="text-sm text-muted-foreground">No LAD stages recorded.</p>}
    {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
    <Button type="button" variant="outline" size="sm" onClick={add} disabled={stages.length >= 10}>Add LAD stage</Button>
    <p className="text-xs text-muted-foreground">Example: 5% per week for 5 periods, then 2% per week with a blank duration. Save construction to retain your terms.</p>
  </div>;
}