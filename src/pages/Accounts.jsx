import React, { useEffect, useState } from "react";
import { useAuth } from "@/lib/AuthContext";
import { base44 } from "@/api/base44Client";
import { ACCOUNT_TYPE, formatDate } from "@/lib/portal";
import { Button } from "@/components/ui/button";
import { Building2, ExternalLink, CheckCircle2, MapPin } from "lucide-react";

export default function Accounts() {
  const { user } = useAuth();
  const isStaff = user?.role === "admin" || user?.role === "company_director";

  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState("all");

  const load = async () => {
    setLoading(true);
    try {
      setAccounts(await base44.entities.Account.list("-name", 500));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const filtered = typeFilter === "all" ? accounts : accounts.filter((a) => a.account_type === typeFilter);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight text-slate-900">Accounts</h1>
        <p className="mt-1 text-sm text-slate-500">All supplier and client accounts with Companies House data.</p>
      </div>

      {!loading && accounts.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {["all", "client", "supplier"].map((t) => (
            <button key={t} onClick={() => setTypeFilter(t)}
              className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors capitalize ${
                typeFilter === t ? "border-primary bg-primary text-primary-foreground" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
              }`}>{t === "all" ? "All" : t}</button>
          ))}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-20"><div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-slate-800" /></div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white py-16 text-center">
          <Building2 className="mx-auto h-8 w-8 text-slate-300" />
          <p className="mt-3 text-sm text-slate-500">No accounts yet.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((a) => (
            <div key={a.id} className="flex flex-col rounded-2xl border border-slate-200 bg-white p-5">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-sm font-semibold text-slate-700">
                    {a.name?.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-900">{a.name}</p>
                    <span className="text-xs uppercase tracking-wide text-slate-400">{a.account_type}</span>
                  </div>
                </div>
                {a.uklf_approved && <CheckCircle2 className="h-5 w-5 text-emerald-500" />}
              </div>
              <dl className="mt-4 flex-1 space-y-1.5 text-xs text-slate-500">
                {a.company_number && <div className="flex justify-between"><dt>Company No.</dt><dd className="text-slate-700">{a.company_number}</dd></div>}
                {a.company_status && <div className="flex justify-between"><dt>Status</dt><dd className="text-slate-700">{a.company_status}</dd></div>}
                {a.date_of_incorporation && <div className="flex justify-between"><dt>Incorporated</dt><dd className="text-slate-700">{formatDate(a.date_of_incorporation)}</dd></div>}
                {a.address_postcode && <div className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {a.address_city}, {a.address_postcode}</div>}
                {a.email && <div className="flex justify-between"><dt>Email</dt><dd className="truncate text-slate-700">{a.email}</dd></div>}
              </dl>
              <div className="mt-3 flex items-center gap-2">
                {a.ch_links_self && (
                  <a href={a.ch_links_self} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline">
                    <ExternalLink className="h-3 w-3" /> Companies House
                  </a>
                )}
                {a.sharepoint_folder && (
                  <a href={a.sharepoint_folder} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline">
                    <ExternalLink className="h-3 w-3" /> SharePoint
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}