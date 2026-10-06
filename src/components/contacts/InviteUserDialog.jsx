import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { filterAll } from "@/components/data/loadAll";
import { Button } from "@/components/ui/button";
import SearchableSelect from '@/components/forms/SearchableSelect';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { FormField, formInputClass } from "@/components/forms/PowerForm";
import { AccountCombobox } from "@/components/contacts/AccountCombobox";
import PortalOrganisationSelect from '@/components/relationships/PortalOrganisationSelect';
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
  { value: "framework_stakeholder", label: "UK Leisure Framework Stakeholder" },
];

export function InviteUserDialog({ open, onOpenChange, contact, accounts, existingUser, pendingAssignment, onDone }) {
  const [role, setRole] = useState("client");
  const [accountId, setAccountId] = useState("");
  const [region, setRegion] = useState("");
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [confirmed,setConfirmed]=useState(false);

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
      setSuccess(false);setConfirmed(false);
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
    if (!address || !confirmed) return;

    const linkedAccountId = role === 'framework_stakeholder' ? null : accountId || null;
    setSubmitting(true);
    setError("");
    try {
      const administrator=await base44.auth.me();
      if(administrator.role!=='admin')throw new Error('Only administrators can manage portal access.');
      const organisation=accountId ? await base44.entities.Account.filter({dataverse_id:accountId},{limit:1}).then(p=>p.items[0]) : null;
      const companyNumber=role==='supplier' ? organisation?.company_number || null : null;
      const staffLine = ['bsm', 'bdm'].includes(role)
        ? await base44.entities.StaffReportingLine.filter({ contact_id: contact.id }, { limit: 1 }).then(page => page.items[0])
        : null;
      if (existingUser) {
        await base44.entities.User.update(existingUser.id, {
          role,
          staff_aad_id: staffLine?.staff_aad_id || null,
          ...(existingUser.role !== role ? { delegate_of: null, delegate_of_name: null, delegate_region: null } : {}),
          account_id: linkedAccountId,
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
          account_id: linkedAccountId || "",
          staff_aad_id: staffLine?.staff_aad_id || '',
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
            staff_aad_id: staffLine?.staff_aad_id || null,
            account_id: linkedAccountId,
            region: role === "regional_director" ? (region || null) : null,
          contact_dataverse_id: role === "project_manager" ? (contact.dataverse_id || null) : null,
          });
          await updateContact(created.id, address);
          await base44.entities.PendingPortalAccess.delete(staged.id);
        } else if (!contact.email) {
          await base44.entities.Contact.update(contact.id, { email: address });
        }
      }
      await base44.entities.CRMActivity.create({contact_id:contact.id,owner_id:administrator.id,author_id:administrator.id,author_name:administrator.full_name || administrator.email,type:'system',occurred_at:new Date().toISOString(),subject:existingUser || pendingAssignment ? 'Portal access updated' : 'Portal invitation sent',description:`Person: ${contact.full_name}\nPortal role: ${role}\nOrganisation access: ${organisation?.name || 'Not assigned'}`});
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
              ? `Update the portal role and organisation access for ${contact.full_name}.`
              : `Invite ${contact.full_name} to the portal and assign their portal role and organisation access.`}
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
              <SearchableSelect value={role} onChange={(e) => setRole(e.target.value)} className={formInputClass}>
                {ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
              </SearchableSelect>
            </FormField>

            {role === "regional_director" && (
              <FormField label="Region" description="Determines which projects this Regional Director can see">
                <SearchableSelect value={region} onChange={(e) => setRegion(e.target.value)} className={formInputClass}>
                  <option value="">—</option>
                  {REGION_OPTIONS.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
                </SearchableSelect>
              </FormField>
            )}

            {(role === "client" || role === "supplier") && (
              <FormField
                label="Organisation access"
                description="Determines which projects and documents this user can access"
              >
                <PortalOrganisationSelect value={accountId} onChange={setAccountId} role={role}/>
              </FormField>
            )}

            {role === 'project_manager' && !contact.dataverse_id && <p className="text-sm text-red-600">This contact needs a linked project manager record before portal access can be assigned.</p>}
            {error && <p className="text-sm text-red-600">{error}</p>}

            <label className="flex items-start gap-2 text-xs text-muted-foreground"><input type="checkbox" checked={confirmed} onChange={e=>setConfirmed(e.target.checked)}/>I confirm this person’s portal role and organisation access before sending or updating access.</label>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={submitting || !confirmed || !email.trim() || (role === 'project_manager' && !contact.dataverse_id)}
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