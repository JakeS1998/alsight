import React from 'react';
import { FileCheck } from 'lucide-react';
import { formatCurrency } from '@/lib/portal';
import { supplierFsfKey, fsfAmount } from '@/components/delivery/supplierFsf';
const stages = ['RIBA 1', 'RIBA 2', 'RIBA 3', 'RIBA 4', 'RIBA 5-7'];
export default function SupplierFeeTable({ lines, getSupplierName, fsf, contractors = [] }) {
  const suppliers = new Map();
  lines.forEach(line => {
    const role = line.role || 'Supplier';
    const key = JSON.stringify([supplierFsfKey(line), role]);
    if (!suppliers.has(key)) suppliers.set(key, { key, role, fsfKey: supplierFsfKey(line), name: line.supplier_company_number ? getSupplierName(line.supplier_company_number) : line.description, fees: {}, documents: new Map() });
    const supplier = suppliers.get(key);
    supplier.fees[line.riba_stage] = (supplier.fees[line.riba_stage] || 0) + Number(line.supplier_fee || 0);
    if (line.fee_proposal_link) {
      if (!supplier.documents.has(line.fee_proposal_link)) supplier.documents.set(line.fee_proposal_link, new Set());
      supplier.documents.get(line.fee_proposal_link).add(line.role || 'Supplier');
    }
  });
  if (fsf) contractors.forEach(contractor => {
    const key = JSON.stringify([contractor.key, contractor.role]);
    if (!suppliers.has(key)) suppliers.set(key, { key, role: contractor.role, fsfKey: contractor.key, name: getSupplierName(contractor.supplier), fees: {}, documents: new Map(contractor.fee_proposal_link ? [[contractor.fee_proposal_link, new Set([contractor.role])]] : []) });
    suppliers.get(key).fsfBase = contractor.base;
  });
  return <div className="rounded-lg border border-border bg-muted/30 p-3">
    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Supplier fees (from Delivery Team)</p>
    {!suppliers.size ? <p className="text-sm text-muted-foreground">No supplier fees yet. Add suppliers in the Delivery Team section above with fees per RIBA stage.</p> : <div className="overflow-x-auto rounded-lg border border-border bg-card"><table className="w-full border-collapse text-sm">
      <thead className="bg-muted text-left text-xs font-semibold text-muted-foreground"><tr><th scope="col" className="border-b border-r border-border px-3 py-3">Supplier</th><th scope="col" className="border-b border-r border-border px-3 py-3">Role</th>{stages.map(stage => <th key={stage} scope="col" className="border-b border-r border-border px-3 py-3 text-right whitespace-nowrap">{stage}</th>)}{fsf && <><th scope="col" className="border-b border-r border-border px-3 py-3 text-right whitespace-nowrap">FSF % · Internal</th><th scope="col" className="border-b border-r border-border px-3 py-3 text-right whitespace-nowrap">FSF £ · Internal</th></>}<th scope="col" className="border-b border-border px-3 py-3 whitespace-nowrap">Fee proposal</th></tr></thead>
      <tbody>{[...suppliers.values()].map(supplier => <tr key={supplier.key} className="border-b border-border last:border-b-0">
        <th scope="row" className="border-r border-border px-3 py-3 text-left font-medium text-foreground">{supplier.name}</th>
        <td className="border-r border-border px-3 py-3 text-foreground">{supplier.role}</td>
        {stages.map(stage => <td key={stage} className="border-r border-border px-3 py-3 text-right whitespace-nowrap tabular-nums text-foreground">{formatCurrency(supplier.fees[stage] ?? 0)}</td>)}
        {fsf && <><td className="border-r border-border px-3 py-3"><input aria-label={`${supplier.name} FSF percentage (ALS internal only)`} type="number" min="0" max="100" step="0.01" disabled={fsf.loading || !!fsf.error} value={fsf.rates[supplier.fsfKey] ?? ''} placeholder="0" onChange={event => fsf.update(supplier.fsfKey, event.target.value)} className="h-8 w-20 rounded border border-input bg-background px-2 text-right text-xs" /></td><td className="border-r border-border px-3 py-3 text-right whitespace-nowrap">{fsf.loading || fsf.error ? '—' : formatCurrency(fsfAmount(supplier.fsfBase ?? Object.values(supplier.fees).reduce((sum, fee) => sum + fee, 0), fsf.rates[supplier.fsfKey]))}{supplier.fsfBase !== undefined && <span className="mt-1 block text-xs text-muted-foreground">OHP only: {formatCurrency(supplier.fsfBase)}</span>}</td></>}
        <td className="px-3 py-3">{supplier.documents.size ? <div className="space-y-1">{[...supplier.documents].map(([url, roles]) => <a key={url} href={url} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-primary hover:underline"><FileCheck className="h-3.5 w-3.5 shrink-0" />{supplier.documents.size === 1 ? 'View' : [...roles].join(', ')}</a>)}</div> : <span className="text-muted-foreground">—</span>}</td>
      </tr>)}</tbody>
    </table></div>}
  </div>;
}