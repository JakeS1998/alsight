import React, { useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import IncomeProjectionKey, { IncomeProjectionTooltip } from "@/components/dashboard/IncomeProjectionKey";

const STAGES = ["RIBA 1", "RIBA 2", "RIBA 3", "RIBA 4", "Construction"];

function getProjectStage(p) {
  const now = new Date();
  if (p.status === "inactive" || ["complete", "completed"].includes(String(p.approval_status || "").trim().toLowerCase())) return null;
  if (p.practical_completion_date && new Date(p.practical_completion_date) < now) return null;
  if (p.riba4_end && new Date(p.riba4_end) < now) return "Construction";
  if (p.riba3_end && new Date(p.riba3_end) < now) return "RIBA 4";
  if (p.riba2_end && new Date(p.riba2_end) < now) return "RIBA 3";
  if (p.riba1_end && new Date(p.riba1_end) < now) return "RIBA 2";
  return "RIBA 1";
}

export function PipelineChart({ projects, confirmedAmounts = {}, invoicesLoading = false, invoicesError = '' }) {
  const data = useMemo(() => {
    const map = {};
    STAGES.forEach((s) => { map[s] = { stage: s, value: 0, confirmed: 0, remaining: 0, count: 0 }; });
    projects.forEach((p) => {
      const stage = getProjectStage(p);
      if (!stage) return;
      const value = Number(p.estimated_value) || 0;
      const paid = Number(confirmedAmounts[p.id]) || 0;
      map[stage].value += value;
      map[stage].confirmed += paid;
      map[stage].remaining = Math.max(0, map[stage].value - map[stage].confirmed);
      map[stage].count++;
    });
    return STAGES.map((s) => map[s]);
  }, [projects, confirmedAmounts]);

  return (
    <div className="flex h-full min-w-0 flex-col rounded-2xl border border-slate-200 bg-white p-5">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-slate-900">Pipeline Value by Stage</h3>
        <p className="text-xs text-slate-500">Paid invoices versus total project value at each RIBA stage</p>
        <IncomeProjectionKey />
      </div>
      {invoicesLoading ? <div className="flex h-80 items-center justify-center text-sm text-slate-500">Loading invoice totals…</div> : invoicesError ? <p role="alert" className="py-10 text-sm text-destructive">{invoicesError}</p> : <div className="h-80 min-w-0 w-full"><ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ left: -10, right: 10, top: 10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
          <XAxis dataKey="stage" tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} />
          <YAxis tickFormatter={(v) => `£${(v / 1000000).toFixed(1)}M`} tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} />
          <Tooltip content={<IncomeProjectionTooltip />} cursor={{ fill: "#f1f5f9" }} />
          <Bar dataKey="confirmed" stackId="value" fill="hsl(var(--chart-1))" maxBarSize={80} />
          <Bar dataKey="remaining" stackId="value" fill="hsl(var(--chart-2))" radius={[6, 6, 0, 0]} maxBarSize={80} />
        </BarChart>
      </ResponsiveContainer></div>}
    </div>
  );
}