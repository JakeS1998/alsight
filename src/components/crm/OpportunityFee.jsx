import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/portal';
import { additionalFeeTotal } from '@/components/delivery/additionalFeeStages';
import FeeProposalLines from '@/components/delivery/FeeProposalLines';
import SupplierFeeTable from '@/components/delivery/SupplierFeeTable';
import ContractorBuildUp from '@/components/delivery/ContractorBuildUp';
import OpportunityFeeFields, { FEE_FIELDS } from '@/components/crm/OpportunityFeeFields';
import { opportunityFeeLines, opportunityFeeData } from '@/components/crm/opportunityFeeData';
import { exportFeeProposalPdf } from '@/components/delivery/exportFeeProposalPdf';
import FeePdfOptionsDialog from '@/components/delivery/FeePdfOptionsDialog';
const STAGES = ['RIBA 1', 'RIBA 2', 'RIBA 3', 'RIBA 4', 'RIBA 5-7'];
export default function OpportunityFee({ item, account, onSave, canEdit, saving }) {
  const [draft, setDraft] = useState(() => ({ ...Object.fromEntries(FEE_FIELDS.map(key => [key, item[key] || ''])), fee_status: item.fee_status || 'draft', fee_lines: opportunityFeeLines(item) }));
  const [exportKind, setExportKind] = useState(null);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState('');
  const editable = canEdit && item.status === 'open';
  const set = (key, value) => setDraft(previous => ({ ...previous, [key]: value }));
  const { supplierLines, build, totals, supplierName } = opportunityFeeData(item, draft.fee_lines);
  const updateLine = (index, field, value) => set('fee_lines', draft.fee_lines.map((row, i) => i === index ? { ...row, [field]: value, ...(field === 'stage_fees' ? { internal_fee: additionalFeeTotal({ ...row, stage_fees: value }) } : {}) } : row));
  const download = async includeRiba57 => {
    const includeInternal = exportKind === 'internal'; setExportKind(null); setExporting(true); setError('');
    try { await exportFeeProposalPdf({ project: { name: item.title, client_name: account?.name }, proposal: { revision_number: 1, status: draft.fee_status, fee_basis: draft.fee_basis, date_issued: draft.fee_issued_date, line_items: JSON.stringify(draft.fee_lines) }, supplierLines, contractorBuild: build, suppliers: (item.design_team || []).map(member => ({ company_number: member.supplier_company_number, name: member.supplier_name })), poBySupplier: {}, includeInternal, includeRiba57 }); }
    catch (failure) { setError(failure.message || 'Unable to export fee proposal.'); }
    finally { setExporting(false); }
  };
  return <section className="space-y-4 rounded-xl border border-border bg-card p-5">
    <div><h2 className="font-semibold">Fee Proposal Builder</h2><p className="text-sm text-muted-foreground">The same RIBA-stage fee lines, supplier fees and contractor build-up used in project management. Saved details transfer automatically on handover.</p></div>
    <OpportunityFeeFields draft={draft} set={set} readOnly={!editable} />
    <div className="grid gap-3 rounded-lg bg-primary/5 p-3 sm:grid-cols-4">{[['ALS fee (recorded profit)', formatCurrency(totals.alsFee)], ['Supplier fees', formatCurrency(totals.supplierFees)], ['Proposed client fees', formatCurrency(totals.proposedFees)], ['ALS fee as % of proposal', totals.alsFeePct == null ? '—' : `${totals.alsFeePct}%`]].map(([label, value]) => <div key={label}><p className="text-xs text-muted-foreground">{label}</p><p className="font-semibold">{value}</p></div>)}</div>
    <SupplierFeeTable lines={supplierLines} getSupplierName={supplierName} />
    <ContractorBuildUp deliveryTeam={item.design_team || []} ohpSurveysPct={0} ohpRiba57Pct={0} />
    <FeeProposalLines items={draft.fee_lines} stages={STAGES} updateItem={updateLine} addItem={() => set('fee_lines', [...draft.fee_lines, { description: '', stage_fees: {}, internal_fee: 0, include_on_client: true }])} removeItem={index => set('fee_lines', draft.fee_lines.filter((_, i) => i !== index))} readOnly={!editable} />
    <p className="text-xs text-muted-foreground">UKLF fees are calculated automatically in project management once the project number and agreement route are available.</p>
    {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
    <div className="flex flex-wrap gap-2"><Button variant="outline" disabled={exporting} onClick={() => setExportKind('client')}>{exporting ? 'Exporting…' : 'Client PDF'}</Button><Button variant="outline" disabled={exporting} onClick={() => setExportKind('internal')}>Internal PDF</Button>{editable && <Button disabled={saving || draft.fee_lines.some(row => !row.description)} onClick={() => onSave({ ...draft, alliance_fee: totals.alsFee, fee_lines: draft.fee_lines.map(row => ({ ...row, internal_fee: additionalFeeTotal(row) })) })}>{saving ? 'Saving…' : 'Save builder'}</Button>}</div>
    <FeePdfOptionsDialog kind={exportKind} onClose={() => setExportKind(null)} onDownload={download} />
  </section>;
}