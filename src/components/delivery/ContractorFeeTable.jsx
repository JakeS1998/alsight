import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/portal';
import { CONTRACTOR_STAGES, CONTRACTOR_LABELS } from '@/components/delivery/contractorFeeRows';
const inputClass = 'h-8 min-w-0 w-full rounded border border-input bg-background px-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary/20';
export default function ContractorFeeTable({ title, rows, activity, update, remove, addLabel, onAdd }) {
  const stages = activity ? ['riba_5_7'] : CONTRACTOR_STAGES.slice(0, 4);
  return <section className="space-y-1">
    <div className="flex flex-wrap items-center justify-between gap-2">
      <h5 className="text-xs font-semibold text-muted-foreground">{title} (£)</h5>
      <Button type="button" variant="outline" size="sm" onClick={onAdd}><Plus className="h-4 w-4" />{addLabel}</Button>
    </div>
    {rows.length > 0 && <div className="min-w-0 overflow-x-auto rounded-lg border border-border md:overflow-x-visible"><table className="w-full min-w-[640px] text-xs md:min-w-0 md:table-fixed md:break-words md:[&_td]:px-1 md:[&_th]:px-1">
      <colgroup><col className={activity ? 'w-[36%]' : 'w-[24%]'} /><col className={activity ? 'w-[40%]' : 'w-[22%]'} />{stages.map(stage => <col key={stage} className={activity ? 'w-[20%]' : 'w-[12.5%]'} />)}<col className="w-[4%]" /></colgroup>
      <thead className="bg-muted text-left text-muted-foreground"><tr>
        <th className="p-2">Description</th><th className="p-2">Supplier (optional)</th>
        {stages.map(stage => <th key={stage} className="p-2">{CONTRACTOR_LABELS[stage]}</th>)}<th className="p-2" />
      </tr></thead>
      <tbody className="divide-y divide-border">{rows.map(row => <tr key={row.id}>
        <td className="p-1.5"><input aria-label={`${title} description`} value={row.description || ''} onChange={e => update(row.id, 'description', e.target.value)} placeholder="Description" className={inputClass} /></td>
        <td className="p-1.5"><input aria-label={`${row.description || title} supplier`} value={row.supplier || ''} onChange={e => update(row.id, 'supplier', e.target.value)} placeholder="Supplier" className={inputClass} /></td>
        {stages.map(stage => <td key={stage} className="p-1.5"><input aria-label={`${row.description || title} ${CONTRACTOR_LABELS[stage]} fee`} type="number" min="0" step="0.01" value={row.amounts[stage] ?? ''} placeholder="—" onChange={e => update(row.id, stage, e.target.value)} className={`${inputClass} text-right`} /></td>)}
        <td className="p-1.5"><button type="button" aria-label={`Remove ${row.description || title}`} onClick={() => remove(row.id)} className="rounded p-1 text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4" /></button></td>
      </tr>)}</tbody>
      <tfoot className="border-t border-border bg-muted font-semibold"><tr>
       <td colSpan={2} className="p-2">{title} total</td>
       {stages.map(stage => <td key={stage} className="p-2 text-right">{formatCurrency(rows.reduce((sum, row) => sum + (Number(row.amounts[stage]) || 0), 0))}</td>)}<td />
      </tr></tfoot>
      </table></div>}
  </section>;
}