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
const RIBA_STAGES = ["RIBA 1", "RIBA 2", "RIBA 3", "RIBA 4", "RIBA 5-7", "Pre-construction", "Construction", "Other"];
const STAGE_LABEL = { riba_1: "RIBA 1", riba_2: "RIBA 2", riba_3: "RIBA 3", riba_4: "RIBA 4", riba_5_7: "RIBA 5-7" };
const STAGE_KEYS = ["riba_1", "riba_2", "riba_3", "riba_4", "riba_5_7"];

const EMPTY_HEADER = {
  revision_number: "", fee_basis: "", services_included: "", services_excluded: "",
  consultants_required: "", status: "draft", date_issued: "", client_approval_date: "",
  link_to_file: "", is_current: true,
};
const ALS_LINE = { riba_stage: "", description: "ALS Delivery fee", internal_fee: "" };
const parseItems = (s) => { try { return JSON.parse(s) || []; } catch { return []; } };

export function FeeProposalSection({ projectId, project, onChanged, deliveryTeam, suppliers }) {
  const [rows, setRows] = useState([]);
  const [pos, setPos] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [items, setItems] = useState([ALS_LINE]);
  const [loading, setLoading] = useState(true);
  const [savingBuilder, setSavingBuilder] = useState(false);

  const [headerOpen, setHeaderOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [header, setHeader] = useState(EMPTY_HEADER);
  const [savingHeader, setSavingHeader] = useState(false);

  const supplierName = (cn) => suppliers.find((s) => s.company_number === cn)?.name || cn || "";

  const supplierLines = useMemo(() => {
    const out = [];
    (deliveryTeam || []).forEach((m) => {
      STAGE_KEYS.forEach((st) => {
        const fee = Number(m.fees?.[st]);
        if (fee > 0) {
          out.push({
            riba_stage: STAGE_LABEL[st],
            role: m.role || "Supplier",
            description: `${m.role || "Supplier"}${m.supplier_company_number ? " — " + supplierName(m.supplier_company_number) : ""}`,
            supplier_company_number: m.supplier_company_number || "",
            supplier_fee: fee,
            fee_proposal_link: m.fee_proposal_link || "",
          });
        }
      });
    });
    return out;
  }, [deliveryTeam, suppliers]);

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
      } else { setSelectedId(null); setItems([ALS_LINE]); }
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
  };

  const poBySupplier = useMemo(() => {
    const m = {};
    pos.forEach((p) => { if (p.supplier_company_number) m[p.supplier_company_number] = (m[p.supplier_company_number] || 0) + (Number(p.total_net_value) || 0); });
    return m;
  }, [pos]);

  const totals = useMemo(() => {
    const sup = supplierLines.reduce((a, l) => a + (Number(l.supplier_fee) || 0), 0);
    const als = items.reduce((a, l) => a + (Number(l.internal_fee) || 0), 0);
    return { sup, als, contribution: als - sup, marginPct: als ? Math.round(((als - sup) / als) * 100) : 0 };
  }, [supplierLines, items]);

  const supplierComparison = useMemo(() => {
    const bySup = {};
    supplierLines.forEach((l) => { if (l.supplier_company_number) bySup[l.supplier_company_number] = (bySup[l.supplier_company_number] || 0) + (Number(l.supplier_fee) || 0); });
    return Object.entries(bySup).map(([cn, supFee]) => {
      const poTotal = poBySupplier[cn] || 0;
      return { cn, name: supplierName(cn), supFee, poTotal, diff: supFee - poTotal };
    });
  }, [supplierLines, poBySupplier, suppliers]);

  const updateItem = (idx, field, value) => setItems((prev) => prev.map((it, i) => (i === idx ? { ...it, [field]: value } : it)));
  const addItem = () => setItems((prev) => [...prev, { riba_stage: "", description: "", internal_fee: "" }]);
  const removeItem = (idx) => setItems((prev) => prev.filter((_, i) => i !== idx));

  const saveBuilder = async () => {
    if (!selectedId) return;
    setSavingBuilder(true);
    try {
      await base44.entities.FeeProposal.update(selectedId, {
        line_items: JSON.stringify(items),
        fee_value: totals.als || null,
        external_cost: totals.sup || null,
      });
      load();
    } finally { setSavingBuilder(false); }
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

  const doExport = () => {
    if (!selected) return;
    exportFeeProposalPdf({
      project,
      proposal: { ...selected, line_items: JSON.stringify(items), fee_value: totals.als, external_cost: totals.sup },
      suppliers,
      poBySupplier,
      supplierLines,
    });
  };

  return (
    <FormSection title="2 · Fee Proposal" description="Supplier fees are pulled from the Delivery Team; add the ALS Delivery fee and any other optional lines">
      <div className="space-y-5">
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
                  <th className="px-3 py-2.5">Fee</th>
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
                    <td className="px-3 py-2.5">{formatCurrency(r.fee_value)}</td>
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
                <Button type="button" variant="outline" size="sm" onClick={doExport}><FileDown className="mr-1.5 h-4 w-4" /> Export PDF</Button>
                <Button type="button" size="sm" onClick={saveBuilder} disabled={savingBuilder} className="bg-primary hover:bg-primary/90">
                  {savingBuilder && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />} Save builder
                </Button>
              </div>
            </div>

            <div className="grid gap-3 rounded-lg bg-primary/5 p-3 sm:grid-cols-4">
              <Stat label="ALS fees" value={formatCurrency(totals.als)} />
              <Stat label="Supplier fees" value={formatCurrency(totals.sup)} />
              <Stat label="Contribution" value={formatCurrency(totals.contribution)} />
              <Stat label="Margin" value={`${totals.marginPct}%`} accent />
            </div>

            {/* Supplier fees (from delivery team) */}
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Supplier fees (from Delivery Team)</p>
              {supplierLines.length === 0 ? (
                <p className="text-sm text-slate-400">No supplier fees yet. Add suppliers in the Delivery Team section above with fees per RIBA stage.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="text-left text-xs text-slate-500">
                      <tr><th className="py-1 pr-2">RIBA Stage</th><th className="py-1 pr-2">Description</th><th className="py-1 pr-2 text-right">Supplier £</th><th className="py-1 pr-2">Fee proposal</th></tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {supplierLines.map((l, i) => (
                        <tr key={i}>
                          <td className="py-1.5 pr-2 text-slate-700">{l.riba_stage}</td>
                          <td className="py-1.5 pr-2 text-slate-700">{l.description}</td>
                          <td className="py-1.5 pr-2 text-right text-slate-700">{formatCurrency(l.supplier_fee)}</td>
                          <td className="py-1.5 pr-2">{l.fee_proposal_link ? <a href={l.fee_proposal_link} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-primary hover:underline"><FileCheck className="h-3.5 w-3.5" /> View</a> : <span className="text-slate-400">—</span>}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* ALS / internal lines */}
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">ALS &amp; internal fees</p>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-left text-xs text-slate-500">
                    <tr><th className="py-1 pr-2">RIBA Stage</th><th className="py-1 pr-2">Description</th><th className="py-1 pr-2 text-right">Fee £</th><th></th></tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {items.map((it, idx) => (
                      <tr key={idx}>
                        <td className="py-1.5 pr-2">
                          <div className="min-w-[150px]"><LookupCombobox value={it.riba_stage} onChange={(value) => updateItem(idx, "riba_stage", value)} options={RIBA_STAGES.map((stage) => ({ value: stage, label: stage }))} placeholder="—" searchPlaceholder="Search stages..." /></div>
                        </td>
                        <td className="py-1.5 pr-2">
                          <input value={it.description} onChange={(e) => updateItem(idx, "description", e.target.value)} placeholder="e.g. ALS Delivery fee" className="h-9 w-full min-w-[180px] rounded-lg border border-slate-300 bg-white px-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20" />
                        </td>
                        <td className="py-1.5 pr-2 text-right">
                          <input type="number" value={it.internal_fee} onChange={(e) => updateItem(idx, "internal_fee", e.target.value)} className="h-9 w-24 rounded-lg border border-slate-300 bg-white px-2 text-right text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20" />
                        </td>
                        <td className="py-1.5 text-right">
                          {it.description === "ALS Delivery fee" ? null : (
                            <button onClick={() => removeItem(idx)} className="rounded p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600"><Trash2 className="h-3.5 w-3.5" /></button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <button onClick={addItem} className="mt-2 inline-flex items-center gap-1 text-sm text-primary hover:underline"><Plus className="h-4 w-4" /> Add optional line</button>
            </div>

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