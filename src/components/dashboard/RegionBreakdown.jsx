import React, { useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { regionName } from "@/lib/portal";
import IncomeProjectionKey, { IncomeProjectionTooltip } from "@/components/dashboard/IncomeProjectionKey";

export function RegionBreakdown({ projects, confirmedAmounts = {}, invoicesLoading = false, invoicesError = '' }) {
  const data = useMemo(() => {
    const map = {};
    projects.forEach((p) => {
      const region = regionName(p.department_id);
      if (!region || region === p.department_id || region === "Business Support Services") return; // skip unmapped/unassigned and Business Support Services
      if (!map[region]) map[region] = { region, count: 0, value: 0, confirmed: 0, remaining: 0 };
      const value = Number(p.estimated_value) || 0;
      const paid = Number(confirmedAmounts[p.id]) || 0;
      map[region].count++;
      map[region].value += value;
      map[region].confirmed += paid;
      map[region].remaining = Math.max(0, map[region].value - map[region].confirmed);
    });
    return Object.values(map).sort((a, b) => b.value - a.value);
  }, [projects, confirmedAmounts]);

  return (
    <div className="min-w-0 rounded-xl border border-border bg-card p-4">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-slate-900">Project Value by Region</h3>
        <p className="text-xs text-slate-500">Paid invoices versus total project value by operating region</p>
        <IncomeProjectionKey />
      </div>
      {invoicesLoading ? <div className="flex h-[260px] items-center justify-center text-sm text-slate-500">Loading invoice totals…</div> : invoicesError ? <p role="alert" className="py-10 text-sm text-destructive">{invoicesError}</p> : data.length === 0 ? (
        <div className="flex h-[260px] items-center justify-center text-sm text-slate-400">No data available</div>
      ) : (
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={data} layout="vertical" margin={{ left: 20, right: 20, top: 10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
            <XAxis type="number" tickFormatter={(v) => `£${(v / 1000000).toFixed(1)}M`} tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} />
            <YAxis type="category" dataKey="region" width={100} tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} />
            <Tooltip content={<IncomeProjectionTooltip />} cursor={{ fill: "#f1f5f9" }} />
            <Bar dataKey="confirmed" stackId="value" fill="hsl(var(--chart-1))" barSize={20} />
            <Bar dataKey="remaining" stackId="value" fill="hsl(var(--chart-2))" radius={[0, 6, 6, 0]} barSize={20} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}