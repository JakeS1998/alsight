import React, { useEffect, useState, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { FormSection, FormGrid, FormField, formInputClass } from "@/components/forms/PowerForm";
import { Plus, Pencil, Trash2, Loader2, PoundSterling, TrendingUp } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/portal";

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

const EMPTY = {
  revision_number: "", fee_value: "", fee_basis: "", services_included: "", services_excluded: "",
  consultants_required: "", supplier_quotes_received: "", external_cost: "", margin_pct: "",
  status: "draft", date_issued: "", client_approval_date: "", link_to_file: "", is_current: true,
};

export function FeeProposalSection({ projectId, project, onChanged }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await base44.entities.FeeProposal.filter({ project_id: projectId }, "-revision_number", 500).catch(() => []);
      setRows(data);
      onChanged?.(data);
    } finally { setLoading(false); }
  }, [projectId, onChanged]);

  useEffect(() => { load(); }, [load]);

  const openAdd = () => {
    setEditing(null);
    const nextRev = (rows.length ? Math.max(...rows.map((r) => r.revision_number || 0)) : 0) + 1;
    setForm({ ...EMPTY, revision_number: nextRev });
    setOpen(true);
  };
  const openEdit = (r) => { setEditing(r); setForm({ ...EMPTY, ...r, fee_value: r.fee_value ?? "", external_cost: r.external_cost ?? "", margin_pct: r.margin_pct ?? "", revision_number: r.revision_number ?? "" }); setOpen(true); };

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...form,
        fee_value: form.fee_value === "" ? null : Number(form.fee_value),
        external_cost: form.external_cost === "" ? null : Number(form.external_cost),
        margin_pct: form.margin_pct === "" ? null : Number(form.margin_pct),
        revision_number: Number(form.revision_number) || 1,
        project_id: projectId,
        client_account_id: project.client_account_id || null,
        bdm_aad_id: project.bdm_aad_id || null,
      };
      if (editing) await base44.entities.FeeProposal.update(editing.id, payload);
      else await base44.entities.FeeProposal.create(payload);
      setOpen(false);
      load();
    } finally { setSaving(false); }
  };

  const remove = async (id) => { await base44.entities.FeeProposal.delete(id); load(); };

  const current = rows.find((r) => r.is_current) || rows[0];

  return (
    <FormSection title="2 · Fee Proposal" description="Track fee proposal revisions and margin">
      <div className="space-y-4">
        {current && (
          <div className="grid gap-3 rounded-xl border border-primary/20 bg-primary/5 p-4 sm:grid-cols-4">
            <MarginStat label="Proposed" value={formatCurrency(current.fee_value)} />
            <MarginStat label="External cost" value={formatCurrency(current.external_cost)} />
            <MarginStat label="Contribution" value={formatCurrency((current.fee_value || 0) - (current.external_cost || 0))} />
            <MarginStat label="Margin" value={`${current.margin_pct ?? (((current.fee_value - current.external_cost) / (current.fee_value || 1)) * 100).toFixed(1)}%`} accent />
          </div>
        )}

        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-500">Revisions</p>
          <Button type="button" variant="outline" size="sm" onClick={openAdd}><Plus className="mr-1.5 h-4 w-4" /> Add revision</Button>
        </div>

        {loading ? (
          <div className="flex justify-center py-6"><div className="h-6 w-6 animate-spin rounded-full border-4 border-slate-200 border-t-primary" /></div>
        ) : rows.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white py-8 text-center text-sm text-slate-500">No fee proposals yet.</div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-3 py-2.5">Rev</th>
                  <th className="px-3 py-2.5">Value</th>
                  <th className="px-3 py-2.5">Basis</th>
                  <th className="px-3 py-2.5">Issued</th>
                  <th className="px-3 py-2.5">Status</th>
                  <th className="px-3 py-2.5"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50">
                    <td className="px-3 py-2.5 font-medium text-slate-700">R{r.revision_number || 1}</td>
                    <td className="px-3 py-2.5">{formatCurrency(r.fee_value)}</td>
                    <td className="px-3 py-2.5">{BASIS.find((b) => b.value === r.fee_basis)?.label || "—"}</td>
                    <td className="px-3 py-2.5">{formatDate(r.date_issued)}</td>
                    <td className="px-3 py-2.5"><span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLE[r.status] || "bg-slate-100 text-slate-600"}`}>{STATUS.find((s) => s.value === r.status)?.label || r.status}</span></td>
                    <td className="px-3 py-2.5 text-right whitespace-nowrap">
                      <button onClick={() => openEdit(r)} className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"><Pencil className="h-3.5 w-3.5" /></button>
                      <button onClick={() => remove(r.id)} className="rounded p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600"><Trash2 className="h-3.5 w-3.5" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader><DialogTitle>{editing ? "Edit fee proposal" : "Add fee proposal"}</DialogTitle></DialogHeader>
          <form onSubmit={save} className="space-y-4">
            <FormGrid>
              <FormField label="Revision number"><input type="number" min="1" value={form.revision_number} onChange={(e) => setForm({ ...form, revision_number: e.target.value })} className={formInputClass} /></FormField>
              <FormField label="Fee proposal value (£)"><input type="number" value={form.fee_value} onChange={(e) => setForm({ ...form, fee_value: e.target.value })} className={formInputClass} /></FormField>
              <FormField label="Fee basis">
                <select value={form.fee_basis} onChange={(e) => setForm({ ...form, fee_basis: e.target.value })} className={formInputClass}>
                  <option value="">—</option>{BASIS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </FormField>
              <FormField label="External cost (£)"><input type="number" value={form.external_cost} onChange={(e) => setForm({ ...form, external_cost: e.target.value })} className={formInputClass} /></FormField>
              <FormField label="Margin %"><input type="number" step="0.1" value={form.margin_pct} onChange={(e) => setForm({ ...form, margin_pct: e.target.value })} className={formInputClass} /></FormField>
              <FormField label="Status">
                <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className={formInputClass}>{STATUS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</select>
              </FormField>
              <FormField label="Date issued"><input type="date" value={form.date_issued ? String(form.date_issued).slice(0, 10) : ""} onChange={(e) => setForm({ ...form, date_issued: e.target.value })} className={formInputClass} /></FormField>
              <FormField label="Client approval date"><input type="date" value={form.client_approval_date ? String(form.client_approval_date).slice(0, 10) : ""} onChange={(e) => setForm({ ...form, client_approval_date: e.target.value })} className={formInputClass} /></FormField>
              <FormField label="Services included" ><textarea rows={2} value={form.services_included} onChange={(e) => setForm({ ...form, services_included: e.target.value })} className={`${formInputClass} h-auto py-2`} /></FormField>
              <FormField label="Services excluded"><textarea rows={2} value={form.services_excluded} onChange={(e) => setForm({ ...form, services_excluded: e.target.value })} className={`${formInputClass} h-auto py-2`} /></FormField>
              <FormField label="Consultants required"><input value={form.consultants_required} onChange={(e) => setForm({ ...form, consultants_required: e.target.value })} className={formInputClass} /></FormField>
              <FormField label="Supplier quotes received"><input value={form.supplier_quotes_received} onChange={(e) => setForm({ ...form, supplier_quotes_received: e.target.value })} className={formInputClass} /></FormField>
              <FormField label="Upload current proposal (link)"><input value={form.link_to_file} onChange={(e) => setForm({ ...form, link_to_file: e.target.value })} className={formInputClass} /></FormField>
              <FormField label="Current revision?">
                <label className="flex h-10 items-center gap-2 text-sm text-slate-700">
                  <input type="checkbox" checked={!!form.is_current} onChange={(e) => setForm({ ...form, is_current: e.target.checked })} className="h-4 w-4 rounded border-slate-300 accent-primary" /> Yes
                </label>
              </FormField>
            </FormGrid>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={saving}>Cancel</Button>
              <Button type="submit" disabled={saving} className="bg-primary hover:bg-primary/90">{saving && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />} Save</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </FormSection>
  );
}

function MarginStat({ label, value, accent }) {
  return (
    <div>
      <div className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-slate-500">{accent && <TrendingUp className="h-3 w-3" />}{label}</div>
      <div className={`mt-0.5 text-lg font-semibold ${accent ? "text-primary" : "text-slate-900"}`}>{value}</div>
    </div>
  );
}