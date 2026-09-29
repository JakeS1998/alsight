import React from "react";
import { Link } from "react-router-dom";
import { formatCurrency } from "@/lib/portal";
import { Activity, AlertTriangle, FileText, FolderKanban, PoundSterling, Receipt } from "lucide-react";
import DashboardInfoTooltip from "@/components/dashboard/DashboardInfoTooltip";

export default function PortfolioSummary({ metrics, onRiskClick }) {
  const cards = [
    { label: "Active pipeline", value: metrics.projects, detail: `${metrics.live} live`, icon: FolderKanban, tone: "bg-chart-4/30 text-als-navy", help: "Projects that are active, not marked complete, and have not passed their practical completion date. The live figure counts those marked Live.", path: '/projects' },
    { label: "Estimated project value", value: formatCurrency(metrics.value), detail: "Active pipeline", icon: PoundSterling, tone: "bg-primary/15 text-als-navy", help: "The sum of estimated values for projects in the active pipeline.", path: '/projects' },
    { label: "Projects at risk", value: metrics.atRisk, detail: metrics.atRisk ? `${metrics.highRisk} high priority · View projects` : "No high-priority issues", icon: AlertTriangle, tone: metrics.atRisk ? "bg-rose-50 text-rose-700" : "bg-slate-100 text-slate-600", help: "Active pipeline projects with an open risk, an overdue unfinished action, or a delayed or overdue forecast completion. High priority includes red risks, high-probability and high-impact risks, overdue high-priority actions, or overdue forecast completion.", onClick: metrics.atRisk ? onRiskClick : null },
    { label: "Current fee proposals", value: formatCurrency(metrics.feeValue), detail: "One revision per project", icon: FileText, tone: "bg-chart-2/15 text-als-navy", help: "The total fee value of one proposal per active pipeline project: the current revision when marked, otherwise the highest revision number." },
    { label: "Purchase orders (net)", value: formatCurrency(metrics.poNet), detail: "Linked to active projects", icon: Receipt, tone: "bg-chart-5/30 text-als-navy", help: "The sum of net values for active purchase orders linked by project reference to projects in the active pipeline." },
    { label: "Recorded contract sums", value: formatCurrency(metrics.contractValue), detail: "Delivery records", icon: Activity, tone: "bg-chart-4/30 text-als-navy", help: "The sum of contract amounts from the latest delivery record for each active pipeline project." },
  ];
  return <div className="space-y-3">
    <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">{cards.slice(0, 4).map((card) => <SummaryCard key={card.label} card={card} />)}</div>
    <div className="grid grid-cols-2 gap-3">{cards.slice(4).map((card) => <SummaryCard key={card.label} card={card} secondary />)}</div>
  </div>;
}

function SummaryCard({ card, secondary = false }) {
  const { label, value, detail, icon: Icon, tone, help, path, onClick } = card;
  const content = <><div className={`mb-3 inline-flex h-9 w-9 items-center justify-center rounded-lg ${tone}`}><Icon className="h-4 w-4" /></div><p className={`break-words font-semibold tracking-tight text-slate-900 ${secondary ? 'text-lg sm:text-xl' : 'text-xl sm:text-2xl'}`}>{value}</p><p className="mt-1 text-sm font-medium text-slate-700">{label}</p><p className="text-xs text-slate-500">{detail}</p></>;
  const className = `block rounded-2xl border bg-white text-left ${secondary ? 'border-slate-200 p-3 sm:p-4' : card.onClick ? 'border-rose-200 p-4 hover:border-rose-400 sm:p-5' : 'border-slate-200 p-4 sm:p-5'} ${path ? 'hover:border-primary' : ''}`;
  return <div className="relative min-w-0">{path ? <Link to={path} className={className}>{content}</Link> : onClick ? <button type="button" onClick={onClick} className={`w-full ${className}`}>{content}</button> : <div className={className}>{content}</div>}<span className="absolute bottom-3 right-3"><DashboardInfoTooltip label={label}>{help}</DashboardInfoTooltip></span></div>;
}