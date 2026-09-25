import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { filterAll } from "@/components/data/loadAll";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { FormField, formInputClass } from "@/components/forms/PowerForm";
import { AccountCombobox } from "@/components/contacts/AccountCombobox";
import { REGION_OPTIONS } from "@/lib/portal";
import { Loader2, Mail, CheckCircle2, ShieldCheck, UserPlus } from "lucide-react";

const ROLES = [
  { value: "admin", label: "Administrator" },
  { value: "director", label: "Director" },
  { value: "regional_director", label: "Regional Director" },
  { value: "bsm", label: "BSM" },
  { value: "finance", label: "Finance" },
  { value: "bdm", label: "BDM" },
  { value: "client", label: "Client" },
  { value: "supplier", label: "Supplier" },
  { value: "project_manager", label: "External Project Manager" },
];

export function InviteUserDialog({ open, onOpenChange, contact, accounts, existingUser, pendingAssignment, onDone }) {
  const [role, setRole] = useState("client");
  const [accountId, setAccountId] = useState("");
  const [region, setRegion] = useState("");
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open && contact) {
      setEmail(contact.email || "");
      if (existingUser || pendingAssignment) {
        setRole(existingUser?.role || pendingAssignment?.portal_role || "client");
        setAccountId(existingUser?.account_id || pendingAssignment?.account_id || "");
        setRegion(existingUser?.region || pendingAssignment?.region || "");
      } else {
        setRole("client");
        const matched = accounts.find((a) => a.company_number === contact.company_number);
        setAccountId(matched?.dataverse_id || "");
        setRegion("");
      }
      setSuccess(false);
      setError("");
    }
  }, [open, contact?.id]);

  if (!contact) return null;

  const updateContact = async (userId, address) => {
    await base44.entities.Contact.update(contact.id, {
      aad_id: userId,
      portal_role: role,
      ...(!contact.email ? { email: address } : {}),
    });
  };

  const submit = async (e) => {
    e.preventDefault();
    const address = email.trim().toLowerCase();
    if (!address) return;
    const companyNumber = role === 'supplier' ? (accounts.find(a => a.dataverse_id === accountId)?.company_number || null) : null;
    setSubmitting(true);
    setError("");
    try {
      if (existingUser) {
        await base44.entities.User.update(existingUser.id, {
          role,
          account_id: accountId || null,
          company_number: companyNumber,
          region: role === "regional_director" ? (region || null) : null,
          contact_dataverse_id: role === "project_manager" ? (contact.dataverse_id || null) : null,
        });
        await updateContact(existingUser.id, address);
      } else {
        const matching = await filterAll(base44.entities.PendingPortalAccess, { email: address });
        if (matching.some((entry) => entry.contact_id !== contact.id)) {
          throw new Error("An access assignment already exists for this email on another contact.");
        }
        const access = {
          contact_id: contact.id,
          email: address,
          portal_role: role,
          account_id: accountId || "",
          region: role === "regional_director" ? (region || "") : "",
        };
        const staged = matching[0]
          ? await base44.entities.PendingPortalAccess.update(matching[0].id, access)
          : await base44.entities.PendingPortalAccess.create(access);
        if (!matching.length) {
          try {
            await base44.users.inviteUser(address, role === "admin" ? "admin" : "user");
          } catch (inviteError) {
            await base44.entities.PendingPortalAccess.delete(staged.id);
            throw inviteError;
          }
        }
        const fresh = await filterAll(base44.entities.User, { email: address }).catch(() => []);
        const created = fresh.find((u) => (u.email || "").toLowerCase() === address);
        if (created) {
          await base44.entities.User.update(created.id, {
            role,
            account_id: accountId || null,
            region: role === "regional_director" ? (region || null) : null,
          contact_dataverse_id: role === "project_manager" ? (contact.dataverse_id || null) : null,
          });
          await updateContact(created.id, address);
          await base44.entities.PendingPortalAccess.delete(staged.id);
        } else if (!contact.email) {
          await base44.entities.Contact.update(contact.id, { email: address });
        }
      }
      setSuccess(true);
      onDone?.(address);
    } catch (err) {
      setError(err.message || "Something went wrong");
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
            {existingUser || pendingAssignment ? "Manage Portal Access" : "Invite & Set Up Access"}
          </DialogTitle>
          <DialogDescription>
            {existingUser || pendingAssignment
              ? `Update the role and account for ${contact.full_name}.`
              : `Invite ${contact.full_name} to the portal and assign their role and account.`}
          </DialogDescription>
        </DialogHeader>

        {success ? (
          <div className="flex flex-col items-center py-6 text-center">
            <CheckCircle2 className="h-10 w-10 text-emerald-500" />
            <p className="mt-3 text-sm font-medium text-slate-900">
              {existingUser || pendingAssignment ? "Access updated!" : "Invitation sent!"}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              {existingUser
                ? "The user's role and account have been updated."
                : "The selected role and account are saved and will be applied automatically when the invitee signs in."}
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

            {!contact.email && (
              <FormField label="Email address" required>
                <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className={formInputClass} placeholder="name@example.com" />
              </FormField>
            )}

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

            {role === 'project_manager' && !contact.dataverse_id && <p className="text-sm text-red-600">This contact needs a linked project manager record before portal access can be assigned.</p>}
            {error && <p className="text-sm text-red-600">{error}</p>}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={submitting || !email.trim() || (role === 'project_manager' && !contact.dataverse_id)}
                className="bg-primary hover:bg-primary/90"
              >
                {submitting ? (
                  <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                ) : existingUser || pendingAssignment ? (
                  <ShieldCheck className="mr-1.5 h-4 w-4" />
                ) : (
                  <UserPlus className="mr-1.5 h-4 w-4" />
                )}
                {existingUser || pendingAssignment ? "Update Access" : "Invite & Set Up"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}