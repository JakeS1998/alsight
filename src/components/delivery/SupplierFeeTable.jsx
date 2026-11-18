import React from 'react';
import FeeProposalDocumentLink from '@/components/delivery/FeeProposalDocumentLink';
import { formatCurrency } from '@/lib/portal';
import { fsfBandLabels, supplierFsfKey, supplierFsfTotals } from '@/components/delivery/supplierFsf';
import SupplierFsfCells from '@/components/delivery/SupplierFsfCells';
const stages = ['RIBA 1', 'RIBA 2', 'RIBA 3', 'RIBA 4', 'RIBA 5-7'];
export default function SupplierFeeTable({ lines, getSupplierName, fsf, contractors = [], singleTask = false }) {
  const visibleStages = singleTask ? ['Task'] : stages;
  const suppliers = new Map();
  const fsfRows = new Map(fsf ? supplierFsfTotals(fsf.rates, contractors).rows.map(row => [row.key, row]) : []);
  const bands = singleTask ? ['task'] : ['early', 'late'];
  lines.forEach(line => {
    const role = line.role || 'Supplier';
    const key = supplierFsfKey(line);
    if (!suppliers.has(key)) suppliers.set(key, { key, roles: new Set(), name: line.supplier_company_number ? getSupplierName(line.supplier_company_number) : line.description, fees: {}, documents: new Map() });
    const supplier = suppliers.get(key);
    supplier.roles.add(role);
    supplier.fees[line.riba_stage] = (supplier.fees[line.riba_stage] || 0) + Number(line.supplier_fee || 0);
    if (line.fee_proposal_link) {
      if (!supplier.documents.has(line.fee_proposal_link)) supplier.documents.set(line.fee_proposal_link, new Set());
      supplier.documents.get(line.fee_proposal_link).add(line.role || 'Supplier');
    }
  });
  if (fsf) contractors.forEach(contractor => {
    const key = contractor.key;
    if (!suppliers.has(key)) suppliers.set(key, { key, roles: new Set(), fees: {}, documents: new Map(contractor.fee_proposal_link ? [[contractor.fee_proposal_link, new Set([contractor.role])]] : []) });
    const supplier = suppliers.get(key);
    supplier.name = getSupplierName(contractor.supplier);
    supplier.roles.add(contractor.role);
  });
  return <div className="rounded-lg border border-border bg-muted/30 p-3">
    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Supplier fees (from Delivery Team)</p>
    {!suppliers.size ? <p className="text-sm text-muted-foreground">{singleTask ? 'No supplier fees yet. Add suppliers above with one task fee total.' : 'No supplier fees yet. Add suppliers in the Delivery Team section above with fees per RIBA stage.'}</p> : <div className="overflow-x-auto rounded-lg border border-border bg-card"><table className="w-full border-collapse text-sm">
      <thead className="bg-muted text-left text-xs font-semibold text-muted-foreground"><tr><th scope="col" className="border-b border-r border-border px-3 py-3">Supplier</th><th scope="col" className="border-b border-r border-border px-3 py-3">Role</th>{visibleStages.map(stage => <th key={stage} scope="col" className="border-b border-r border-border px-3 py-3 text-right whitespace-nowrap">{stage}</th>)}{fsf && bands.map(band => <React.Fragment key={band}>{['%', '£'].map(unit => <th key={unit} scope="col" className="border-b border-r border-border px-3 py-3 text-right whitespace-nowrap">{singleTask ? '' : `${fsfBandLabels[band]} `}FSF {unit} · Internal</th>)}</React.Fragment>)}<th scope="col" className="border-b border-border px-3 py-3 whitespace-nowrap">Fee proposal</th></tr></thead>
      <tbody>{[...suppliers.values()].map(supplier => <tr key={supplier.key} className="border-b border-border last:border-b-0">
        <th scope="row" className="border-r border-border px-3 py-3 text-left font-medium text-foreground">{supplier.name}</th>
        <td className="border-r border-border px-3 py-3 text-foreground">{[...supplier.roles].join(', ')}</td>
        {visibleStages.map(stage => <td key={stage} className="border-r border-border px-3 py-3 text-right whitespace-nowrap tabular-nums text-foreground">{formatCurrency(supplier.fees[stage] ?? 0)}</td>)}
        {fsf && <SupplierFsfCells name={supplier.name} row={fsfRows.get(supplier.key)} fsf={fsf} singleTask={singleTask}/> }
        <td className="px-3 py-3">{supplier.documents.size ? <div className="space-y-1">{[...supplier.documents].map(([url, roles]) => <FeeProposalDocumentLink key={url} uri={url}>{supplier.documents.size === 1 ? 'View' : [...roles].join(', ')}</FeeProposalDocumentLink>)}</div> : <span className="text-muted-foreground">—</span>}</td>
      </tr>)}</tbody>
    </table></div>}
  </div>;
}