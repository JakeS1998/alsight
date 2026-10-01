import React from 'react';
import { formatCurrency } from '@/lib/portal';
import { CONTRACTOR_STAGES, CONTRACTOR_LABELS, contractorStageBases, calculateStageOhp } from '@/components/delivery/contractorFeeRows';
export default function ContractorStageOhp({ member, onChange }) {
  const enabled = member.contractor_ohp !== null;
  const bases = contractorStageBases(member);
  const amounts = Object.fromEntries(CONTRACTOR_STAGES.map(stage => [stage, enabled ? calculateStageOhp(bases[stage], member.contractor_ohp?.[stage]) : 0]));
  const total = CONTRACTOR_STAGES.reduce((sum, stage) => sum + bases[stage] + amounts[stage], 0);
  const update = (stage, field, value) => onChange({ ...member.contractor_ohp,
    [stage]: { type: 'percentage', value: '', ...member.contractor_ohp?.[stage], [field]: value } });
  const inputClass = 'h-8 w-full rounded border border-input bg-background px-2 text-xs';
  return <section className="space-y-2">
    <label className="flex items-center gap-2 text-xs font-semibold"><input type="checkbox" checked={enabled} onChange={e => onChange(e.target.checked ? {} : null)} />Use per-stage contractor OHP</label>
    <p className="text-xs text-muted-foreground">{enabled ? 'Replaces proposal-level OHP for this contractor. Blank values mean no OHP. Save team to keep these rates.' : 'Proposal-level OHP remains in use. Enable to set separate percentage or fixed fees for each stage.'}</p>
    {enabled && <div className="overflow-x-auto rounded-lg border border-border"><table className="w-full min-w-[720px] text-xs">
      <thead className="bg-muted text-left text-muted-foreground"><tr><th className="w-1/3 p-2">Contractor OHP (£)</th>{CONTRACTOR_STAGES.map(stage => <th key={stage} className="w-24 p-2">{CONTRACTOR_LABELS[stage]}</th>)}</tr></thead>
      <tbody className="divide-y divide-border">
        <tr><td className="p-2 font-medium">Base fees</td>{CONTRACTOR_STAGES.map(stage => <td key={stage} className="p-2 text-right">{formatCurrency(bases[stage])}</td>)}</tr>
        <tr><td className="p-2 font-medium">OHP basis</td>{CONTRACTOR_STAGES.map(stage => <td key={stage} className="p-1.5"><select aria-label={`${CONTRACTOR_LABELS[stage]} OHP basis`} value={member.contractor_ohp?.[stage]?.type || 'percentage'} onChange={e => update(stage, 'type', e.target.value)} className={inputClass}><option value="percentage">Percentage %</option><option value="fixed">Fixed fee £</option></select></td>)}</tr>
        <tr><td className="p-2 font-medium">OHP value</td>{CONTRACTOR_STAGES.map(stage => <td key={stage} className="p-1.5"><input aria-label={`${CONTRACTOR_LABELS[stage]} OHP value`} type="number" min="0" step="0.01" value={member.contractor_ohp?.[stage]?.value ?? ''} onChange={e => update(stage, 'value', e.target.value)} placeholder="0" className={`${inputClass} text-right`} /></td>)}</tr>
        <tr><td className="p-2 font-medium">Calculated OHP</td>{CONTRACTOR_STAGES.map(stage => <td key={stage} className="p-2 text-right">{formatCurrency(amounts[stage])}</td>)}</tr>
      </tbody>
      <tfoot className="border-t border-border bg-muted font-semibold"><tr><td className="p-2">Total including OHP</td>{CONTRACTOR_STAGES.map(stage => <td key={stage} className="p-2 text-right">{formatCurrency(bases[stage] + amounts[stage])}</td>)}</tr></tfoot>
    </table></div>}
    <div className="flex items-center justify-between rounded-lg border border-border bg-primary/5 p-3 text-sm font-semibold"><span>{enabled ? 'Contractor total (including OHP)' : 'Contractor base fee total (excludes proposal-level OHP)'}</span><span>{formatCurrency(total)}</span></div>
  </section>;
}