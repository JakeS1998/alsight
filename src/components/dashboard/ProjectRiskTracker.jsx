import React, { useState } from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, ArrowUpRight, ChevronDown, ChevronUp } from "lucide-react";
import { formatCurrency } from "@/lib/portal";
import DashboardInfoTooltip from "@/components/dashboard/DashboardInfoTooltip";

export default function ProjectRiskTracker({ atRisk, expanded: controlledExpanded, onExpandedChange }) {
  const [localExpanded, setLocalExpanded] = useState(false);
  const expanded = controlledExpanded ?? localExpanded;
  if (!atRisk?.length) return null;
  return <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-5 py-4">
      <div><h2 className="flex items-center gap-2 font-heading text-base font-semibold text-slate-900"><AlertTriangle className="h-4 w-4 text-amber-600" /> Projects at risk <DashboardInfoTooltip label="projects at risk" side="bottom"><p className="font-semibold">An active pipeline project is flagged when it has:</p><ul className="mt-1 list-disc space-y-1 pl-4"><li>An unfinished action past its due date;</li><li>An unachieved forecast completion date that has passed; or</li><li>An unachieved forecast completion date later than the original date.</li></ul><p className="mt-2">High priority means an overdue high-priority action or an overdue forecast completion date. Risk-register entries do not flag a project as at risk.</p></DashboardInfoTooltip></h2>
        <p className="text-xs text-slate-500">Overdue actions and completion dates · {atRisk.length} flagged</p></div>
        <button type="button" onClick={() => (onExpandedChange ? onExpandedChange(!expanded) : setLocalExpanded(!expanded))} aria-expanded={expanded} aria-controls="risk-project-list" className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50">{expanded ? <><ChevronUp className="h-4 w-4" /> Minimise</> : <><ChevronDown className="h-4 w-4" /> Expand</>}</button>
    </div>
    {expanded && <div id="risk-project-list" className="divide-y divide-slate-100">{atRisk.map(({ project, reasons, level }) => <Link key={project.id} to={`/projects/${project.id}?tab=delivery`} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 hover:bg-slate-50">
      <div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><span className="text-sm font-semibold text-slate-900">{project.name}</span>
        <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${level === "high" ? "bg-rose-50 text-rose-700" : "bg-amber-50 text-amber-700"}`}>{level === "high" ? "High" : "Watch"}</span></div>
        <p className="mt-0.5 text-xs text-slate-500">{project.project_number || "No reference"} · {reasons.slice(0, 3).join(" · ")}{reasons.length > 3 ? ` +${reasons.length - 3} more` : ""}</p></div>
      <div className="flex items-center gap-2 text-sm text-slate-600">{formatCurrency(project.estimated_value)}<ArrowUpRight className="h-4 w-4 text-slate-400" /></div>
    </Link>)}</div>}
  </section>;
}