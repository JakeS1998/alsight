import React from "react";
import { formatCurrency } from "@/lib/portal";
import { PoundSterling, FolderKanban, Activity, TrendingUp } from "lucide-react";
import useProjectValueSummary from '@/components/projects/useProjectValueSummary';

export function DashboardKPIs({ projects, hideValues = false }) {
  const summary=useProjectValueSummary(projects,{enabled:!hideValues});
  const totalValue = summary.data?.total;
  const liveCount = summary.data?.live ?? projects.filter((p) => p.live_project).length;
  const avgValue = summary.data?.average;
  if(!hideValues && summary.isPending)return <p role="status" className="text-sm text-muted-foreground">Loading project values…</p>;
  if(!hideValues && summary.error)return <p role="alert" className="text-sm text-destructive">{summary.error.message}</p>;

  const kpis = [
    { label: "Pipeline Value", value: formatCurrency(totalValue), icon: PoundSterling, accent: "bg-primary/15 text-als-navy" },
    { label: "Active Projects", value: projects.length, icon: FolderKanban, accent: "bg-chart-4/30 text-als-navy" },
    { label: "Live Projects", value: liveCount, icon: Activity, accent: "bg-chart-5/30 text-als-navy" },
    { label: "Avg Project Value", value: formatCurrency(avgValue), icon: TrendingUp, accent: "bg-chart-2/15 text-als-navy" },
  ];

  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
      {kpis.filter(k => !hideValues || (k.label !== 'Pipeline Value' && k.label !== 'Avg Project Value')).map((k) => {
        const Icon = k.icon;
        return (
          <div key={k.label} className="min-w-0 rounded-xl border border-border bg-card p-4">
            <div className={`mb-3 inline-flex h-9 w-9 items-center justify-center rounded-lg ${k.accent}`}>
              <Icon className="h-4 w-4" />
            </div>
            <p className="text-2xl font-semibold tracking-tight text-slate-900">{k.value}</p>
            <p className="mt-0.5 text-sm text-slate-500">{k.label}</p>
          </div>
        );
      })}
    </div>
  );
}