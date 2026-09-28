import React from "react";
import { formatCurrency } from "@/lib/portal";
import { Activity, AlertTriangle, FileText, FolderKanban, PoundSterling, Receipt } from "lucide-react";
import DashboardInfoTooltip from "@/components/dashboard/DashboardInfoTooltip";

export default function PortfolioSummary({ metrics }) {
  const cards = [
    { label: "Active pipeline", value: metrics.projects, detail: `${metrics.live} live`, icon: FolderKanban, tone: "bg-chart-4/30 text-als-navy", help: "Projects that are active, not marked complete, and have not passed their practical completion date. The live figure counts those marked Live." },
    { label: "Estimated project value", value: formatCurrency(metrics.value), detail: "Active pipeline", icon: PoundSterling, tone: "bg-primary/15 text-als-navy", help: "The sum of estimated values for projects in the active pipeline." },
    { label: "Projects at risk", value: metrics.atRisk, detail: `${metrics.highRisk} high priority`, icon: AlertTriangle, tone: "bg-rose-50 text-rose-700", help: "Active pipeline projects with an open risk, an overdue unfinished action, or a delayed or overdue forecast completion. High priority includes red risks, high-probability and high-impact risks, overdue high-priority actions, or overdue forecast completion." },
    { label: "Purchase orders (net)", value: formatCurrency(metrics.poNet), detail: "Linked to active projects", icon: Receipt, tone: "bg-chart-5/30 text-als-navy", help: "The sum of net values for active purchase orders linked by project reference to projects in the active pipeline." },
    { label: "Current fee proposals", value: formatCurrency(metrics.feeValue), detail: "One revision per project", icon: FileText, tone: "bg-chart-2/15 text-als-navy", help: "The total fee value of one proposal per active pipeline project: the current revision when marked, otherwise the highest revision number." },
    { label: "Recorded contract sums", value: formatCurrency(metrics.contractValue), detail: "Delivery records", icon: Activity, tone: "bg-chart-4/30 text-als-navy", help: "The sum of contract amounts from the latest delivery record for each active pipeline project." },
  ];
  return <div className="grid grid-cols-2 gap-4 xl:grid-cols-3">
    {cards.map(({ label, value, detail, icon: Icon, tone, help }) => <div key={label} className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
      <div className={`mb-3 inline-flex h-9 w-9 items-center justify-center rounded-lg ${tone}`}><Icon className="h-4 w-4" /></div>
      <p className="break-words text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl">{value}</p>
      <div className="mt-1 flex items-center gap-1.5"><p className="text-sm font-medium text-slate-700">{label}</p><DashboardInfoTooltip label={label}>{help}</DashboardInfoTooltip></div>
      <p className="text-xs text-slate-500">{detail}</p>
    </div>)}
  </div>;
}