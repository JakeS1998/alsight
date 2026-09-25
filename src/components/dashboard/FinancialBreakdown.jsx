import React, { useMemo } from "react";
import { BarChart, Bar, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatCurrency, regionName } from "@/lib/portal";

export default function FinancialBreakdown({ portfolio }) {
  const data = useMemo(() => {
    const byRegion = new Map();
    const regionByRef = new Map();
    portfolio.pipeline.forEach((p) => {
      const region = regionName(p.department_id) || "Unassigned";
      if (p.project_number) regionByRef.set(p.project_number, region);
      const row = byRegion.get(region) || { region, value: 0, poNet: 0 };
      row.value += Number(p.estimated_value) || 0;
      byRegion.set(region, row);
    });
    portfolio.orders.forEach((o) => {
      const row = byRegion.get(regionByRef.get(o.project_ref));
      if (row) row.poNet += Number(o.total_net_value) || 0;
    });
    return [...byRegion.values()].sort((a, b) => b.value - a.value);
  }, [portfolio]);
  return <section className="rounded-2xl border border-slate-200 bg-white p-5">
    <h2 className="font-heading text-base font-semibold text-slate-900">Financial exposure by region</h2>
    <p className="mb-5 text-xs text-slate-500">Estimated project value versus purchase orders (net) for active projects; not revenue or invoiced totals</p>
    {data.length ? <div className="h-80 w-full"><ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} layout="vertical" margin={{ left: 10, right: 20 }}>
        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
        <XAxis type="number" tickFormatter={(v) => `£${(v / 1e6).toFixed(1)}m`} tick={{ fontSize: 11 }} />
        <YAxis type="category" dataKey="region" width={120} tick={{ fontSize: 10 }} />
        <Tooltip formatter={(v, name) => [formatCurrency(v), name === "value" ? "Estimated value" : "PO net"]} />
        <Bar dataKey="value" name="Estimated value" fill="hsl(var(--chart-1))" radius={[0, 4, 4, 0]} />
        <Bar dataKey="poNet" name="PO net" fill="hsl(var(--chart-3))" radius={[0, 4, 4, 0]} />
      </BarChart>
    </ResponsiveContainer></div> : <p className="py-12 text-center text-sm text-slate-500">No active projects to chart.</p>}
  </section>;
}