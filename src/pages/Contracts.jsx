import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { CONTRACT_STATUS, CONTRACT_TYPE, formatCurrency, formatDate } from "@/lib/portal";
import { StatusBadge } from "@/components/StatusBadge";
import { Download, FileText, Loader2 } from "lucide-react";

export default function Contracts() {
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState("all");

  useEffect(() => {
    base44.entities.Contract.list("-updated_date", 200)
      .then(setContracts)
      .finally(() => setLoading(false));
  }, []);

  const filtered = typeFilter === "all" ? contracts : contracts.filter((c) => c.contract_type === typeFilter);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight text-slate-900">Contracts</h1>
        <p className="mt-1 text-sm text-slate-500">Legal documents across your leisure construction projects.</p>
      </div>

      {!loading && contracts.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <FilterPill active={typeFilter === "all"} onClick={() => setTypeFilter("all")}>All</FilterPill>
          {Object.entries(CONTRACT_TYPE).map(([key, cfg]) => (
            <FilterPill key={key} active={typeFilter === key} onClick={() => setTypeFilter(key)}>{cfg.label}</FilterPill>
          ))}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-20"><div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-slate-800" /></div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white py-16 text-center">
          <FileText className="mx-auto h-8 w-8 text-slate-300" />
          <p className="mt-3 text-sm text-slate-500">No documents match this filter.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((c) => (
            <div key={c.id} className="flex flex-col rounded-2xl border border-slate-200 bg-white p-5">
              <div className="mb-3 flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-900">{c.title}</p>
                  <p className="mt-0.5 truncate text-xs text-slate-500">{c.project_name || "—"}</p>
                  {c.contract_type && CONTRACT_TYPE[c.contract_type] && (
                    <span className="mt-1 inline-block rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary">{CONTRACT_TYPE[c.contract_type].label}</span>
                  )}
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

function FilterPill({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
        active ? "border-primary bg-primary text-primary-foreground" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
      }`}
    >
      {children}
    </button>
  );
}