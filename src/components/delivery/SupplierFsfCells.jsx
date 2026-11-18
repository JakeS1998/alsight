import React from 'react';
import { formatCurrency } from '@/lib/portal';
import { fsfBandLabels } from '@/components/delivery/supplierFsf';

export default function SupplierFsfCells({ name, row, fsf, singleTask }) {
  const bands = singleTask ? ['task'] : ['early', 'late'];
  const unavailable = fsf.loading || !!fsf.error;
  return <>{bands.map(band => {
    const result = row?.bands.find(item => item.key === band);
    const rateKey = band === 'task' ? 'early' : band;
    return <React.Fragment key={band}>
      <td className="border-r border-border px-3 py-3 text-right whitespace-nowrap">{!row ? <span className="text-muted-foreground">Not applicable</span> : <input
        aria-label={`${name} ${fsfBandLabels[band]} FSF percentage (ALS internal only)`} type="number" min="0" max="100" step="0.01"
        disabled={unavailable} value={fsf.rates[row.key]?.[rateKey] ?? ''} placeholder="0"
        onChange={event => fsf.update(row.key, rateKey, event.target.value)}
        className="h-8 w-20 rounded border border-input bg-background px-2 text-right text-xs" />}</td>
      <td className="border-r border-border px-3 py-3 text-right whitespace-nowrap">{!row || unavailable ? '—' : formatCurrency(result?.commission ?? 0)}
        {row && <span className="mt-1 block text-xs text-muted-foreground">Fee base: {formatCurrency(result?.base ?? 0)}</span>}</td>
    </React.Fragment>;
  })}</>;
}