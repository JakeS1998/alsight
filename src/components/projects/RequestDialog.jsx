import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { FormSection, FormGrid, FormField, formInputClass } from "@/components/forms/PowerForm";
import { Loader2 } from "lucide-react";

export function RequestDialog({ open, onOpenChange, accounts, user, submitting, setSubmitting, onCreated }) {
  const [form, setForm] = useState({
    name: "", description: "", client_account_id: "", supplier_account_id: "",
    budget: "", start_date: "", target_end_date: "",
  });

  const reset = () =>
    setForm({ name: "", description: "", client_account_id: "", supplier_account_id: "", budget: "", start_date: "", target_end_date: "" });

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
          <DialogDescription>Submit a leisure construction project request for director review.</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <FormSection title="Project Details" description="Describe the leisure construction or refurbishment project">
            <div className="space-y-4">
              <FormField label="Project name" required>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required className={formInputClass} />
              </FormField>
              <FormField label="Description" help="Outline scope, objectives and any key requirements">
                <textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className={`${formInputClass} h-auto py-2`} />
              </FormField>
            </div>
          </FormSection>

          <FormSection title="Parties & Budget" description="Link the client and supplier for this project">
            <FormGrid>
              <FormField label="Client">
                <select value={form.client_account_id} onChange={(e) => setForm({ ...form, client_account_id: e.target.value })} className={formInputClass}>
                  <option value="">—</option>
                  {clientAccounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
              </FormField>
              <FormField label="Supplier">
                <select value={form.supplier_account_id} onChange={(e) => setForm({ ...form, supplier_account_id: e.target.value })} className={formInputClass}>
                  <option value="">—</option>
                  {supplierAccounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
              </FormField>
              <FormField label="Budget (£)" help="Estimated total project value">
                <input type="number" min="0" value={form.budget} onChange={(e) => setForm({ ...form, budget: e.target.value })} className={formInputClass} />
              </FormField>
              <FormField label="Start date">
                <input type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} className={formInputClass} />
              </FormField>
            </FormGrid>
            <div className="mt-4">
              <FormField label="Target end date">
                <input type="date" value={form.target_end_date} onChange={(e) => setForm({ ...form, target_end_date: e.target.value })} className={formInputClass} />
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