import React, { useEffect, useState } from "react";
import { useAuth } from "@/lib/AuthContext";
import { base44 } from "@/api/base44Client";
import { PROJECT_STATUS, formatCurrency, formatDate } from "@/lib/portal";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { FormSection, FormGrid, FormField, formInputClass } from "@/components/forms/PowerForm";
import { Plus, Loader2, ChevronRight } from "lucide-react";

const STATUS_OPTIONS = ["requested", "in_review", "approved", "active", "completed", "rejected"];

export default function Projects() {
  const { user } = useAuth();
  const role = user?.role || "client";
  const canRequest = ["development_manager", "company_director", "admin"].includes(role);
  const canEditStatus = ["admin", "company_director"].includes(role);

  const [projects, setProjects] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [requestOpen, setRequestOpen] = useState(false);
  const [detail, setDetail] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [p, a] = await Promise.all([
        base44.entities.Project.list("-updated_date", 100),
        canRequest ? base44.entities.Account.list("-name", 200).catch(() => []) : Promise.resolve([]),
      ]);
      setProjects(p);
      setAccounts(a);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight text-slate-900">Projects</h1>
          <p className="mt-1 text-sm text-slate-500">
            {canRequest ? "Submit new project requests and track their progress." : "Projects you're involved in."}
          </p>
        </div>
        {canRequest && (
          <Button onClick={() => setRequestOpen(true)} className="bg-primary hover:bg-primary/90">
            <Plus className="mr-1.5 h-4 w-4" /> Request Project
          </Button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-slate-800" /></div>
      ) : projects.length === 0 ? (
        <EmptyState canRequest={canRequest} onAction={() => setRequestOpen(true)} />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                <th className="px-5 py-3">Project</th>
                <th className="hidden px-5 py-3 md:table-cell">Client</th>
                <th className="hidden px-5 py-3 lg:table-cell">Supplier</th>
                <th className="px-5 py-3">Status</th>
                <th className="hidden px-5 py-3 sm:table-cell">Budget</th>
                <th className="px-2 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {projects.map((p) => (
                <tr key={p.id} className="cursor-pointer hover:bg-slate-50" onClick={() => setDetail(p)}>
                  <td className="px-5 py-4">
                    <p className="text-sm font-medium text-slate-900">{p.name}</p>
                    <p className="mt-0.5 line-clamp-1 text-xs text-slate-500">{p.description || "—"}</p>
                  </td>
                  <td className="hidden px-5 py-4 text-sm text-slate-600 md:table-cell">{p.client_name || "—"}</td>
                  <td className="hidden px-5 py-4 text-sm text-slate-600 lg:table-cell">{p.supplier_name || "—"}</td>
                  <td className="px-5 py-4"><StatusBadge status={p.status} map={PROJECT_STATUS} /></td>
                  <td className="hidden px-5 py-4 text-sm text-slate-600 sm:table-cell">{formatCurrency(p.budget)}</td>
                  <td className="px-2 py-4 text-right"><ChevronRight className="h-4 w-4 text-slate-400" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <RequestDialog
        open={requestOpen}
        onOpenChange={setRequestOpen}
        accounts={accounts}
        user={user}
        submitting={submitting}
        setSubmitting={setSubmitting}
        onCreated={load}
      />

      <DetailDialog
        project={detail}
        onClose={() => setDetail(null)}
        canEditStatus={canEditStatus}
        onUpdated={(updated) => { setDetail(updated); load(); }}
      />
    </div>
  );
}

function EmptyState({ canRequest, onAction }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-white py-16 text-center">
      <p className="text-sm text-slate-500">No projects to show yet.</p>
      {canRequest && (
        <Button onClick={onAction} className="mt-4 bg-slate-900 hover:bg-slate-800">
          <Plus className="mr-1.5 h-4 w-4" /> Request your first project
        </Button>
      )}
    </div>
  );
}

function RequestDialog({ open, onOpenChange, accounts, user, submitting, setSubmitting, onCreated }) {
  const [form, setForm] = useState({ name: "", description: "", client_account_id: "", supplier_account_id: "", budget: "", start_date: "", target_end_date: "" });

  const reset = () => setForm({ name: "", description: "", client_account_id: "", supplier_account_id: "", budget: "", start_date: "", target_end_date: "" });

  const clientAccounts = accounts.filter((a) => a.type === "client");
  const supplierAccounts = accounts.filter((a) => a.type === "supplier");

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSubmitting(true);
    try {
      const client = accounts.find((a) => a.id === form.client_account_id);
      const supplier = accounts.find((a) => a.id === form.supplier_account_id);
      await base44.entities.Project.create({
        name: form.name.trim(),
        description: form.description.trim(),
        status: "requested",
        client_account_id: form.client_account_id || null,
        client_name: client?.name || null,
        supplier_account_id: form.supplier_account_id || null,
        supplier_name: supplier?.name || null,
        requested_by_id: user.id,
        requested_by_name: user.full_name || user.email,
        budget: form.budget ? Number(form.budget) : null,
        start_date: form.start_date || null,
        target_end_date: form.target_end_date || null,
      });
      reset();
      onOpenChange(false);
      onCreated();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Request a new project</DialogTitle>
          <DialogDescription>Submit a project request for director review.</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <FormSection title="Project Details" description="Describe the project being requested">
            <div className="space-y-4">
              <FormField label="Project name" required>
                <input id="p-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required className={formInputClass} />
              </FormField>
              <FormField label="Description" help="Outline scope, objectives and any key requirements">
                <textarea id="p-desc" rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className={`${formInputClass} h-auto py-2`} />
              </FormField>
            </div>
          </FormSection>

          <FormSection title="Parties & Budget" description="Link the client and supplier for this project">
            <FormGrid>
              <FormField label="Client">
                <select id="p-client" value={form.client_account_id} onChange={(e) => setForm({ ...form, client_account_id: e.target.value })} className={formInputClass}>
                  <option value="">—</option>
                  {clientAccounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
              </FormField>
              <FormField label="Supplier">
                <select id="p-supplier" value={form.supplier_account_id} onChange={(e) => setForm({ ...form, supplier_account_id: e.target.value })} className={formInputClass}>
                  <option value="">—</option>
                  {supplierAccounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
              </FormField>
              <FormField label="Budget (£)" help="Estimated total project value">
                <input id="p-budget" type="number" min="0" value={form.budget} onChange={(e) => setForm({ ...form, budget: e.target.value })} className={formInputClass} />
              </FormField>
              <FormField label="Start date">
                <input id="p-start" type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} className={formInputClass} />
              </FormField>
            </FormGrid>
            <div className="mt-4">
              <FormField label="Target end date">
                <input id="p-end" type="date" value={form.target_end_date} onChange={(e) => setForm({ ...form, target_end_date: e.target.value })} className={formInputClass} />
              </FormField>
            </div>
          </FormSection>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>Cancel</Button>
            <Button type="submit" disabled={submitting} className="bg-primary hover:bg-primary/90">
              {submitting ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : null} Submit request
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function DetailDialog({ project, onClose, canEditStatus, onUpdated }) {
  const [status, setStatus] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => { if (project) setStatus(project.status); }, [project]);

  const saveStatus = async () => {
    setSaving(true);
    try {
      const updated = await base44.entities.Project.update(project.id, { status });
      onUpdated(updated);
    } finally {
      setSaving(false);
    }
  };

  if (!project) return null;
  return (
    <Dialog open={!!project} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{project.name}</DialogTitle>
          <DialogDescription>{project.description || "No description provided."}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
            <Info label="Client" value={project.client_name} />
            <Info label="Supplier" value={project.supplier_name} />
            <Info label="Budget" value={formatCurrency(project.budget)} />
            <Info label="Requested by" value={project.requested_by_name} />
            <Info label="Start date" value={formatDate(project.start_date)} />
            <Info label="Target end" value={formatDate(project.target_end_date)} />
          </dl>
          {project.notes && <p className="rounded-lg bg-slate-50 p-3 text-sm text-slate-600">{project.notes}</p>}

          {canEditStatus ? (
            <div className="flex items-end gap-3 border-t border-slate-100 pt-4">
              <div className="flex-1 space-y-1.5">
                <Label>Update status</Label>
                <select value={status} onChange={(e) => setStatus(e.target.value)}
                  className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm">
                  {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{PROJECT_STATUS[s].label}</option>)}
                </select>
              </div>
              <Button onClick={saveStatus} disabled={saving || status === project.status} className="bg-primary hover:bg-primary/90">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
              </Button>
            </div>
          ) : (
            <div className="border-t border-slate-100 pt-4"><StatusBadge status={project.status} map={PROJECT_STATUS} /></div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Info({ label, value }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">{label}</dt>
      <dd className="mt-0.5 text-slate-800">{value || "—"}</dd>
    </div>
  );
}