import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { FormField, formInputClass } from "@/components/forms/PowerForm";
import { AccountCombobox } from "@/components/contacts/AccountCombobox";
import { REGION_OPTIONS } from "@/lib/portal";
import { Loader2, Mail, CheckCircle2, ShieldCheck } from "lucide-react";

const ROLES = [
  { value: "admin", label: "Administrator" },
  { value: "director", label: "Director" },
  { value: "regional_director", label: "Regional Director" },
  { value: "bsm", label: "BSM" },
  { value: "finance", label: "Finance" },
  { value: "bdm", label: "BDM" },
  { value: "client", label: "Client" },
  { value: "supplier", label: "Supplier" },
];

export function InviteUserDialog({ open, onOpenChange, contact, accounts, existingUser, onDone }) {
  const [role, setRole] = useState("client");
  const [accountId, setAccountId] = useState("");
  const [region, setRegion] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open && contact) {
      if (existingUser) {
        setRole(existingUser.role || "client");
        setAccountId(existingUser.account_id || "");
        setRegion(existingUser.region || "");
      } else {
        setRole("client");
        const matched = accounts.find((a) => a.company_number === contact.company_number);
        setAccountId(matched?.dataverse_id || "");
        setRegion("");
      }
      setSuccess(false);
      setError("");
    }
  }, [open, contact, existingUser, accounts]);

  if (!contact) return null;

  const updateContact = async (userId) => {
    try {
      await base44.entities.Contact.update(contact.id, {
        aad_id: userId || null,
        portal_role: role,
      });
    } catch (_) { /* best effort */ }
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!contact.email) return;
    setSubmitting(true);
    setError("");
    try {
      await base44.entities.User.update(existingUser.id, {
        role,
        account_id: accountId || null,
        region: role === "regional_director" ? (region || null) : null,
      });
      await updateContact(existingUser.id);
      setSuccess(true);
      onDone?.();
    } catch (e) {
      setError(e.message || "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  const filteredAccounts = accounts.filter((a) =>
    role === "client" ? a.account_type === "client" : role === "supplier" ? a.account_type === "supplier" : true
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            {existingUser ? "Manage Portal Access" : "Set Up Portal Access"}
          </DialogTitle>
          <DialogDescription>
            {existingUser
              ? `Update the role and account for ${contact.full_name}.`
              : `Set up portal access for ${contact.full_name}.`}
          </DialogDescription>
        </DialogHeader>

        {success ? (
          <div className="flex flex-col items-center py-6 text-center">
            <CheckCircle2 className="h-10 w-10 text-emerald-500" />
            <p className="mt-3 text-sm font-medium text-slate-900">Access updated!</p>
            <p className="mt-1 text-xs text-slate-500">The user's role and account have been updated.</p>
            <Button variant="outline" className="mt-4" onClick={() => onOpenChange(false)}>Close</Button>
          </div>
        ) : existingUser ? (
          <form onSubmit={submit} className="space-y-4">
            <div className="rounded-lg bg-slate-50 p-3">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-200 text-xs font-semibold text-slate-700">
                  {contact.full_name?.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-slate-900">{contact.full_name}</p>
                  <p className="flex items-center gap-1 truncate text-xs text-slate-500">
                    <Mail className="h-3 w-3" /> {contact.email || "No email on file"}
                  </p>
                </div>
              </div>
            </div>

            <FormField label="Portal Role" required>
              <select value={role} onChange={(e) => setRole(e.target.value)} className={formInputClass}>
                {ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
            </FormField>

            {role === "regional_director" && (
              <FormField label="Region" description="Determines which projects this Regional Director can see">
                <select value={region} onChange={(e) => setRegion(e.target.value)} className={formInputClass}>
                  <option value="">—</option>
                  {REGION_OPTIONS.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
                </select>
              </FormField>
            )}

            {(role === "client" || role === "supplier") && (
              <FormField
                label="Linked Account"
                description="Determines which projects and documents this user can access"
              >
                <AccountCombobox
                  value={accountId}
                  onChange={setAccountId}
                  accounts={filteredAccounts}
                />
              </FormField>
            )}

            {error && <p className="text-sm text-red-600">{error}</p>}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={submitting || !contact.email}
                className="bg-primary hover:bg-primary/90"
              >
                {submitting ? (
                  <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                ) : (
                  <ShieldCheck className="mr-1.5 h-4 w-4" />
                )}
                Update Access
              </Button>
            </DialogFooter>
          </form>
        ) : (
          <div className="space-y-4">
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
              <p className="font-medium">Invite this person manually</p>
              <p className="mt-1 text-xs">
                Invitations are not sent automatically. Open the dashboard{" "}
                <strong>App Users → Invite Users</strong> and invite{" "}
                <span className="font-medium">{contact.email}</span>. Once they accept and appear
                here, use <strong>Manage Access</strong> to assign their role, account, and region.
              </p>
            </div>
            <div className="flex justify-end">
              <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}