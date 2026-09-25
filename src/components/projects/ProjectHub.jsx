import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { PROJECT_STATUS, CONTRACT_STATUS, CONTRACT_TYPE, formatCurrency, formatDate } from "@/lib/portal";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronRight, Download, Building2, Truck, Calendar, PoundSterling, Loader2 } from "lucide-react";

const DOC_ORDER = [
  "project_questionnaire",
  "access_agreement",
  "supplier_appointment",
  "development_agreement",
  "jct_contract",
];

export function ProjectHub({ project, contracts, canEditStatus, onUpdated }) {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState(project.status);
  const [saving, setSaving] = useState(false);

  const linked = (contracts || []).filter((c) => c.project_id === project.id);
  const byType = {};
  linked.forEach((c) => {
    if (!byType[c.contract_type]) byType[c.contract_type] = c;
  });

  const saveStatus = async () => {
    setSaving(true);
    try {
      const updated = await base44.entities.Project.update(project.id, { status });
      onUpdated(updated);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-3 p-5 text-left transition-colors hover:bg-slate-50"
      >
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate text-base font-semibold text-slate-900">{project.name}</p>
            <StatusBadge status={project.status} map={PROJECT_STATUS} />
          </div>
          <p className="mt-1 line-clamp-1 text-sm text-slate-500">{project.description || "—"}</p>
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
            <span className="inline-flex items-center gap-1"><Building2 className="h-3.5 w-3.5" /> {project.client_name || "—"}</span>
            <span className="inline-flex items-center gap-1"><Truck className="h-3.5 w-3.5" /> {project.supplier_name || "—"}</span>
            <span className="inline-flex items-center gap-1"><PoundSterling className="h-3.5 w-3.5" /> {formatCurrency(project.budget)}</span>
            <span className="inline-flex items-center gap-1"><Calendar className="h-3.5 w-3.5" /> {formatDate(project.start_date)}</span>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">{linked.length} docs</span>
          {open ? <ChevronDown className="h-5 w-5 text-slate-400" /> : <ChevronRight className="h-5 w-5 text-slate-400" />}
        </div>
      </button>

      {open && (
        <div className="border-t border-slate-100 bg-slate-50/60 p-5">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">Linked documents</p>
          <div className="relative ml-2">
            <span className="absolute left-[5px] top-2 bottom-2 w-px bg-slate-200" />
            <ul className="space-y-3">
              {DOC_ORDER.map((type) => {
                const c = byType[type];
                return (
                  <li key={type} className="relative pl-7">
                    <span className="absolute left-[5px] top-5 h-px w-6 bg-slate-200" />
                    <span className="absolute left-[10px] top-3.5 h-2.5 w-2.5 rounded-full border-2 border-primary bg-white" />
                    <div className="rounded-xl border border-slate-200 bg-white p-3.5">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-[11px] font-semibold uppercase tracking-wide text-primary">{CONTRACT_TYPE[type]?.label}</p>
                          <p className="mt-0.5 truncate text-sm font-medium text-slate-800">
                            {c ? c.title : "Not yet created"}
                          </p>
                        </div>
                        {c ? (
                          <StatusBadge status={c.status} map={CONTRACT_STATUS} />
                        ) : (
                          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-400">Pending</span>
                        )}
                      </div>
                      {c && (
                        <div className="mt-2 flex items-center justify-between">
                          <span className="text-xs text-slate-500">
                            {c.value ? formatCurrency(c.value) : "—"}
                            {c.signed_date && <span className="ml-2 text-slate-400">Signed {formatDate(c.signed_date)}</span>}
                          </span>
                          {c.file_url ? (
                            <a
                              href={c.file_url}
                              download={c.file_name}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
                            >
                              <Download className="h-3.5 w-3.5" /> PDF
                            </a>
                          ) : (
                            <span className="text-xs text-slate-400">No file</span>
                          )}
                        </div>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>

          {canEditStatus && (
            <div className="mt-4 flex items-end gap-3 border-t border-slate-200 pt-4">
              <div className="flex-1 space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-600">Update project status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm"
                >
                  {Object.entries(PROJECT_STATUS).map(([k, v]) => (
                    <option key={k} value={k}>{v.label}</option>
                  ))}
                </select>
              </div>
              <Button onClick={saveStatus} disabled={saving || status === project.status} className="bg-primary hover:bg-primary/90">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}