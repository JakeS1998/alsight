import React, { useEffect, useState, useCallback, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { filterAll } from "@/components/data/loadAll";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { FormSection, FormGrid, FormField, formInputClass } from "@/components/forms/PowerForm";
import { LookupCombobox } from "@/components/forms/LookupCombobox";
import { Plus, Trash2, Loader2, FileDown, TrendingUp, ArrowUpRight, ArrowDownRight, Check, FileCheck } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/portal";
import { exportFeeProposalPdf } from "./exportFeeProposalPdf";
import { feeProposalTotals } from "./feeProposalTotals";
import { additionalFeeTotal } from '@/components/delivery/additionalFeeStages';
import SupplierFeeTable from '@/components/delivery/SupplierFeeTable';
import FeePdfOptionsDialog from '@/components/delivery/FeePdfOptionsDialog';
import { useAuth } from '@/lib/AuthContext';
import useSupplierFsf from '@/components/delivery/useSupplierFsf';
import SupplierFsfSummary from '@/components/delivery/SupplierFsfSummary';
import { supplierFsfTotals } from '@/components/delivery/supplierFsf';
import FeeProposalLines from '@/components/delivery/FeeProposalLines';
import FrameworkFeeCalculator from '@/components/delivery/FrameworkFeeCalculator';
import automaticFrameworkFeeLines from '@/components/delivery/automaticFrameworkFeeLines';
import useFrameworkFees from '@/components/delivery/useFrameworkFees';
import frameworkVersion from '@/components/projects/frameworkVersion';
import frameworkAgreementRoute from '@/components/delivery/frameworkAgreementRoute';
import ContractorBuildUp from '@/components/delivery/ContractorBuildUp';
import { contractorBuildUp as computeContractorBuildUp } from '@/components/delivery/contractorBuildUp';
import { contractorFsfRows } from '@/components/delivery/contractorFsf';
import proposalSupplierLines from '@/components/delivery/proposalSupplierLines';
import singleTaskFees from '@/components/delivery/singleTaskFees';
import taskProposalTotal from '@/components/delivery/taskProposalTotal';

const BASIS = [
  { value: "fixed", label: "Fixed" },
  { value: "percentage", label: "% of works" },
  { value: "day_rate", label: "Day rate" },
];
const STATUS = [
  { value: "draft", label: "Draft" },
  { value: "internal_review", label: "Internal Review" },
  { value: "sent", label: "Sent" },
  { value: "negotiation", label: "Negotiation" },
  { value: "accepted", label: "Accepted" },
  { value: "lost", label: "Lost" },
];
const STATUS_STYLE = {
  draft: "bg-slate-100 text-slate-600", internal_review: "bg-amber-50 text-amber-700",
  sent: "bg-blue-50 text-blue-700", negotiation: "bg-violet-50 text-violet-700",
  accepted: "bg-emerald-50 text-emerald-700", lost: "bg-rose-50 text-rose-700",
};
const RIBA_STAGES = ["RIBA 1", "RIBA 2", "RIBA 3", "RIBA 4", "RIBA 5-7"];


const EMPTY_HEADER = {
  revision_number: "", fee_basis: "", services_included: "", services_excluded: "",
  consultants_required: "", status: "draft", date_issued: "", client_approval_date: "",
  link_to_file: "", is_current: true,
};
const ALS_LINE = { riba_stage: "", description: "ALS Delivery fee", internal_fee: 0, include_on_client: true };
const normalizeFeeItems = (lines) => lines.map(line => ({ ...line, include_on_client: line.include_on_client !== false, internal_fee: additionalFeeTotal(line) }));
const parseItems = (s) => { try { return normalizeFeeItems(JSON.parse(s) || []); } catch { return []; } };

export function FeeProposalSection({ projectId, project, onChanged, deliveryTeam, suppliers, legalDocs, dmas, children }) {
  const [rows, setRows] = useState([]);
  const [pos, setPos] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [storedItems, setItems] = useState([ALS_LINE]);
  const [ohpSurveysPct, setOhpSurveysPct] = useState(0);
  const [ohpSurveysType, setOhpSurveysType] = useState('percentage');
  const [ohpSurveysFixed, setOhpSurveysFixed] = useState(0);
  const [ohpRiba57Pct, setOhpRiba57Pct] = useState(0);
  const [loading, setLoading] = useState(true);
  const [savingBuilder, setSavingBuilder] = useState(false);
  const [exporting, setExporting] = useState(null);
  const [exportError, setExportError] = useState('');
  const [exportKind, setExportKind] = useState(null);
  const [saveError, setSaveError] = useState('');
  const { user } = useAuth();
  const fsf = useSupplierFsf(user, selectedId, projectId);
  const agreement = frameworkAgreementRoute(legalDocs, dmas, project.project_number);
  const singleTask = agreement.route === 'single_task';
  const frameworkFees = useFrameworkFees(frameworkVersion(project.project_number), agreement.route);

  const [headerOpen, setHeaderOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [header, setHeader] = useState(EMPTY_HEADER);
  const [savingHeader, setSavingHeader] = useState(false);

  const supplierName = (cn) => suppliers.find((s) => s.company_number === cn)?.name || cn || "";

  const taskFees = useMemo(() => singleTask ? singleTaskFees(deliveryTeam, supplierName, { surveysPct: ohpSurveysPct, riba57Pct: ohpRiba57Pct, surveysType: ohpSurveysType, surveysFixed: ohpSurveysFixed }) : null, [singleTask, deliveryTeam, suppliers, ohpSurveysPct, ohpRiba57Pct, ohpSurveysType, ohpSurveysFixed]);
  const supplierLines = useMemo(() => singleTask ? taskFees.lines : proposalSupplierLines(deliveryTeam, supplierName), [deliveryTeam, suppliers, singleTask, taskFees]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [p, poData] = await Promise.all([
        filterAll(base44.entities.FeeProposal, { project_id: projectId }, "-revision_number").catch(() => []),
        project.project_number
          ? filterAll(base44.entities.PurchaseOrder, { project_ref: project.project_number }).catch(() => [])
          : Promise.resolve([]),
      ]);
      setRows(p); setPos(poData);
      const cur = p.find((r) => r.is_current) || p[0];
      if (cur) {
        setSelectedId(cur.id);
        const parsed = parseItems(cur.line_items);
        setItems(parsed.length ? parsed : [ALS_LINE]);
        setOhpSurveysPct(Number(cur.ohp_surveys_pct) || 0);
        setOhpSurveysType(cur.ohp_surveys_type || 'percentage');
        setOhpSurveysFixed(Number(cur.ohp_surveys_fixed) || 0);
        setOhpRiba57Pct(Number(cur.ohp_riba57_pct) || 0);
      } else { setSelectedId(null); setItems([ALS_LINE]); setOhpSurveysPct(0); setOhpRiba57Pct(0); setOhpSurveysType('percentage'); setOhpSurveysFixed(0); }
      onChanged?.(p);
    } finally { setLoading(false); }
  }, [projectId, project.project_number, onChanged]);

  useEffect(() => { load(); }, [load]);

  const selected = rows.find((r) => r.id === selectedId) || rows[0];
  const selectProposal = (id) => {
    setSelectedId(id);
    const r = rows.find((x) => x.id === id);
    const parsed = parseItems(r?.line_items);
    setItems(parsed.length ? parsed : [ALS_LINE]);
    setOhpSurveysPct(Number(r?.ohp_surveys_pct) || 0);
    setOhpSurveysType(r?.ohp_surveys_type || 'percentage');
    setOhpSurveysFixed(Number(r?.ohp_surveys_fixed) || 0);
    setOhpRiba57Pct(Number(r?.ohp_riba57_pct) || 0);
  };

  const poBySupplier = useMemo(() => {
    const m = {};
    pos.forEach((p) => { if (p.supplier_company_number) m[p.supplier_company_number] = (m[p.supplier_company_number] || 0) + (Number(p.total_net_value) || 0); });
    return m;
  }, [pos]);

  const contractorBuild = useMemo(() => singleTask ? null : computeContractorBuildUp(deliveryTeam, ohpSurveysPct, ohpRiba57Pct, ohpSurveysType, ohpSurveysFixed), [singleTask, deliveryTeam, ohpSurveysPct, ohpRiba57Pct, ohpSurveysType, ohpSurveysFixed]);
  const automaticSettings = !loading && selectedId && agreement.route && !frameworkFees.loading && !frameworkFees.error && frameworkFees.settings?.bands?.length ? frameworkFees.settings : null;
  const items = useMemo(() => automaticFrameworkFeeLines(storedItems, feeProposalTotals(supplierLines, [], contractorBuild).supplierFees, automaticSettings, singleTask), [storedItems, supplierLines, contractorBuild, automaticSettings, singleTask]);
  const totals = useMemo(() => feeProposalTotals(supplierLines, items, contractorBuild), [supplierLines, items, contractorBuild]);
  const fsfContractors = useMemo(() => singleTask ? taskFees.contractors : contractorFsfRows(deliveryTeam, contractorBuild), [singleTask, taskFees, deliveryTeam, contractorBuild]);
  const fsfTotals = fsf.allowed ? supplierFsfTotals(supplierLines, fsf.rates, fsfContractors) : null;

  const supplierComparison = useMemo(() => {
    const bySup = {};
    supplierLines.forEach((l) => { if (l.supplier_company_number) bySup[l.supplier_company_number] = (bySup[l.supplier_company_number] || 0) + (Number(l.supplier_fee) || 0); });
    return Object.entries(bySup).map(([cn, supFee]) => {
      const poTotal = poBySupplier[cn] || 0;
      return { cn, name: supplierName(cn), supFee, poTotal, diff: supFee - poTotal };
    });
  }, [supplierLines, poBySupplier, suppliers]);

  const updateItem = (idx, field, value) => setItems(items.map((it, i) => {
    if (i !== idx) return it;
    const next = { ...it, [field]: value };
    return field === 'stage_fees' ? { ...next, internal_fee: additionalFeeTotal(next) } : next;
  }));
  const addItem = () => setItems([...items, { riba_stage: "", description: "", stage_fees: {}, internal_fee: 0, include_on_client: true }]);
  const removeItem = (idx) => setItems(items.filter((_, i) => i !== idx));

  const saveBuilder = async () => {
    if (!selectedId) return;
    setSavingBuilder(true); setSaveError('');
    try {
      if (fsf.allowed) await fsf.save();
      await base44.entities.FeeProposal.update(selectedId, {
        line_items: JSON.stringify(normalizeFeeItems(items)),
        fee_value: totals.alsFee,
        external_cost: totals.supplierFees,
        ohp_surveys_pct: Number(ohpSurveysPct) || 0,
        ohp_surveys_type: ohpSurveysType,
        ohp_surveys_fixed: Number(ohpSurveysFixed) || 0,
        ohp_riba57_pct: Number(ohpRiba57Pct) || 0,
      });
      load();
    } catch (error) { setSaveError(error.message || 'Unable to save the builder. Please try again.'); }
    finally { setSavingBuilder(false); }
  };

  const openAdd = () => {
    setEditing(null);
    const nextRev = (rows.length ? Math.max(...rows.map((r) => r.revision_number || 0)) : 0) + 1;
    setHeader({ ...EMPTY_HEADER, revision_number: nextRev });
    setHeaderOpen(true);
  };
  const openEdit = (r) => {
    setEditing(r);
    setHeader({
      ...EMPTY_HEADER,
      revision_number: r.revision_number ?? "",
      fee_basis: r.fee_basis || "",
      services_included: r.services_included || "",
      services_excluded: r.services_excluded || "",
      consultants_required: r.consultants_required || "",
      status: r.status || "draft",
      date_issued: r.date_issued ? String(r.date_issued).slice(0, 10) : "",
      client_approval_date: r.client_approval_date ? String(r.client_approval_date).slice(0, 10) : "",
      link_to_file: r.link_to_file || "",
      is_current: r.is_current !== false,
    });
    setHeaderOpen(true);
  };

  const saveHeader = async (e) => {
    e.preventDefault();
    setSavingHeader(true);
    try {
      const payload = {
        ...header,
        revision_number: Number(header.revision_number) || 1,
        project_id: projectId,
        client_account_id: project.client_account_id || null,
        bdm_aad_id: project.bdm_aad_id || null,
        line_items: editing ? (selected?.line_items || JSON.stringify([ALS_LINE])) : JSON.stringify([ALS_LINE]),
        fee_value: editing ? (selected?.fee_value ?? null) : null,
        external_cost: editing ? (selected?.external_cost ?? null) : null,
      };
      if (editing) await base44.entities.FeeProposal.update(editing.id, payload);
      else await base44.entities.FeeProposal.create(payload);
      setHeaderOpen(false);
      load();
    } finally { setSavingHeader(false); }
  };

  const removeProposal = async (id) => { await base44.entities.FeeProposal.delete(id); load(); };

  const doExport = async (includeInternal = false, includeRiba57 = true) => {
    if (!selected || (includeInternal && !fsf.allowed)) return;
    setExportKind(null);
    setExporting(includeInternal ? 'internal' : 'client'); setExportError('');
    try {
      await exportFeeProposalPdf({
        project,
        proposal: { ...selected, line_items: JSON.stringify(items), fee_value: totals.alsFee, external_cost: totals.supplierFees },
        suppliers, poBySupplier, supplierLines, contractorBuild, includeInternal, includeRiba57, singleTask,
        fsfRates: includeInternal && fsf.allowed ? fsf.rates : undefined,
        fsfContractors: includeInternal && fsf.allowed ? fsfContractors : undefined,
      });
    } catch (error) { setExportError(error.message || 'Unable to export the proposal. Please try again.'); }
    finally { setExporting(null); }
  };

  return (
    <FormSection title={singleTask ? 'Single-task fee proposal' : '02 · Fee'} completed={(rows.find(row => row.is_current) || rows[0])?.status === 'accepted'} description="Supplier fees are pulled from the Delivery Team; add the ALS Delivery fee and any other optional lines">
      <div className="space-y-5">
        {React.Children.map(children, child => React.isValidElement(child) ? React.cloneElement(child, { legacyContractorOhp: { surveysPct: ohpSurveysPct, riba57Pct: ohpRiba57Pct, surveysType: ohpSurveysType, surveysFixed: ohpSurveysFixed } }) : child)}
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-500">Revisions</p>
          <Button type="button" variant="outline" size="sm" onClick={openAdd}><Plus className="mr-1.5 h-4 w-4" /> Add revision</Button>
        </div>

        {loading ? (
          <div className="flex justify-center py-6"><div className="h-6 w-6 animate-spin rounded-full border-4 border-slate-200 border-t-primary" /></div>
        ) : rows.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white py-8 text-center text-sm text-slate-500">No fee proposals yet. Add a revision to start building.</div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-3 py-2.5"></th>
                  <th className="px-3 py-2.5">Rev</th>
                  <th className="px-3 py-2.5">Status</th>
                  <th className="px-3 py-2.5">Issued</th>
                  <th className="px-3 py-2.5">{singleTask ? 'Task total' : 'Fee'}</th>
                  <th className="px-3 py-2.5"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((r) => (
                  <tr key={r.id} className={`hover:bg-slate-50 ${r.id === selectedId ? "bg-primary/5" : ""}`}>
                    <td className="px-3 py-2.5"><input type="radio" checked={r.id === selectedId} onChange={() => selectProposal(r.id)} className="h-4 w-4 accent-primary" /></td>
                    <td className="px-3 py-2.5 font-medium text-slate-700">R{r.revision_number || 1}</td>
                    <td className="px-3 py-2.5"><span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLE[r.status] || "bg-slate-100 text-slate-600"}`}>{STATUS.find((s) => s.value === r.status)?.label || r.status}</span></td>
                    <td className="px-3 py-2.5">{formatDate(r.date_issued)}</td>
                    <td className="px-3 py-2.5">{formatCurrency(singleTask ? taskProposalTotal(r) : r.fee_value)}</td>
                    <td className="px-3 py-2.5 text-right whitespace-nowrap">
                      <button onClick={() => openEdit(r)} className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 text-xs">Edit</button>
                      <button onClick={() => removeProposal(r.id)} className="rounded p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600"><Trash2 className="h-3.5 w-3.5" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {selected && (
          <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h4 className="text-sm font-semibold text-slate-900">Fee Proposal Builder · R{selected.revision_number || 1}</h4>
              <div className="flex items-center gap-2">
                <Button type="button" variant="outline" size="sm" disabled={!!exporting} onClick={() => singleTask ? doExport(false) : setExportKind('client')}>{exporting === 'client' ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileDown className="mr-1.5 h-4 w-4" />} Client PDF</Button>
                {fsf.allowed && <Button type="button" variant="outline" size="sm" disabled={!!exporting || fsf.loading || !!fsf.error} onClick={() => singleTask ? doExport(true) : setExportKind('internal')}>{exporting === 'internal' ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileDown className="mr-1.5 h-4 w-4" />} Internal PDF</Button>}
                <Button type="button" size="sm" onClick={saveBuilder} disabled={savingBuilder || fsf.loading || !!fsf.error} className="bg-primary hover:bg-primary/90">
                  {savingBuilder && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />} Save builder
                </Button>
              </div>
            </div>

            {exportError && <p role="alert" className="text-sm text-destructive">{exportError}</p>}
            {saveError && <p role="alert" className="text-sm text-destructive">{saveError}</p>}
            <div className="grid gap-3 rounded-lg bg-primary/5 p-3 sm:grid-cols-4">
              <Stat label="ALS fee (recorded profit)" value={formatCurrency(totals.alsFee)} />
              <Stat label="Supplier fees" value={formatCurrency(totals.supplierFees)} />
              <Stat label={singleTask ? 'Task total' : 'Proposed client fees'} value={formatCurrency(totals.proposedFees)} />
              <Stat label="ALS fee as % of proposal" value={totals.alsFeePct == null ? "—" : `${totals.alsFeePct}%`} accent />
            </div>

            {frameworkFees.error && <p role="alert" className="text-sm text-destructive">{frameworkFees.error}</p>}
            {frameworkFees.loading && <p role="status" className="text-sm text-muted-foreground">Loading framework fee bands…</p>}
            {agreement.message && <p role="status" className="rounded-lg border border-border bg-muted/50 p-3 text-sm text-muted-foreground">{agreement.message} Existing fee lines are unchanged.</p>}
            {agreement.route && frameworkFees.settings && !frameworkFees.loading && !frameworkFees.error && <FrameworkFeeCalculator supplierFees={totals.supplierFees} feeLines={items} settings={frameworkFees.settings} />}

            {/* Supplier fees (from delivery team) */}
            <SupplierFeeTable singleTask={singleTask} lines={supplierLines} getSupplierName={supplierName} fsf={fsf.allowed ? fsf : undefined} contractors={fsf.allowed ? fsfContractors : undefined} />
            {fsf.allowed && <SupplierFsfSummary alsFee={totals.alsFee} fsfTotal={fsfTotals.total} loading={fsf.loading} error={fsf.error} onSave={fsf.save} />}

            {!singleTask && <ContractorBuildUp deliveryTeam={deliveryTeam} ohpSurveysPct={ohpSurveysPct} ohpRiba57Pct={ohpRiba57Pct} ohpSurveysType={ohpSurveysType} ohpSurveysFixed={ohpSurveysFixed}  />}

            <FeeProposalLines automaticUklfLabel={automaticSettings?.uklf} singleTask={singleTask} items={items} stages={singleTask ? ['Task'] : RIBA_STAGES} updateItem={updateItem} addItem={addItem} removeItem={removeItem} />

            {supplierComparison.length > 0 && (
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Supplier fees vs Purchase Orders</p>
                <div className="space-y-1.5">
                  {supplierComparison.map((c) => <ComparisonRow key={c.cn} {...c} />)}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <FeePdfOptionsDialog kind={exportKind} onClose={() => setExportKind(null)} onDownload={includeRiba57 => doExport(exportKind === 'internal', includeRiba57)} />
      <Dialog open={headerOpen} onOpenChange={setHeaderOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader><DialogTitle>{editing ? "Edit revision" : "Add revision"}</DialogTitle></DialogHeader>
          <form onSubmit={saveHeader} className="space-y-4">
            <FormGrid>
              <FormField label="Revision number"><input type="number" min="1" value={header.revision_number} onChange={(e) => setHeader({ ...header, revision_number: e.target.value })} className={formInputClass} /></FormField>
              <FormField label="Fee basis">
                <LookupCombobox value={header.fee_basis} onChange={(value) => setHeader((prev) => ({ ...prev, fee_basis: value }))} options={BASIS} placeholder="—" searchPlaceholder="Search fee bases..." />
              </FormField>
              <FormField label="Status">
                <LookupCombobox value={header.status} onChange={(value) => setHeader((prev) => ({ ...prev, status: value }))} options={STATUS} placeholder="Select status" searchPlaceholder="Search statuses..." allowClear={false} />
              </FormField>
              <FormField label="Date issued"><input type="date" value={header.date_issued} onChange={(e) => setHeader({ ...header, date_issued: e.target.value })} className={formInputClass} /></FormField>
              <FormField label="Client approval date"><input type="date" value={header.client_approval_date} onChange={(e) => setHeader({ ...header, client_approval_date: e.target.value })} className={formInputClass} /></FormField>
              <FormField label="Upload proposal (link)"><input value={header.link_to_file} onChange={(e) => setHeader({ ...header, link_to_file: e.target.value })} className={formInputClass} /></FormField>
              <FormField label="Services included"><textarea rows={2} value={header.services_included} onChange={(e) => setHeader({ ...header, services_included: e.target.value })} className={`${formInputClass} h-auto py-2`} /></FormField>
              <FormField label="Services excluded"><textarea rows={2} value={header.services_excluded} onChange={(e) => setHeader({ ...header, services_excluded: e.target.value })} className={`${formInputClass} h-auto py-2`} /></FormField>
              <FormField label="Consultants required"><input value={header.consultants_required} onChange={(e) => setHeader({ ...header, consultants_required: e.target.value })} className={formInputClass} /></FormField>
              <FormField label="Current revision?">
                <label className="flex h-10 items-center gap-2 text-sm text-slate-700">
                  <input type="checkbox" checked={!!header.is_current} onChange={(e) => setHeader({ ...header, is_current: e.target.checked })} className="h-4 w-4 rounded border-slate-300 accent-primary" /> Yes
                </label>
              </FormField>
            </FormGrid>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setHeaderOpen(false)} disabled={savingHeader}>Cancel</Button>
              <Button type="submit" disabled={savingHeader} className="bg-primary hover:bg-primary/90">{savingHeader && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />} Save</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </FormSection>
  );
}

function Stat({ label, value, accent }) {
  return (
    <div>
      <div className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-slate-500">{accent && <TrendingUp className="h-3 w-3" />}{label}</div>
      <div className={`mt-0.5 text-lg font-semibold ${accent ? "text-primary" : "text-slate-900"}`}>{value}</div>
    </div>
  );
}

function ComparisonRow({ name, supFee, poTotal, diff }) {
  const noPo = poTotal === 0;
  const over = diff > 0;
  const under = diff < 0;
  const Icon = noPo ? null : over ? ArrowUpRight : under ? ArrowDownRight : Check;
  const cls = noPo ? "text-slate-500" : over ? "text-rose-600" : under ? "text-emerald-600" : "text-slate-500";
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="font-medium text-slate-700">{name}</span>
      <span className={cls}>
        {Icon && <Icon className="mr-1 inline h-3.5 w-3.5" />}
        {noPo ? `Proposal ${formatCurrency(supFee)} · no PO` : `${over ? "Over" : under ? "Under" : "Matches"} PO by ${formatCurrency(Math.abs(diff))}`}
      </span>
    </div>
  );
}