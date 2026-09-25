import React, { useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from "recharts";
import { formatCurrency } from "@/lib/portal";

const STAGES = ["RIBA 1", "RIBA 2", "RIBA 3", "RIBA 4", "Construction"];
const COLORS = ["hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))", "hsl(var(--chart-5))"];

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

export function PipelineChart({ projects }) {
  const data = useMemo(() => {
    const map = {};
    STAGES.forEach((s) => { map[s] = { stage: s, value: 0, count: 0 }; });
    projects.forEach((p) => {
      const stage = getProjectStage(p);
      if (!stage) return;
      map[stage].value += p.estimated_value || 0;
      map[stage].count++;
    });
    return STAGES.map((s) => map[s]);
  }, [projects]);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-slate-900">Pipeline Value by Stage</h3>
        <p className="text-xs text-slate-500">Total estimated value at each RIBA stage</p>
      </div>
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={data} margin={{ left: -10, right: 10, top: 10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
          <XAxis dataKey="stage" tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} />
          <YAxis tickFormatter={(v) => `£${(v / 1000000).toFixed(1)}M`} tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} />
          <Tooltip
            contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 12 }}
            formatter={(v) => [formatCurrency(v), "Value"]}
            cursor={{ fill: "#f1f5f9" }}
          />
          <Bar dataKey="value" radius={[6, 6, 0, 0]} barSize={36}>
            {data.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}