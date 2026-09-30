import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { LookupCombobox } from '@/components/forms/LookupCombobox';

export default function FeeProposalLines({ items, stages, updateItem, addItem, removeItem }) {
  return <div>
    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">ALS fee &amp; additional lines</p>
    <p className="mb-2 text-xs text-muted-foreground">Lines are included in the client proposal by default. Untick to exclude a line from the client PDF and client total; it remains in the internal proposal. Save builder to retain your choices.</p>
    <div className="overflow-x-auto"><table className="w-full text-sm">
      <thead className="text-left text-xs text-muted-foreground"><tr><th className="py-1 pr-2">RIBA Stage</th><th className="py-1 pr-2">Description</th><th className="py-1 pr-2 text-right">Fee £</th><th className="py-1 px-2 text-center whitespace-nowrap">Client proposal</th><th></th></tr></thead>
      <tbody className="divide-y divide-border">{items.map((item, index) => <tr key={index}>
        <td className="py-1.5 pr-2"><div className="min-w-[150px]"><LookupCombobox value={item.riba_stage} onChange={value => updateItem(index, 'riba_stage', value)} options={stages.map(stage => ({ value: stage, label: stage }))} placeholder="—" searchPlaceholder="Search stages..." /></div></td>
        <td className="py-1.5 pr-2"><input value={item.description} onChange={event => updateItem(index, 'description', event.target.value)} placeholder="e.g. ALS Delivery fee" className="h-9 w-full min-w-[180px] rounded-lg border border-input bg-background px-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20" /></td>
        <td className="py-1.5 pr-2 text-right"><input type="number" value={item.internal_fee} onChange={event => updateItem(index, 'internal_fee', event.target.value)} onBlur={() => { if (item.internal_fee === '' || item.internal_fee == null) updateItem(index, 'internal_fee', 0); }} className="h-9 w-24 rounded-lg border border-input bg-background px-2 text-right text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20" /></td>
        <td className="py-1.5 px-2 text-center"><input type="checkbox" checked={item.include_on_client !== false} onChange={event => updateItem(index, 'include_on_client', event.target.checked)} aria-label={`Include ${item.description || `line ${index + 1}`} ${item.riba_stage || ''} in client proposal`} className="h-4 w-4 rounded border-input accent-primary" /></td>
        <td className="py-1.5 text-right">{item.description !== 'ALS Delivery fee' && <button type="button" onClick={() => removeItem(index)} aria-label={`Remove ${item.description || `line ${index + 1}`}`} className="rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"><Trash2 className="h-3.5 w-3.5" /></button>}</td>
      </tr>)}</tbody>
    </table></div>
    <button type="button" onClick={addItem} className="mt-2 inline-flex items-center gap-1 text-sm text-primary hover:underline"><Plus className="h-4 w-4" /> Add optional line</button>
  </div>;
}