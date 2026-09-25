import React from "react";
import { formatCurrency } from "@/lib/portal";
import { Activity, AlertTriangle, FileText, FolderKanban, PoundSterling, Receipt } from "lucide-react";

export default function PortfolioSummary({ metrics }) {
  const cards = [
    { label: "Active pipeline", value: metrics.projects, detail: `${metrics.live} live`, icon: FolderKanban, tone: "bg-sky-50 text-sky-700" },
    { label: "Estimated project value", value: formatCurrency(metrics.value), detail: "Active pipeline", icon: PoundSterling, tone: "bg-emerald-50 text-emerald-700" },
    { label: "Projects at risk", value: metrics.atRisk, detail: `${metrics.highRisk} high priority`, icon: AlertTriangle, tone: "bg-rose-50 text-rose-700" },
    { label: "Purchase orders (net)", value: formatCurrency(metrics.poNet), detail: "Linked to active projects", icon: Receipt, tone: "bg-amber-50 text-amber-700" },
    { label: "Current fee proposals", value: formatCurrency(metrics.feeValue), detail: "One revision per project", icon: FileText, tone: "bg-violet-50 text-violet-700" },
    { label: "Recorded contract sums", value: formatCurrency(metrics.contractValue), detail: "Delivery records", icon: Activity, tone: "bg-blue-50 text-blue-700" },
  ];
  return <div className="grid grid-cols-2 gap-4 xl:grid-cols-3">
    {cards.map(({ label, value, detail, icon: Icon, tone }) => <div key={label} className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
      <div className={`mb-3 inline-flex h-9 w-9 items-center justify-center rounded-lg ${tone}`}><Icon className="h-4 w-4" /></div>
      <p className="break-words text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl">{value}</p>
      <p className="mt-1 text-sm font-medium text-slate-700">{label}</p>
      <p className="text-xs text-slate-500">{detail}</p>
    </div>)}
  </div>;
}