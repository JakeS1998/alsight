import React from 'react';
import { Trash2 } from 'lucide-react';
import { CONTRACTOR_STAGES, CONTRACTOR_LABELS } from '@/components/delivery/contractorFeeRows';
const inputClass = 'h-8 w-full rounded border border-input bg-background px-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary/20';
export default function ContractorFeeTable({ title, rows, activity, update, remove }) {
  if (!rows.length) return null;
  const stages = activity ? ['riba_5_7'] : CONTRACTOR_STAGES.slice(0, 4);
  return <section className="space-y-1">
    <h5 className="text-xs font-semibold text-muted-foreground">{title} (£)</h5>
    <div className="overflow-x-auto rounded-lg border border-border"><table className="w-full min-w-[720px] text-xs">
      <thead className="bg-muted text-left text-muted-foreground"><tr>
        <th className="w-1/3 p-2">Description</th><th className="p-2">Supplier (optional)</th>
        {stages.map(stage => <th key={stage} className="w-24 p-2">{CONTRACTOR_LABELS[stage]}</th>)}<th className="w-8 p-2" />
      </tr></thead>
      <tbody className="divide-y divide-border">{rows.map(row => <tr key={row.id}>
        <td className="p-1.5"><input aria-label={`${title} description`} value={row.description || ''} onChange={e => update(row.id, 'description', e.target.value)} placeholder="Description" className={inputClass} /></td>
        <td className="p-1.5"><input aria-label={`${row.description || title} supplier`} value={row.supplier || ''} onChange={e => update(row.id, 'supplier', e.target.value)} placeholder="Supplier" className={inputClass} /></td>
        {stages.map(stage => <td key={stage} className="p-1.5"><input aria-label={`${row.description || title} ${CONTRACTOR_LABELS[stage]} fee`} type="number" min="0" step="0.01" value={row.amounts[stage] ?? ''} placeholder="—" onChange={e => update(row.id, stage, e.target.value)} className={`${inputClass} text-right`} /></td>)}
        <td className="p-1.5"><button type="button" aria-label={`Remove ${row.description || title}`} onClick={() => remove(row.id)} className="rounded p-1 text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4" /></button></td>
      </tr>)}</tbody>
    </table></div>
  </section>;
}