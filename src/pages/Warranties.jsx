import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from '@/lib/AuthContext';
import { listAll } from "@/components/data/loadAll";
import { formatDate, WARRANTY_STATUS } from "@/lib/portal";
import { WarrantyStatusBadge, WarrantyCategoryBadge } from "@/components/StatusBadge";
import { ShieldCheck, ExternalLink } from "lucide-react";
import RecordUpdatedAt from '@/components/RecordUpdatedAt';
import DataverseRecordEdit from '@/components/dataverse/DataverseRecordEdit';

export default function Warranties() {
  const { user } = useAuth();
  const [warranties, setWarranties] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    (async () => {
      try {
        const [w, a] = await Promise.all([
          listAll(base44.entities.Warranty),
          listAll(base44.entities.Account, "-name").catch(() => []),
        ]);
        setWarranties(w);
        setAccounts(a);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const accountMap = {};
  accounts.forEach((a) => { if (a.dataverse_id) accountMap[a.dataverse_id] = a; });

  const filtered = statusFilter === "all" ? warranties : warranties.filter((w) => w.warranty_status === statusFilter);
  const statuses = Object.keys(WARRANTY_STATUS).filter((s) => warranties.some((w) => w.warranty_status === s));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight text-slate-900">Warranties</h1>
        <p className="mt-1 text-sm text-slate-500">Supplier warranties across all projects.</p>
      </div>

      {!loading && warranties.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <button onClick={() => setStatusFilter("all")}
            className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
              statusFilter === "all" ? "border-primary bg-primary text-primary-foreground" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
            }`}>All</button>
          {statuses.map((s) => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                statusFilter === s ? "border-primary bg-primary text-primary-foreground" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
              }`}>{WARRANTY_STATUS[s].label}</button>
          ))}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-20"><div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-primary" /></div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white py-16 text-center">
          <ShieldCheck className="mx-auto h-8 w-8 text-slate-300" />
          <p className="mt-3 text-sm text-slate-500">No warranties to show.</p>
        </div>
      ) : (
        <div className="min-w-0 w-full max-w-full overflow-x-auto rounded-2xl border border-slate-200 bg-white">
          <table className="w-full min-w-[640px]">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                <th className="px-4 py-3">Supplier</th>
                <th className="px-4 py-3">Services</th>
                <th className="hidden px-4 py-3 md:table-cell">Account</th>
                <th className="hidden px-4 py-3 sm:table-cell">Category</th>
                <th className="px-4 py-3">Status</th>
                <th className="hidden px-4 py-3 lg:table-cell">JCT Signed</th>
                <th className="hidden px-4 py-3 lg:table-cell">Due</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((w) => (
                <tr key={w.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 text-sm font-medium text-slate-900">{accountMap[w.supplier_id]?.name || accountMap[w.account_id]?.name || "Supplier unavailable"}</td>
                  <td className="px-4 py-3 text-sm text-slate-600">{w.services || "—"}<RecordUpdatedAt record={w} className="mt-2" /></td>
                  <td className="hidden px-4 py-3 text-sm text-slate-600 md:table-cell">
                    {accountMap[w.account_id]?.name || accountMap[w.supplier_id]?.name || "—"}
                  </td>
                  <td className="hidden px-4 py-3 sm:table-cell"><WarrantyCategoryBadge status={w.category} /></td>
                  <td className="px-4 py-3"><WarrantyStatusBadge status={w.warranty_status} dateOfExecution={w.date_of_execution} /></td>
                  <td className="hidden px-4 py-3 text-sm text-slate-600 lg:table-cell">{formatDate(w.jct_signed)}</td>
                  <td className="hidden px-4 py-3 text-sm text-slate-600 lg:table-cell">{formatDate(w.warranty_due)}</td>
                  <td className="px-4 py-3 text-right">
                    <DataverseRecordEdit table="warranties" record={w} onUpdated={updated => setWarranties(current => current.map(item => item.id === updated.id ? updated : item))} />
                    {user?.role !== 'supplier' && w.link_to_file && (
                      <a href={w.link_to_file} target="_blank" rel="noreferrer" className="inline-flex items-center text-blue-600 hover:underline">
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}