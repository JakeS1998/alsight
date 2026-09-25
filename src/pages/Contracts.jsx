import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { CONTRACT_STATUS, formatCurrency, formatDate } from "@/lib/portal";
import { StatusBadge } from "@/components/StatusBadge";
import { Download, FileText, Loader2 } from "lucide-react";

export default function Contracts() {
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    base44.entities.Contract.list("-updated_date", 200)
      .then(setContracts)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight text-slate-900">Contracts</h1>
        <p className="mt-1 text-sm text-slate-500">Download PDF copies of your contracts.</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-slate-800" /></div>
      ) : contracts.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white py-16 text-center">
          <FileText className="mx-auto h-8 w-8 text-slate-300" />
          <p className="mt-3 text-sm text-slate-500">No contracts available to you yet.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {contracts.map((c) => (
            <div key={c.id} className="flex flex-col rounded-2xl border border-slate-200 bg-white p-5">
              <div className="mb-3 flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-900">{c.title}</p>
                  <p className="mt-0.5 truncate text-xs text-slate-500">{c.project_name || "—"}</p>
                </div>
                <StatusBadge status={c.status} map={CONTRACT_STATUS} />
              </div>
              <dl className="flex-1 space-y-1.5 text-xs text-slate-500">
                <div className="flex justify-between"><dt>Client</dt><dd className="text-slate-700">{c.client_name || "—"}</dd></div>
                <div className="flex justify-between"><dt>Supplier</dt><dd className="text-slate-700">{c.supplier_name || "—"}</dd></div>
                <div className="flex justify-between"><dt>Value</dt><dd className="text-slate-700">{formatCurrency(c.value)}</dd></div>
                <div className="flex justify-between"><dt>Signed</dt><dd className="text-slate-700">{formatDate(c.signed_date)}</dd></div>
              </dl>
              {c.file_url ? (
                <a href={c.file_url} download={c.file_name || c.title} target="_blank" rel="noreferrer"
                  className="mt-4 flex items-center justify-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50">
                  <Download className="h-4 w-4" /> Download PDF
                </a>
              ) : (
                <p className="mt-4 rounded-lg bg-slate-50 px-3 py-2 text-center text-xs text-slate-400">No file attached</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}