import React from 'react';
import { formatCurrency } from '@/lib/portal';
import { CONTRACTOR_STAGES, CONTRACTOR_LABELS, contractorStageBases, calculateStageOhp } from '@/components/delivery/contractorFeeRows';
export default function ContractorStageOhp({ member, onChange }) {
  const enabled = member.contractor_ohp != null;
  const bases = contractorStageBases(member);
  const update = (stage, field, value) => onChange({ ...member.contractor_ohp,
    [stage]: { type: 'percentage', value: '', ...member.contractor_ohp?.[stage], [field]: value } });
  return <section className="space-y-2 rounded-lg border border-border bg-muted/40 p-3">
    <label className="flex items-center gap-2 text-xs font-semibold"><input type="checkbox" checked={enabled} onChange={e => onChange(e.target.checked ? {} : null)} />Use per-stage contractor OHP</label>
    <p className="text-xs text-muted-foreground">{enabled ? 'Replaces proposal-level OHP for this contractor. Blank values mean no OHP. Save team to keep these rates.' : 'Proposal-level OHP remains in use. Enable to set separate percentage or fixed fees for each stage.'}</p>
    {enabled && <div className="overflow-x-auto"><table className="w-full min-w-[540px] text-xs">
      <thead className="text-left text-muted-foreground"><tr><th className="p-1.5">Stage</th><th className="p-1.5 text-right">Base £</th><th className="p-1.5">OHP basis</th><th className="p-1.5 text-right">OHP value</th><th className="p-1.5 text-right">OHP £</th><th className="p-1.5 text-right">Total £</th></tr></thead>
      <tbody>{CONTRACTOR_STAGES.map(stage => {
        const setting = member.contractor_ohp[stage] || { type: 'percentage', value: '' };
        const ohp = calculateStageOhp(bases[stage], setting);
        return <tr key={stage} className="border-t border-border">
          <td className="p-1.5 font-medium">{CONTRACTOR_LABELS[stage]}</td><td className="p-1.5 text-right">{formatCurrency(bases[stage])}</td>
          <td className="p-1.5"><select aria-label={`${CONTRACTOR_LABELS[stage]} OHP basis`} value={setting.type} onChange={e => update(stage, 'type', e.target.value)} className="h-8 rounded border border-input bg-background px-2"><option value="percentage">Percentage %</option><option value="fixed">Fixed fee £</option></select></td>
          <td className="p-1.5 text-right"><input aria-label={`${CONTRACTOR_LABELS[stage]} OHP value`} type="number" min="0" step="0.01" value={setting.value} onChange={e => update(stage, 'value', e.target.value)} placeholder="0" className="h-8 w-24 rounded border border-input bg-background px-2 text-right" /></td>
          <td className="p-1.5 text-right">{formatCurrency(ohp)}</td><td className="p-1.5 text-right font-semibold">{formatCurrency(bases[stage] + ohp)}</td>
        </tr>;
      })}</tbody>
    </table></div>}
  </section>;
}