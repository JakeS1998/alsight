import React, { useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { regionName } from "@/lib/portal";
import IncomeProjectionKey, { IncomeProjectionTooltip } from "@/components/dashboard/IncomeProjectionKey";
import useProjectValueSummary from '@/components/projects/useProjectValueSummary';

export function RegionBreakdown({ projects, confirmedAmounts = {}, invoicesLoading = false, invoicesError = '' }) {
  const summary=useProjectValueSummary(projects);
  const failure=invoicesError || summary.error?.message;
  const data = useMemo(() => {
    const paid={};for(const project of projects){const region=regionName(project.department_id);paid[region]=(paid[region] || 0)+(Number(confirmedAmounts[project.id]) || 0);}
    const map={};
    for(const row of summary.data?.regions || []){const region=regionName(row.department_id);if(!region || region===row.department_id || region==='Business Support Services')continue;
      const group=map[region] || {region,count:0,value:0,confirmed:paid[region] || 0,remaining:0};group.count+=row.count;group.value+=row.value;group.remaining=Math.max(0,group.value-group.confirmed);map[region]=group;
    }
    return Object.values(map).sort((a,b)=>b.value-a.value);
  }, [projects, confirmedAmounts,summary.data]);

  return (
    <div className="min-w-0 rounded-xl border border-border bg-card p-4">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-slate-900">Project Value by Region</h3>
        <p className="text-xs text-slate-500">Paid invoices versus total project value by operating region</p>
        <IncomeProjectionKey />
      </div>
      {invoicesLoading || summary.isPending ? <div className="flex h-[260px] items-center justify-center text-sm text-slate-500">Loading project and invoice totals…</div> : failure ? <p role="alert" className="py-10 text-sm text-destructive">{failure}</p> : data.length === 0 ? (
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