import React from 'react';
import { FileCheck } from 'lucide-react';
import { formatCurrency } from '@/lib/portal';
const stages = ['RIBA 1', 'RIBA 2', 'RIBA 3', 'RIBA 4', 'RIBA 5-7'];
export default function SupplierFeeTable({ lines, getSupplierName }) {
  const suppliers = new Map();
  lines.forEach(line => {
    const key = line.supplier_company_number || line.description;
    if (!suppliers.has(key)) suppliers.set(key, { key, name: line.supplier_company_number ? getSupplierName(line.supplier_company_number) : line.description, fees: {}, documents: new Map() });
    const supplier = suppliers.get(key);
    supplier.fees[line.riba_stage] = (supplier.fees[line.riba_stage] || 0) + Number(line.supplier_fee || 0);
    if (line.fee_proposal_link) {
      if (!supplier.documents.has(line.fee_proposal_link)) supplier.documents.set(line.fee_proposal_link, new Set());
      supplier.documents.get(line.fee_proposal_link).add(line.role || 'Supplier');
    }
  });
  return <div className="rounded-lg border border-border bg-muted/30 p-3">
    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Supplier fees (from Delivery Team)</p>
    {!suppliers.size ? <p className="text-sm text-muted-foreground">No supplier fees yet. Add suppliers in the Delivery Team section above with fees per RIBA stage.</p> : <div className="overflow-x-auto rounded-lg border border-border bg-card"><table className="w-full border-collapse text-sm">
      <thead className="bg-muted text-left text-xs font-semibold text-muted-foreground"><tr><th scope="col" className="border-b border-r border-border px-3 py-3">Supplier</th>{stages.map(stage => <th key={stage} scope="col" className="border-b border-r border-border px-3 py-3 text-right whitespace-nowrap">{stage}</th>)}<th scope="col" className="border-b border-border px-3 py-3 whitespace-nowrap">Fee proposal</th></tr></thead>
      <tbody>{[...suppliers.values()].map(supplier => <tr key={supplier.key} className="border-b border-border last:border-b-0">
        <th scope="row" className="border-r border-border px-3 py-3 text-left font-medium text-foreground">{supplier.name}</th>
        {stages.map(stage => <td key={stage} className="border-r border-border px-3 py-3 text-right whitespace-nowrap tabular-nums text-foreground">{supplier.fees[stage] == null ? '—' : formatCurrency(supplier.fees[stage])}</td>)}
        <td className="px-3 py-3">{supplier.documents.size ? <div className="space-y-1">{[...supplier.documents].map(([url, roles]) => <a key={url} href={url} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-primary hover:underline"><FileCheck className="h-3.5 w-3.5 shrink-0" />{supplier.documents.size === 1 ? 'View' : [...roles].join(', ')}</a>)}</div> : <span className="text-muted-foreground">—</span>}</td>
      </tr>)}</tbody>
    </table></div>}
  </div>;
}