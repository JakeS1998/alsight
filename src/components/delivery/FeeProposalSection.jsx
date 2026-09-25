import React, { useEffect, useState, useCallback, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { FormSection, FormGrid, FormField, formInputClass } from "@/components/forms/PowerForm";
import { Plus, Trash2, Loader2, FileDown, TrendingUp, ArrowUpRight, ArrowDownRight, Check } from "lucide-react";
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

const EMPTY_HEADER = {
  revision_number: "", fee_basis: "", services_included: "", services_excluded: "",
  consultants_required: "", status: "draft", date_issued: "", client_approval_date: "",
  link_to_file: "", is_current: true,
};
const EMPTY_ROW = { riba_stage: "", description: "", supplier_company_number: "", supplier_fee: "", internal_fee: "" };
const parseItems = (s) => { try { return JSON.parse(s) || []; } catch { return []; } };

export function FeeProposalSection({ projectId, project, onChanged }) {
  const [rows, setRows] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [pos, setPos] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingBuilder, setSavingBuilder] = useState(false);

  const [headerOpen, setHeaderOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [header, setHeader] = useState(EMPTY_HEADER);
  const [savingHeader, setSavingHeader] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [p, sup, poData] = await Promise.all([
        base44.entities.FeeProposal.filter({ project_id: projectId }, "-revision_number", 500).catch(() => []),
        base44.entities.Account.filter({ account_type: "supplier" }, "name", 500).catch(() => []),
        project.project_number
          ? base44.entities.PurchaseOrder.filter({ project_ref: project.project_number }, "-created_date", 500).catch(() => [])
          : Promise.resolve([]),
      ]);
      setRows(p); setSuppliers(sup); setPos(poData);
      const cur = p.find((r) => r.is_current) || p[0];
      if (cur) { setSelectedId(cur.id); setItems(parseItems(cur.line_items)); }
      else { setSelectedId(null); setItems([]); }
      onChanged?.(p);
    } finally { setLoading(false); }
  }, [projectId, project.project_number, onChanged]);

  useEffect(() => { load(); }, [load]);

  const selected = rows.find((r) => r.id === selectedId) || rows[0];

  const selectProposal = (id) => {
    setSelectedId(id);
    const r = rows.find((x) => x.id === id);
    setItems(parseItems(r?.line_items));
  };

  const poBySupplier = useMemo(() => {
    const m = {};
    pos.forEach((p) => {
      if (!p.supplier_company_number) return;
      m[p.supplier_company_number] = (m[p.supplier_company_number] || 0) + (Number(p.total_net_value) || 0);
    });
    return m;
  }, [pos]);

  const totals = useMemo(() => {
    const sup = items.reduce((a, it) => a + (Number(it.supplier_fee) || 0), 0);
    const fee = items.reduce((a, it) => a + (Number(it.internal_fee) || 0), 0);
    return { sup, fee, contribution: fee - sup, marginPct: fee ? Math.round(((fee - sup) / fee) * 100) : 0 };
  }, [items]);

  const supplierComparison = useMemo(() => {
    const bySup = {};
    items.forEach((it) => {
      if (!it.supplier_company_number) return;
      bySup[it.supplier_company_number] = (bySup[it.supplier_company_number] || 0) + (Number(it.supplier_fee) || 0);
    });
    return Object.entries(bySup).map(([cn, supFee]) => {
      const poTotal = poBySupplier[cn] || 0;
      const diff = supFee - poTotal;
      return { cn, name: suppliers.find((s) => s.company_number === cn)?.name || cn, supFee, poTotal, diff };
    });
  }, [items, poBySupplier, suppliers]);

  const updateRow = (idx, field, value) => setItems((prev) => prev.map((it, i) => (i === idx ? { ...it, [field]: value } : it)));
  const addRow = () => setItems((prev) => [...prev, { ...EMPTY_ROW }]);
  const removeRow = (idx) => setItems((prev) => prev.filter((_, i) => i !== idx));

  const saveBuilder = async () => {
    if (!selectedId) return;
    setSavingBuilder(true);
    try {
      await base44.entities.FeeProposal.update(selectedId, {
        line_items: JSON.stringify(items),
        fee_value: totals.fee || null,
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
        line_items: editing ? (selected?.line_items || "[]") : "[]",
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
      proposal: { ...selected, line_items: JSON.stringify(items), fee_value: totals.fee, external_cost: totals.sup },
      suppliers,
      poBySupplier,
    });
  };

  return (
    <FormSection title="2 · Fee Proposal" description="Build the fee proposal line-by-line per RIBA stage; supplier fees are flagged against PO values">
      <div className="space-y-5">
        {/* Revisions */}
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

        {/* Builder */}
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

            {/* Margin summary */}
            <div className="grid gap-3 rounded-lg bg-primary/5 p-3 sm:grid-cols-4">
              <Stat label="Internal fees" value={formatCurrency(totals.fee)} />
              <Stat label="Supplier fees" value={formatCurrency(totals.sup)} />
              <Stat label="Contribution" value={formatCurrency(totals.contribution)} />
              <Stat label="Margin" value={`${totals.marginPct}%`} accent />
            </div>

            {/* Line items */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <tr className="border-b border-slate-100">
                    <th className="py-2 pr-2">RIBA Stage</th>
                    <th className="py-2 pr-2">Description</th>
                    <th className="py-2 pr-2">Supplier (optional)</th>
                    <th className="py-2 pr-2 text-right">Supplier £</th>
                    <th className="py-2 pr-2 text-right">Fee £</th>
                    <th className="py-2"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {items.map((it, idx) => (
                    <tr key={idx}>
                      <td className="py-1.5 pr-2">
                        <select value={it.riba_stage} onChange={(e) => updateRow(idx, "riba_stage", e.target.value)} className="h-9 rounded-lg border border-slate-300 bg-white px-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20">
                          <option value="">—</option>
                          {RIBA_STAGES.map((s) => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </td>
                      <td className="py-1.5 pr-2">
                        <input value={it.description} onChange={(e) => updateRow(idx, "description", e.target.value)} placeholder="e.g. Pre-construction services" className="h-9 w-full min-w-[160px] rounded-lg border border-slate-300 bg-white px-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20" />
                      </td>
                      <td className="py-1.5 pr-2">
                        <select value={it.supplier_company_number} onChange={(e) => updateRow(idx, "supplier_company_number", e.target.value)} className="h-9 max-w-[180px] rounded-lg border border-slate-300 bg-white px-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20">
                          <option value="">—</option>
                          {suppliers.map((s) => <option key={s.id} value={s.company_number}>{s.name}</option>)}
                        </select>
                      </td>
                      <td className="py-1.5 pr-2 text-right">
                        <input type="number" value={it.supplier_fee} onChange={(e) => updateRow(idx, "supplier_fee", e.target.value)} className="h-9 w-24 rounded-lg border border-slate-300 bg-white px-2 text-right text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20" />
                      </td>
                      <td className="py-1.5 pr-2 text-right">
                        <input type="number" value={it.internal_fee} onChange={(e) => updateRow(idx, "internal_fee", e.target.value)} className="h-9 w-24 rounded-lg border border-slate-300 bg-white px-2 text-right text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20" />
                      </td>
                      <td className="py-1.5 text-right">
                        <button onClick={() => removeRow(idx)} className="rounded p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600"><Trash2 className="h-3.5 w-3.5" /></button>
                      </td>
                    </tr>
                  ))}
                  {items.length === 0 && (
                    <tr><td colSpan={6} className="py-6 text-center text-sm text-slate-400">No line items yet.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
            <button onClick={addRow} className="inline-flex items-center gap-1 text-sm text-primary hover:underline"><Plus className="h-4 w-4" /> Add row</button>

            {/* Supplier vs PO comparison */}
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

      {/* Header dialog */}
      <Dialog open={headerOpen} onOpenChange={setHeaderOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader><DialogTitle>{editing ? "Edit revision" : "Add revision"}</DialogTitle></DialogHeader>
          <form onSubmit={saveHeader} className="space-y-4">
            <FormGrid>
              <FormField label="Revision number"><input type="number" min="1" value={header.revision_number} onChange={(e) => setHeader({ ...header, revision_number: e.target.value })} className={formInputClass} /></FormField>
              <FormField label="Fee basis">
                <select value={header.fee_basis} onChange={(e) => setHeader({ ...header, fee_basis: e.target.value })} className={formInputClass}>
                  <option value="">—</option>{BASIS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </FormField>
              <FormField label="Status">
                <select value={header.status} onChange={(e) => setHeader({ ...header, status: e.target.value })} className={formInputClass}>{STATUS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</select>
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