import React, { useEffect, useState, useMemo } from "react";
import { loadProjectPOs, isLegacyProject } from '@/components/projects/poLinking';
import StageDrawing from '@/components/projects/StageDrawing';
import agreementNames from '@/components/projects/agreementNames';
import { projectCompletionDates } from '@/components/projects/projectCompletionDates';
import ProjectEmptyState from '@/components/projects/ProjectEmptyState';
import { legalDocumentName, dmaName, jctName, warrantyName } from "@/components/documents/documentNames";
import {
  Building2, FileText, FileCheck, Gavel, ShieldCheck, Receipt, Calendar,
} from "lucide-react";

const CATEGORIES = {
  project: { label: "Project", icon: Building2, dot: "bg-blue-500", chip: "bg-blue-50 text-blue-700 border-blue-200" },
  legal: { label: "Legal Document", icon: FileText, dot: "bg-indigo-500", chip: "bg-indigo-50 text-indigo-700 border-indigo-200" },
  dma: { label: "DMA", icon: FileCheck, dot: "bg-violet-500", chip: "bg-violet-50 text-violet-700 border-violet-200" },
  jct: { label: "JCT", icon: Gavel, dot: "bg-purple-500", chip: "bg-purple-50 text-purple-700 border-purple-200" },
  warranty: { label: "Warranty", icon: ShieldCheck, dot: "bg-teal-500", chip: "bg-teal-50 text-teal-700 border-teal-200" },
  po: { label: "Purchase Order", icon: Receipt, dot: "bg-amber-500", chip: "bg-amber-50 text-amber-700 border-amber-200" },
};

function buildEvents(project, legalDocs, dmas, jcts, warranties, pos, accountMap, supplierOnly) {
  const ev = [];
  const add = (date, label, cat, detail) => {
    if (!date) return;
    const d = new Date(date);
    if (isNaN(d.getTime())) return;
    ev.push({ ts: d.getTime(), date, label, cat, detail });
  };

  if (!supplierOnly) {
    const expectedDates = projectCompletionDates(project);
    add(project.pq_approval_date, "Project Questionnaire approved", "project");
    add(project.aa_executed_date, `${agreementNames(project.project_number).access} executed`, "project");
    add(project.ie_commencement_date, "Insights & Engagement commenced", "project");
    add(project.practical_completion_date, 'Construction — Actual Completion', 'project');
    add(expectedDates.riba5_system_date, 'Construction — Expected Completion (system)', 'project');
    [1, 2, 3, 4].forEach(stage => {
      add(project[`riba${stage}_end`], `RIBA ${stage} — Actual Completion`, 'project');
      add(expectedDates[`riba${stage}_system_date`], `RIBA ${stage} — Expected Completion (system)`, 'project');
    });
  }

  legalDocs.forEach((d) => {
    const id = legalDocumentName(d, project.name, accountMap[d.account_id]?.name, project.project_number);
    add(d.drafted_date, `${id} drafted`, "legal");
    add(d.approval_date, `${id} approved`, "legal", d.approval_status);
    add(d.sent_to_client, `${id} sent to client`, "legal");
    add(d.date_of_execution, `${id} executed`, "legal");
  });

  dmas.forEach((d) => {
    const id = dmaName(project.name, project.project_number);
    add(d.drafted_date, `${id} drafted`, "dma");
    add(d.approval_date, `${id} approved`, "dma", d.approval_status);
    add(d.sent_for_signing, `${id} sent for signing`, "dma");
    add(d.date_of_execution, `${id} executed`, "dma");
  });

  jcts.forEach((d) => {
    const id = jctName(project.name, accountMap[d.contractor_id]?.name || accountMap[d.account_id]?.name);
    add(d.drafted_date, `${id} drafted`, "jct");
    add(d.sent_for_signing, `${id} sent for signing`, "jct");
    add(d.date_of_execution, `${id} executed`, "jct");
    add(d.practical_completion, `${id} practical completion`, "jct");
    add(d.loi_expiry_date, `${id} LOI expires`, "jct");
  });

  warranties.forEach((d) => {
    const id = warrantyName(accountMap[d.supplier_id]?.name || accountMap[d.account_id]?.name, d.services);
    add(d.drafted_date, `${id} drafted`, "warranty");
    add(d.jct_signed, `${id} JCT signed`, "warranty");
    add(d.date_of_execution, `${id} executed`, "warranty");
    add(d.practical_completion, `${id} practical completion`, "warranty");
    add(d.warranty_due, `${id} warranty due`, "warranty");
    add(d.reminder_date, `${id} reminder`, "warranty");
  });

  pos.forEach((p) => {
    const id = p.po_number || "PO";
    const refs = isLegacyProject(project) ? ` · Legal: ${project.project_number} · PO: ${p.project_ref || 'not recorded'}` : '';
    add(p.approval_date, `${id} approved`, "po", `${p.supplier_company_number || ''}${refs}`);
    add(p.sent_date, `${id} sent`, "po", `${p.supplier_company_number || ''}${refs}`);
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

export function ProjectTimelineTab({ project, legalDocs, dmas, jcts, warranties, accountMap, supplierOnly = false, supplierCompanyNumber, supplierOrders = null }) {
  const categories = supplierOnly ? Object.entries(CATEGORIES).filter(([key]) => ['legal', 'jct', 'warranty', 'po'].includes(key)) : Object.entries(CATEGORIES);
  const [pos, setPos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState(() => Object.keys(CATEGORIES));
  const [sortOrder, setSortOrder] = useState("newest");

  useEffect(() => {
    (async () => {
      try {
        if (supplierOnly) { setPos(supplierOrders || []); return; }
        if (!project.project_number) return;
        const data = await loadProjectPOs(project).catch(() => []);
        setPos(data);
      } finally {
        setLoading(false);
      }
    })();
  }, [project.id, supplierOnly, supplierOrders]);

  const allEvents = useMemo(
    () => buildEvents(project, legalDocs, dmas, jcts, warranties, pos, accountMap, supplierOnly),
    [project, legalDocs, dmas, jcts, warranties, pos, accountMap, supplierOnly]
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
        {categories.map(([key, c]) => {
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
              {key === 'dma' ? agreementNames(project.project_number).developmentShort : c.label}
            </button>
          );
        })}
        {categories.some(([key]) => !active.includes(key)) && (
          <button
            type="button"
            onClick={() => setActive(categories.map(([key]) => key))}
            className="inline-flex items-center rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-500 hover:text-slate-900"
          >
            Show all
          </button>
        )}
      </div>


      {/* Chronological timeline */}
      {events.length === 0 ? (
        <ProjectEmptyState icon={Calendar} title={allEvents.length ? 'No events match these categories.' : supplierOnly ? 'No dated events linked to your supplier account yet.' : 'No dated events for this project yet.'} description={allEvents.length ? 'Select more categories to see the project history.' : 'Dated milestones and document progress will appear here when recorded.'} {...(allEvents.length ? { onAction: () => setActive(categories.map(([key]) => key)), action: 'Show all categories' } : { to: `/projects/${project.id}?tab=general`, action: 'View project details' })} />
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
                        <span className="inline-flex items-center gap-2">{(/^RIBA [1-4] — /.test(e.label)) && <StageDrawing stage={`RIBA ${e.label.match(/[1-4]/)[0]}`} className="h-10 w-10" />}<span className="text-sm font-semibold text-slate-900">{e.label}</span></span>
                        <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium ${cat.chip}`}>
                          {e.cat === 'dma' ? agreementNames(project.project_number).developmentShort : cat.label}
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