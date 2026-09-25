import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { FormField, formInputClass } from "@/components/forms/PowerForm";
import { Loader2, Mail, CheckCircle2, ShieldCheck } from "lucide-react";

const ROLES = [
  { value: "admin", label: "Administrator" },
  { value: "company_director", label: "Company Director" },
  { value: "development_manager", label: "Development Manager (BDM)" },
  { value: "client", label: "Client" },
  { value: "supplier", label: "Supplier" },
];

export function InviteUserDialog({ open, onOpenChange, contact, accounts, existingUser, onDone }) {
  const [role, setRole] = useState("client");
  const [accountId, setAccountId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open && contact) {
      if (existingUser) {
        setRole(existingUser.role || "client");
        setAccountId(existingUser.account_id || "");
      } else {
        setRole("client");
        const matched = accounts.find((a) => a.company_number === contact.company_number);
        setAccountId(matched?.dataverse_id || "");
      }
      setSuccess(false);
      setError("");
    }
  }, [open, contact, existingUser, accounts]);

  if (!contact) return null;

  const submit = async (e) => {
    e.preventDefault();
    if (!contact.email) return;
    setSubmitting(true);
    setError("");
    try {
      if (existingUser) {
        await base44.entities.User.update(existingUser.id, {
          role,
          account_id: accountId || null,
        });
      } else {
        await base44.users.inviteUser(contact.email, role);
        if (accountId) {
          try {
            const found = await base44.entities.User.filter({ email: contact.email });
            if (found.length > 0) {
              await base44.entities.User.update(found[0].id, { account_id: accountId });
            }
          } catch (_) { /* user may not exist until they accept */ }
        }
      }
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
              : `Invite ${contact.full_name} to the ALS Live portal.`}
          </DialogDescription>
        </DialogHeader>

        {success ? (
          <div className="flex flex-col items-center py-6 text-center">
            <CheckCircle2 className="h-10 w-10 text-emerald-500" />
            <p className="mt-3 text-sm font-medium text-slate-900">
              {existingUser ? "Access updated!" : "Invitation sent!"}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              {existingUser
                ? "The user's role and account have been updated."
                : `An email has been sent to ${contact.email} with login instructions.`}
            </p>
            <Button variant="outline" className="mt-4" onClick={() => onOpenChange(false)}>Close</Button>
          </div>
        ) : (
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

            {(role === "client" || role === "supplier") && (
              <FormField
                label="Linked Account"
                description="Determines which projects and documents this user can access"
              >
                <select value={accountId} onChange={(e) => setAccountId(e.target.value)} className={formInputClass}>
                  <option value="">— Select account —</option>
                  {filteredAccounts.map((a) => (
                    <option key={a.id} value={a.dataverse_id}>{a.name}</option>
                  ))}
                </select>
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
                ) : existingUser ? (
                  <ShieldCheck className="mr-1.5 h-4 w-4" />
                ) : (
                  <Mail className="mr-1.5 h-4 w-4" />
                )}
                {existingUser ? "Update Access" : "Send Invitation"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}