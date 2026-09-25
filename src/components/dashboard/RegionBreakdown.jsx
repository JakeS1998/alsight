import React, { useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from "recharts";
import { formatCurrency, regionName } from "@/lib/portal";

const PALETTE = ["#FCA311", "#1D1D35", "#2BB673", "#3B82F6", "#A855F7", "#F43F5E", "#0EA5E9", "#64748b"];

export function RegionBreakdown({ projects, accountMap }) {
  const data = useMemo(() => {
    const map = {};
    projects.forEach((p) => {
      const account = accountMap[p.client_account_id];
      const region = regionName(account?.region) || "Unassigned";
      if (!map[region]) map[region] = { region, count: 0, value: 0 };
      map[region].count++;
      map[region].value += p.estimated_value || 0;
    });
    return Object.values(map).sort((a, b) => b.value - a.value);
  }, [projects, accountMap]);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-slate-900">Projects by Region</h3>
        <p className="text-xs text-slate-500">Pipeline value and project count by region</p>
      </div>
      {data.length === 0 ? (
        <div className="flex h-[260px] items-center justify-center text-sm text-slate-400">No data available</div>
      ) : (
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={data} layout="vertical" margin={{ left: 20, right: 20, top: 10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
            <XAxis type="number" tickFormatter={(v) => `£${(v / 1000000).toFixed(1)}M`} tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} />
            <YAxis type="category" dataKey="region" width={100} tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 12 }}
              formatter={(v, name) => name === "value" ? [formatCurrency(v), "Value"] : [v, "Projects"]}
              cursor={{ fill: "#f1f5f9" }}
            />
            <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={20}>
              {data.map((_, i) => <Cell key={i} fill={PALETTE[i % PALETTE.length]} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}