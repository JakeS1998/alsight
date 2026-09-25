import React from "react";
import { formatCurrency } from "@/lib/portal";
import { PoundSterling, FolderKanban, Activity, TrendingUp } from "lucide-react";

export function DashboardKPIs({ projects }) {
  const totalValue = projects.reduce((s, p) => s + (p.estimated_value || 0), 0);
  const liveCount = projects.filter((p) => p.live_project).length;
  const avgValue = projects.length > 0 ? totalValue / projects.length : 0;

  const kpis = [
    { label: "Pipeline Value", value: formatCurrency(totalValue), icon: PoundSterling, accent: "bg-emerald-50 text-emerald-600" },
    { label: "Active Projects", value: projects.length, icon: FolderKanban, accent: "bg-sky-50 text-sky-600" },
    { label: "Live Projects", value: liveCount, icon: Activity, accent: "bg-amber-50 text-amber-600" },
    { label: "Avg Project Value", value: formatCurrency(avgValue), icon: TrendingUp, accent: "bg-violet-50 text-violet-600" },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {kpis.map((k) => {
        const Icon = k.icon;
        return (
          <div key={k.label} className="rounded-2xl border border-slate-200 bg-white p-5">
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