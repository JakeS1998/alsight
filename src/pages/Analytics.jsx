import React, { useEffect, useMemo, useState } from "react";
import { base44 } from "@/api/base44Client";
import { DOCUMENT_TYPE, WARRANTY_STATUS, formatCurrency } from "@/lib/portal";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area, CartesianGrid } from "recharts";
import { FolderKanban, FileText, ShieldCheck, Building2, TrendingUp } from "lucide-react";

const PALETTE = ["#FCA311", "#1D1D35", "#2BB673", "#3B82F6", "#A855F7", "#F43F5E"];

export default function Analytics() {
  const [data, setData] = useState({ projects: [], docs: [], warranties: [], accounts: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [projects, docs, warranties, accounts] = await Promise.all([
          base44.entities.Project.list("-created_date", 500).catch(() => []),
          base44.entities.LegalDocument.list("-created_date", 500).catch(() => []),
          base44.entities.Warranty.list("-created_date", 500).catch(() => []),
          base44.entities.Account.list("-name", 500).catch(() => []),
        ]);
        setData({ projects, docs, warranties, accounts });
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const metrics = useMemo(() => ({
    totalProjects: data.projects.length,
    liveProjects: data.projects.filter((p) => p.live_project).length,
    totalDocs: data.docs.length,
    executedDocs: data.docs.filter((d) => d.executed === "yes").length,
    totalWarranties: data.warranties.length,
    totalAccounts: data.accounts.length,
    suppliers: data.accounts.filter((a) => a.account_type === "supplier").length,
    clients: data.accounts.filter((a) => a.account_type === "client").length,
    totalValue: data.projects.reduce((s, p) => s + (p.estimated_value || 0), 0),
  }), [data]);

  const docTypeData = useMemo(() =>
    Object.entries(DOCUMENT_TYPE)
      .filter(([t]) => t !== "other")
      .map(([key, cfg]) => ({ name: cfg.label, value: data.docs.filter((d) => d.document_type === key).length }))
      .filter((d) => d.value > 0)
  , [data]);

  const warrantyStatusData = useMemo(() =>
    Object.entries(WARRANTY_STATUS)
      .map(([key, cfg]) => ({ name: cfg.label, value: data.warranties.filter((w) => w.warranty_status === key).length }))
      .filter((d) => d.value > 0)
  , [data]);

  const accountTypeData = useMemo(() => [
    { name: "Clients", value: metrics.clients },
    { name: "Suppliers", value: metrics.suppliers },
  ].filter((d) => d.value > 0), [metrics]);

  const pipelineData = useMemo(() => {
    const map = {};
    data.projects.forEach((p) => {
      const d = p.created_date ? new Date(p.created_date) : null;
      if (!d || isNaN(d)) return;
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      map[key] = (map[key] || 0) + 1;
    });
    return Object.entries(map).sort(([a], [b]) => a.localeCompare(b)).map(([month, count]) => {
      const [y, m] = month.split("-");
      const label = new Date(Number(y), Number(m) - 1).toLocaleDateString("en-GB", { month: "short", year: "2-digit" });
      return { month: label, projects: count };
    }).slice(-9);
  }, [data]);

  if (loading) return <div className="flex justify-center py-20"><div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-primary" /></div>;

  const kpis = [
    { label: "Total Projects", value: metrics.totalProjects, sub: `${metrics.liveProjects} live`, icon: FolderKanban, tone: "text-sky-600 bg-sky-50" },
    { label: "Legal Documents", value: metrics.totalDocs, sub: `${metrics.executedDocs} executed`, icon: FileText, tone: "text-violet-600 bg-violet-50" },
    { label: "Warranties", value: metrics.totalWarranties, sub: "tracked", icon: ShieldCheck, tone: "text-amber-600 bg-amber-50" },
    { label: "Portfolio Value", value: formatCurrency(metrics.totalValue), sub: `${metrics.totalAccounts} accounts`, icon: Building2, tone: "text-emerald-600 bg-emerald-50" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight text-slate-900">Analytics</h1>
          <p className="mt-1 text-sm text-slate-500">Portfolio intelligence across projects, documents and warranties.</p>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
          <TrendingUp className="h-3.5 w-3.5" /> Live data
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {kpis.map((k) => {
          const Icon = k.icon;
          return (
            <div key={k.label} className="rounded-2xl border border-slate-200 bg-white p-5">
              <div className={`mb-3 inline-flex h-9 w-9 items-center justify-center rounded-lg ${k.tone}`}><Icon className="h-4 w-4" /></div>
              <p className="text-2xl font-semibold tracking-tight text-slate-900">{k.value}</p>
              <p className="mt-0.5 text-sm font-medium text-slate-600">{k.label}</p>
              <p className="text-xs text-slate-400">{k.sub}</p>
            </div>
          );
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <ChartCard title="Legal Documents by Type" subtitle="Distribution across document categories">
          {docTypeData.length === 0 ? <Empty /> : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={docTypeData} layout="vertical" margin={{ left: 20, right: 20, top: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                <XAxis type="number" allowDecimals tick={{ fontSize: 12, fill: "#64748b" }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "#f1f5f9" }} />
                <Bar dataKey="value" fill="#FCA311" radius={[0, 6, 6, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard title="Warranties by Status" subtitle="Current warranty pipeline">
          {warrantyStatusData.length === 0 ? <Empty /> : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={warrantyStatusData} margin={{ left: -10, right: 10, top: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} />
                <YAxis allowDecimals tick={{ fontSize: 12, fill: "#64748b" }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "#f1f5f9" }} />
                <Bar dataKey="value" radius={[6, 6, 0, 0]} barSize={36}>
                  {warrantyStatusData.map((_, i) => <Cell key={i} fill={PALETTE[i % PALETTE.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard title="Accounts by Type" subtitle="Clients vs suppliers">
          {accountTypeData.length === 0 ? <Empty /> : (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={accountTypeData} dataKey="value" nameKey="name" innerRadius={60} outerRadius={95} paddingAngle={2}>
                  {accountTypeData.map((_, i) => <Cell key={i} fill={PALETTE[i % PALETTE.length]} />)}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard title="Project Pipeline" subtitle="Projects created over time">
          {pipelineData.length === 0 ? <Empty /> : (
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={pipelineData} margin={{ left: -10, right: 10, top: 10, bottom: 0 }}>
                <defs>
                  <linearGradient id="pipeFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#FCA311" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#FCA311" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#64748b" }} axisLine={false} tickLine={false} />
                <YAxis allowDecimals tick={{ fontSize: 12, fill: "#64748b" }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Area type="monotone" dataKey="projects" stroke="#FCA311" strokeWidth={2} fill="url(#pipeFill)" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>
    </div>
  );
}

const tooltipStyle = { borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 12, boxShadow: "0 4px 12px rgba(0,0,0,0.06)" };
function ChartCard({ title, subtitle, children }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <div className="mb-4"><h3 className="text-sm font-semibold text-slate-900">{title}</h3><p className="text-xs text-slate-500">{subtitle}</p></div>
      {children}
    </div>
  );
}
function Empty() { return <div className="flex h-[260px] items-center justify-center text-sm text-slate-400">No data available</div>; }