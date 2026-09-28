import React from "react";
import { formatCurrency } from "@/lib/portal";
import { Activity, AlertTriangle, FileText, FolderKanban, PoundSterling, Receipt } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export default function PortfolioSummary({ metrics }) {
  const cards = [
    { label: "Active pipeline", value: metrics.projects, detail: `${metrics.live} live`, icon: FolderKanban, tone: "bg-chart-4/30 text-als-navy" },
    { label: "Estimated project value", value: formatCurrency(metrics.value), detail: "Active pipeline", icon: PoundSterling, tone: "bg-primary/15 text-als-navy" },
    { label: "Projects at risk", value: metrics.atRisk, detail: `${metrics.highRisk} high priority`, icon: AlertTriangle, tone: "bg-rose-50 text-rose-700" },
    { label: "Purchase orders (net)", value: formatCurrency(metrics.poNet), detail: "Linked to active projects", icon: Receipt, tone: "bg-chart-5/30 text-als-navy" },
    { label: "Current fee proposals", value: formatCurrency(metrics.feeValue), detail: "One revision per project", icon: FileText, tone: "bg-chart-2/15 text-als-navy" },
    { label: "Recorded contract sums", value: formatCurrency(metrics.contractValue), detail: "Delivery records", icon: Activity, tone: "bg-chart-4/30 text-als-navy" },
  ];
  return <div className="grid grid-cols-2 gap-4 xl:grid-cols-3">
    {cards.map(({ label, value, detail, icon: Icon, tone }) => <div key={label} className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
      <div className={`mb-3 inline-flex h-9 w-9 items-center justify-center rounded-lg ${tone}`}><Icon className="h-4 w-4" /></div>
      <p className="break-words text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl">{value}</p>
      <p className="mt-1 flex items-center gap-1.5 text-sm font-medium text-slate-700">{label}{label === "Projects at risk" && <TooltipProvider><Tooltip><TooltipTrigger asChild><button type="button" aria-label="How projects are flagged at risk" className="flex h-5 w-5 items-center justify-center rounded-full border border-slate-400 text-xs font-semibold text-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">?</button></TooltipTrigger><TooltipContent side="top" className="max-w-xs bg-als-navy p-3 text-sidebar-foreground shadow-lg"><p className="font-semibold">A project in the active pipeline is flagged if it has:</p><ul className="mt-1 list-disc space-y-1 pl-4"><li>Any open project risk;</li><li>An unfinished action past its due date;</li><li>An unachieved forecast completion date that has passed; or</li><li>A forecast completion date later than the original date.</li></ul><p className="mt-2">High priority means a red risk (or high probability and impact), an overdue high-priority action, or an overdue forecast completion date.</p></TooltipContent></Tooltip></TooltipProvider>}</p>
      <p className="text-xs text-slate-500">{detail}</p>
    </div>)}
  </div>;
}