import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2, Check } from "lucide-react";

export default function AccountProfile() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const role = user?.role;

  const [account, setAccount] = useState(null);
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (role !== "client" && role !== "supplier") {
      navigate("/accounts");
      return;
    }
    base44.entities.Account.list()
      .then((rows) => {
        // RLS returns the user's own account (matched via linked_user_id)
        const myAccount = rows[0] || null;
        setAccount(myAccount);
        setForm(myAccount ? {
          name: myAccount.name || "",
          contact_person: myAccount.contact_person || "",
          contact_email: myAccount.contact_email || "",
          phone: myAccount.phone || "",
          address: myAccount.address || "",
        } : null);
      })
      .finally(() => setLoading(false));
  }, [role]);

  const submit = async (e) => {
    e.preventDefault();
    if (!account) return;
    setSaving(true);
    setSaved(false);
    try {
      const updated = await base44.entities.Account.update(account.id, {
        contact_person: form.contact_person,
        contact_email: form.contact_email,
        phone: form.phone,
        address: form.address,
      });
      setAccount(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center py-20"><div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-slate-800" /></div>;
  }

  if (!account) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white py-16 text-center">
        <p className="text-sm text-slate-500">No account is linked to your profile yet. An administrator will assign one.</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight text-slate-900">My Account</h1>
        <p className="mt-1 text-sm text-slate-500">Keep your contact details up to date — these are visible to the legal team.</p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <div className="mb-5 flex items-center gap-3 border-b border-slate-100 pb-5">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-900 text-sm font-semibold text-white">
            {account.name?.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="text-base font-semibold text-slate-900">{account.name}</p>
            <p className="text-xs uppercase tracking-wide text-slate-400">{account.type}</p>
          </div>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="a-contact">Contact person</Label>
            <Input id="a-contact" value={form.contact_person} onChange={(e) => setForm({ ...form, contact_person: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="a-email">Contact email</Label>
              <Input id="a-email" type="email" value={form.contact_email} onChange={(e) => setForm({ ...form, contact_email: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="a-phone">Phone</Label>
              <Input id="a-phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="a-address">Address</Label>
            <Textarea id="a-address" rows={2} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
          </div>
          <div className="flex items-center gap-3 pt-2">
            <Button type="submit" disabled={saving} className="bg-slate-900 hover:bg-slate-800">
              {saving ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : null} Save changes
            </Button>
            {saved && (
              <span className="flex items-center gap-1 text-sm text-emerald-600"><Check className="h-4 w-4" /> Saved</span>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}