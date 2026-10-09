import React, { useMemo } from "react";
import { BarChart, Bar, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatCurrency, regionName } from "@/lib/portal";
import useProjectValueSummary from '@/components/projects/useProjectValueSummary';

export default function FinancialBreakdown({ portfolio }) {
  const summary=useProjectValueSummary(portfolio.pipeline);
  const data = useMemo(() => {
    const byRegion = new Map();
    const regionByProject = new Map();
    for(const group of summary.data?.regions || []){const region=regionName(group.department_id) || 'Unassigned';if(region==='Business Support Services')continue;const row=byRegion.get(region) || {region,value:0,poNet:0};row.value+=group.value;byRegion.set(region,row);}
    portfolio.pipeline.forEach(p=>regionByProject.set(p.id,regionName(p.department_id) || 'Unassigned'));
    portfolio.orders.forEach((o) => {
      const row = byRegion.get(regionByProject.get(o.linked_project_id));
      if (row) row.poNet += Number(o.total_net_value) || 0;
    });
    return [...byRegion.values()].sort((a, b) => b.value - a.value);
  }, [portfolio,summary.data]);
  return <section className="flex h-full min-w-0 flex-col rounded-2xl border border-slate-200 bg-white p-5">
    <h2 className="font-heading text-base font-semibold text-slate-900">Financial exposure by region</h2>
    <p className="mb-5 text-xs text-slate-500">Submitted proposal totals or project estimates versus purchase orders (net); not revenue or invoiced totals</p>
    {summary.isPending ? <p role="status" className="py-12 text-sm text-muted-foreground">Loading project values…</p> : summary.error ? <p role="alert" className="py-12 text-sm text-destructive">{summary.error.message}</p> : data.length ? <div className="h-80 min-w-0 w-full"><ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} layout="vertical" margin={{ left: 10, right: 20 }}>
        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
        <XAxis type="number" tickFormatter={(v) => `£${(v / 1e6).toFixed(1)}m`} tick={{ fontSize: 11 }} />
        <YAxis type="category" dataKey="region" width={120} tick={{ fontSize: 10 }} />
        <Tooltip formatter={(v, name) => [formatCurrency(v), name === "value" ? "Project value" : "PO net"]} />
        <Bar dataKey="value" name="Project value" fill="hsl(var(--chart-1))" radius={[0, 4, 4, 0]} />
        <Bar dataKey="poNet" name="PO net" fill="hsl(var(--chart-3))" radius={[0, 4, 4, 0]} />
      </BarChart>
    </ResponsiveContainer></div> : <p className="py-12 text-center text-sm text-slate-500">No active projects to chart.</p>}
  </section>;
}