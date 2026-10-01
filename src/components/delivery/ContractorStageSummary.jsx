import React from 'react';
import { formatCurrency } from '@/lib/portal';
export default function ContractorStageSummary({ build }) {
  return <div className="space-y-2 rounded-lg border border-border bg-muted/40 p-3">
    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Contractor build-up by RIBA stage (all contractors)</p>
    <div className="overflow-x-auto md:overflow-x-visible"><table className="w-full text-sm md:table-fixed md:break-words">
      <thead className="text-left text-xs text-muted-foreground"><tr><th className="p-1.5">Stage</th><th className="p-1.5 text-right">Base</th><th className="p-1.5 text-right">OHP</th><th className="p-1.5 text-right">Total</th></tr></thead>
      <tbody>{build.stageRows.map(row => <tr key={row.stage} className="border-t border-border"><td className="p-1.5">{row.label}</td><td className="p-1.5 text-right">{formatCurrency(row.base)}</td><td className="p-1.5 text-right">{formatCurrency(row.ohp)}</td><td className="p-1.5 text-right font-semibold">{formatCurrency(row.total)}</td></tr>)}</tbody>
      <tfoot><tr className="border-t-2 border-border"><td className="p-1.5 font-semibold" colSpan={3}>Contractor total (with OHP)</td><td className="p-1.5 text-right font-bold">{formatCurrency(build.total)}</td></tr></tfoot>
    </table></div>
  </div>;
}