import React, { useEffect, useState } from "react";
import { useAuth } from "@/lib/AuthContext";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Plus, Loader2, Building2, Pencil } from "lucide-react";

export default function Accounts() {
  const { user } = useAuth();
  const isStaff = user?.role === "admin" || user?.role === "company_director";
  const canManage = user?.role === "admin";

  const [accounts, setAccounts] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [createOpen, setCreateOpen] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [a, u] = await Promise.all([
        base44.entities.Account.list("-name", 200),
        canManage ? base44.entities.User.list().catch(() => []) : Promise.resolve([]),
      ]);
      setAccounts(a);
      setUsers(u);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight text-slate-900">Accounts</h1>
          <p className="mt-1 text-sm text-slate-500">All supplier and client accounts.</p>
        </div>
        {canManage && (
          <Button onClick={() => setCreateOpen(true)} className="bg-slate-900 hover:bg-slate-800">
            <Plus className="mr-1.5 h-4 w-4" /> New Account
          </Button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-slate-800" /></div>
      ) : accounts.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white py-16 text-center">
          <Building2 className="mx-auto h-8 w-8 text-slate-300" />
          <p className="mt-3 text-sm text-slate-500">No accounts yet.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {accounts.map((a) => {
            const linkedUser = users.find((u) => u.id === a.linked_user_id);
            return (
              <div key={a.id} className="flex flex-col rounded-2xl border border-slate-200 bg-white p-5">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-sm font-semibold text-slate-700">
                      {a.name?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{a.name}</p>
                      <span className="text-xs uppercase tracking-wide text-slate-400">{a.type}</span>
                    </div>
                  </div>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${a.status === "active" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                    {a.status}
                  </span>
                </div>
                <dl className="mt-4 flex-1 space-y-1.5 text-xs text-slate-500">
                  <div className="flex justify-between"><dt>Contact</dt><dd className="text-slate-700">{a.contact_person || "—"}</dd></div>
                  <div className="flex justify-between"><dt>Email</dt><dd className="truncate text-slate-700">{a.contact_email || "—"}</dd></div>
                  <div className="flex justify-between"><dt>Phone</dt><dd className="text-slate-700">{a.phone || "—"}</dd></div>
                  <div className="flex justify-between"><dt>Linked user</dt><dd className="text-slate-700">{linkedUser ? linkedUser.email : "—"}</dd></div>
                </dl>
                {canManage && (
                  <Button variant="outline" size="sm" className="mt-4" onClick={() => setEditing(a)}>
                    <Pencil className="mr-1.5 h-3.5 w-3.5" /> Edit
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      )}

      <AccountDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        users={users}
        onSaved={load}
        mode="create"
      />
      <AccountDialog
        open={!!editing}
        onOpenChange={(o) => !o && setEditing(null)}
        users={users}
        account={editing}
        onSaved={load}
        mode="edit"
      />
    </div>
  );
}

function AccountDialog({ open, onOpenChange, users, account, onSaved, mode }) {
  const blank = { name: "", type: "client", contact_person: "", contact_email: "", phone: "", address: "", status: "active", linked_user_id: "" };
  const [form, setForm] = useState(blank);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (account) setForm({ ...blank, ...account });
    else setForm(blank);
  }, [account, open]);

  const linkableUsers = users.filter((u) => u.role === "client" || u.role === "supplier");

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        name: form.name,
        type: form.type,
        contact_person: form.contact_person,
        contact_email: form.contact_email,
        phone: form.phone,
        address: form.address,
        status: form.status,
        linked_user_id: form.linked_user_id || null,
      };
      let result;
      if (mode === "create") {
        result = await base44.entities.Account.create(payload);
      } else {
        result = await base44.entities.Account.update(account.id, payload);
      }
      const accountId = result?.id || account?.id;
      // Keep the linked user's account_id in sync so RLS on projects/contracts/invoices matches.
      const previousLinked = account?.linked_user_id || null;
      const newLinked = payload.linked_user_id || null;
      if (newLinked !== previousLinked) {
        const updates = [];
        if (previousLinked) updates.push(base44.entities.User.update(previousLinked, { account_id: null }).catch(() => {}));
        if (newLinked) updates.push(base44.entities.User.update(newLinked, { account_id: accountId }).catch(() => {}));
        if (updates.length) await Promise.all(updates);
      }
      onOpenChange(false);
      onSaved();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{mode === "create" ? "New account" : "Edit account"}</DialogTitle>
          <DialogDescription>
            {mode === "create" ? "Create a supplier or client account." : "Update account details and link a portal user."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="ac-name">Name</Label>
              <Input id="ac-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ac-type">Type</Label>
              <select id="ac-type" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}
                className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm">
                <option value="client">Client</option>
                <option value="supplier">Supplier</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="ac-contact">Contact person</Label>
              <Input id="ac-contact" value={form.contact_person} onChange={(e) => setForm({ ...form, contact_person: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ac-email">Contact email</Label>
              <Input id="ac-email" type="email" value={form.contact_email} onChange={(e) => setForm({ ...form, contact_email: e.target.value })} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ac-phone">Phone</Label>
            <Input id="ac-phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ac-address">Address</Label>
            <Textarea id="ac-address" rows={2} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="ac-status">Status</Label>
              <select id="ac-status" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}
                className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm">
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ac-link">Linked portal user</Label>
              <select id="ac-link" value={form.linked_user_id} onChange={(e) => setForm({ ...form, linked_user_id: e.target.value })}
                className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm">
                <option value="">—</option>
                {linkableUsers.map((u) => <option key={u.id} value={u.id}>{u.email}</option>)}
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>Cancel</Button>
            <Button type="submit" disabled={saving} className="bg-slate-900 hover:bg-slate-800">
              {saving ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : null} {mode === "create" ? "Create" : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}