import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { FormSection, FormGrid, FormField, formInputClass } from "@/components/forms/PowerForm";
import { Loader2 } from "lucide-react";

export function RequestDialog({ open, onOpenChange, accounts, user, onCreated }) {
  const [form, setForm] = useState({
    name: "", description: "", client_account_id: "", account_id: "",
    estimated_value: "", procurement_route: true,
  });
  const [submitting, setSubmitting] = useState(false);

  const reset = () =>
    setForm({ name: "", description: "", client_account_id: "", account_id: "", estimated_value: "", procurement_route: true });

  const clientAccounts = accounts.filter((a) => a.account_type === "client");
  const supplierAccounts = accounts.filter((a) => a.account_type === "supplier");

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSubmitting(true);
    try {
      const client = accounts.find((a) => a.dataverse_id === form.client_account_id);
      await base44.entities.Project.create({
        name: form.name.trim(),
        description: form.description.trim(),
        project_number: "",
        client_account_id: form.client_account_id || null,
        account_id: form.account_id || null,
        estimated_value: form.estimated_value ? Number(form.estimated_value) : null,
        procurement_route: form.procurement_route,
        live_project: true,
        status: "active",
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
              <FormField label="Description">
                <textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className={`${formInputClass} h-auto py-2`} />
              </FormField>
            </div>
          </FormSection>
          <FormSection title="Parties & Budget" description="Link the client and supplier for this project">
            <FormGrid>
              <FormField label="Client">
                <select value={form.client_account_id} onChange={(e) => setForm({ ...form, client_account_id: e.target.value })} className={formInputClass}>
                  <option value="">—</option>
                  {clientAccounts.map((a) => <option key={a.id} value={a.dataverse_id}>{a.name}</option>)}
                </select>
              </FormField>
              <FormField label="Supplier">
                <select value={form.account_id} onChange={(e) => setForm({ ...form, account_id: e.target.value })} className={formInputClass}>
                  <option value="">—</option>
                  {supplierAccounts.map((a) => <option key={a.id} value={a.dataverse_id}>{a.name}</option>)}
                </select>
              </FormField>
              <FormField label="Estimated Value (£)">
                <input type="number" min="0" value={form.estimated_value} onChange={(e) => setForm({ ...form, estimated_value: e.target.value })} className={formInputClass} />
              </FormField>
              <FormField label="Procurement Route">
                <select value={form.procurement_route} onChange={(e) => setForm({ ...form, procurement_route: e.target.value === "true" })} className={formInputClass}>
                  <option value="true">UK Leisure Framework</option>
                  <option value="false">Other</option>
                </select>
              </FormField>
            </FormGrid>
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