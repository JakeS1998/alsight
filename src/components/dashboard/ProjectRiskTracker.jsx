import React from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, ArrowUpRight } from "lucide-react";
import { formatCurrency } from "@/lib/portal";

export default function ProjectRiskTracker({ atRisk, compact = false }) {
  const rows = compact ? atRisk.slice(0, 5) : atRisk;
  return <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-5 py-4">
      <div><h2 className="flex items-center gap-2 font-heading text-base font-semibold text-slate-900"><AlertTriangle className="h-4 w-4 text-amber-600" /> Projects at risk</h2>
        <p className="text-xs text-slate-500">Open risks, overdue actions and completion dates · {atRisk.length} flagged</p></div>
      {compact && <Link to="/analytics#at-risk" className="text-xs font-medium text-primary hover:underline">View all</Link>}
    </div>
    {rows.length ? <div className="divide-y divide-slate-100">{rows.map(({ project, reasons, level }) => <Link key={project.id} to={`/projects/${project.id}?tab=delivery`} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 hover:bg-slate-50">
      <div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><span className="text-sm font-semibold text-slate-900">{project.name}</span>
        <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${level === "high" ? "bg-rose-50 text-rose-700" : "bg-amber-50 text-amber-700"}`}>{level === "high" ? "High" : "Watch"}</span></div>
        <p className="mt-0.5 text-xs text-slate-500">{project.project_number || "No reference"} · {reasons.slice(0, compact ? 1 : 3).join(" · ")}{reasons.length > (compact ? 1 : 3) ? ` +${reasons.length - (compact ? 1 : 3)} more` : ""}</p></div>
      <div className="flex items-center gap-2 text-sm text-slate-600">{formatCurrency(project.estimated_value)}<ArrowUpRight className="h-4 w-4 text-slate-400" /></div>
    </Link>)}</div> : <p className="px-5 py-10 text-center text-sm text-slate-500">No active projects currently flagged.</p>}
  </section>;
}