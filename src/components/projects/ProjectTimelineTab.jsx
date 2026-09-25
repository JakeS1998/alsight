import React, { useEffect, useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import {
  Building2, FileText, FileCheck, Gavel, ShieldCheck, Receipt, FileX, Calendar,
} from "lucide-react";

const CATEGORIES = {
  project: { label: "Project", icon: Building2, dot: "bg-blue-500", chip: "bg-blue-50 text-blue-700 border-blue-200" },
  legal: { label: "Legal Document", icon: FileText, dot: "bg-indigo-500", chip: "bg-indigo-50 text-indigo-700 border-indigo-200" },
  dma: { label: "DMA", icon: FileCheck, dot: "bg-violet-500", chip: "bg-violet-50 text-violet-700 border-violet-200" },
  jct: { label: "JCT", icon: Gavel, dot: "bg-purple-500", chip: "bg-purple-50 text-purple-700 border-purple-200" },
  warranty: { label: "Warranty", icon: ShieldCheck, dot: "bg-teal-500", chip: "bg-teal-50 text-teal-700 border-teal-200" },
  po: { label: "Purchase Order", icon: Receipt, dot: "bg-amber-500", chip: "bg-amber-50 text-amber-700 border-amber-200" },
};

function buildEvents(project, legalDocs, dmas, jcts, warranties, pos) {
  const ev = [];
  const add = (date, label, cat, detail) => {
    if (!date) return;
    const d = new Date(date);
    if (isNaN(d.getTime())) return;
    ev.push({ ts: d.getTime(), date, label, cat, detail });
  };

  add(project.pq_approval_date, "Project Questionnaire approved", "project");
  add(project.aa_executed_date, "Access Agreement executed", "project");
  add(project.ie_commencement_date, "Insights & Engagement commenced", "project");
  add(project.practical_completion_date, "Practical completion", "project");
  add(project.riba1_end, "RIBA Stage 1 complete", "project");
  add(project.riba2_end, "RIBA Stage 2 complete", "project");
  add(project.riba3_end, "RIBA Stage 3 complete", "project");
  add(project.riba4_end, "RIBA Stage 4 complete", "project");

  legalDocs.forEach((d) => {
    const id = d.document_id || "Document";
    add(d.drafted_date, `${id} drafted`, "legal");
    add(d.approval_date, `${id} approved`, "legal", d.approval_status);
    add(d.sent_to_client, `${id} sent to client`, "legal");
    add(d.date_of_execution, `${id} executed`, "legal");
  });

  dmas.forEach((d) => {
    const id = d.document_id || "DMA";
    add(d.drafted_date, `${id} drafted`, "dma");
    add(d.approval_date, `${id} approved`, "dma", d.approval_status);
    add(d.sent_for_signing, `${id} sent for signing`, "dma");
    add(d.date_of_execution, `${id} executed`, "dma");
  });

  jcts.forEach((d) => {
    const id = d.document_id || "JCT";
    add(d.drafted_date, `${id} drafted`, "jct");
    add(d.sent_for_signing, `${id} sent for signing`, "jct");
    add(d.date_of_execution, `${id} executed`, "jct");
    add(d.practical_completion, `${id} practical completion`, "jct");
    add(d.loi_expiry_date, `${id} LOI expires`, "jct");
  });

  warranties.forEach((d) => {
    const id = d.warranty_id || "Warranty";
    add(d.drafted_date, `${id} drafted`, "warranty");
    add(d.jct_signed, `${id} JCT signed`, "warranty");
    add(d.date_of_execution, `${id} executed`, "warranty");
    add(d.practical_completion, `${id} practical completion`, "warranty");
    add(d.warranty_due, `${id} warranty due`, "warranty");
    add(d.reminder_date, `${id} reminder`, "warranty");
  });

  pos.forEach((p) => {
    const id = p.po_number || "PO";
    add(p.approval_date, `${id} approved`, "po", p.supplier_company_number);
    add(p.sent_date, `${id} sent`, "po", p.supplier_company_number);
  });

  return ev.sort((a, b) => b.ts - a.ts); // newest first
}

function DateLabel({ date }) {
  const d = new Date(date);
  return (
    <div className="text-right">
      <p className="text-sm font-semibold leading-tight text-slate-900">
        {d.toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
      </p>
      <p className="text-[11px] leading-tight text-slate-400">
        {d.toLocaleDateString("en-GB", { year: "numeric" })}
      </p>
    </div>
  );
}

export function ProjectTimelineTab({ project, legalDocs, dmas, jcts, warranties }) {
  const [pos, setPos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState(() => Object.keys(CATEGORIES));
  const [sortOrder, setSortOrder] = useState("newest");

  useEffect(() => {
    (async () => {
      try {
        if (!project.project_number) return;
        const data = await base44.entities.PurchaseOrder
          .filter({ project_ref: project.project_number }, "-created_date", 1000)
          .catch(() => []);
        setPos(data);
      } finally {
        setLoading(false);
      }
    })();
  }, [project.id]);

  const allEvents = useMemo(
    () => buildEvents(project, legalDocs, dmas, jcts, warranties, pos),
    [project, legalDocs, dmas, jcts, warranties, pos]
  );
  const events = useMemo(
    () => allEvents.filter((e) => active.includes(e.cat)).sort((a, b) => sortOrder === "newest" ? b.ts - a.ts : a.ts - b.ts),
    [allEvents, active, sortOrder]
  );

  const toggle = (key) =>
    setActive((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Category filters */}
      <div className="flex flex-wrap gap-2">
        {Object.entries(CATEGORIES).map(([key, c]) => {
          const on = active.includes(key);
          return (
            <button
              key={key}
              type="button"
              onClick={() => toggle(key)}
              className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors ${
                on
                  ? "border-slate-300 bg-white text-slate-900"
                  : "border-slate-200 bg-slate-50 text-slate-400"
              }`}
            >
              <span className={`h-2 w-2 rounded-full ${on ? c.dot : "bg-slate-300"}`} />
              {c.label}
            </button>
          );
        })}
        {active.length !== Object.keys(CATEGORIES).length && (
          <button
            type="button"
            onClick={() => setActive(Object.keys(CATEGORIES))}
            className="inline-flex items-center rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-500 hover:text-slate-900"
          >
            Show all
          </button>
        )}
      </div>

      {/* Invoice placeholder */}
      <div className="flex items-center gap-3 rounded-xl border border-dashed border-slate-300 bg-slate-50/60 px-4 py-3">
        <FileX className="h-5 w-5 text-slate-400" />
        <div>
          <p className="text-sm font-medium text-slate-600">Invoices</p>
          <p className="text-xs text-slate-400">Invoice tracking will appear here once invoice data is connected.</p>
        </div>
      </div>

      {/* Chronological timeline */}
      {events.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white py-12 text-center">
          <Calendar className="mx-auto h-8 w-8 text-slate-300" />
          <p className="mt-3 text-sm text-slate-500">No dated events for this project yet.</p>
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3 mb-4">
            <Calendar className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-semibold text-slate-900">Project Timeline</h3>
            <div className="ml-auto flex items-center gap-3">
              <div className="inline-flex rounded-lg border border-slate-200 p-0.5">
                <button type="button" onClick={() => setSortOrder("newest")} className={`rounded-md px-2 py-0.5 text-xs font-medium ${sortOrder === "newest" ? "bg-primary text-white" : "text-slate-500 hover:text-slate-900"}`}>Newest</button>
                <button type="button" onClick={() => setSortOrder("oldest")} className={`rounded-md px-2 py-0.5 text-xs font-medium ${sortOrder === "oldest" ? "bg-primary text-white" : "text-slate-500 hover:text-slate-900"}`}>Oldest</button>
              </div>
              <span className="text-xs text-slate-400">{events.length} events</span>
            </div>
          </div>

          <div className="relative">
            {events.map((e, i) => {
              const cat = CATEGORIES[e.cat];
              const Icon = cat.icon;
              const isLast = i === events.length - 1;
              return (
                <div key={i} className="relative flex items-stretch gap-4 pb-5 last:pb-0">
                  {/* Date column */}
                  <div className="w-20 shrink-0 pt-2.5">
                    <DateLabel date={e.date} />
                  </div>

                  {/* Node + connector column */}
                  <div className="relative w-8 shrink-0 flex justify-center">
                    {/* vertical connector line */}
                    {!isLast && (
                      <div className="absolute top-3 bottom-[-20px] w-0.5 bg-slate-200 left-1/2 -translate-x-1/2" />
                    )}
                    {/* node */}
                    <div className={`relative z-10 mt-2 flex h-8 w-8 items-center justify-center rounded-full text-white ring-4 ring-white ${cat.dot}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0 pt-1.5">
                    <div className="rounded-lg border border-slate-200 bg-slate-50/50 px-4 py-2.5">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="text-sm font-semibold text-slate-900">{e.label}</p>
                        <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium ${cat.chip}`}>
                          {cat.label}
                        </span>
                      </div>
                      {e.detail && (
                        <p className="mt-1 text-xs text-slate-500">{e.detail}</p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default ProjectTimelineTab;