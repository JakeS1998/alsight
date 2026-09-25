import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/lib/AuthContext";
import { base44 } from "@/api/base44Client";
import { PROJECT_STATUS, CONTRACT_STATUS, INVOICE_STATUS, formatCurrency, formatDate } from "@/lib/portal";
import { StatusBadge } from "@/components/StatusBadge";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area, CartesianGrid, Legend } from "recharts";
import { FolderKanban, FileText, Receipt, PoundSterling, TrendingUp, Clock, Loader2 } from "lucide-react";

const PALETTE = ["#FCA311", "#1D1D35", "#2BB673", "#3B82F6", "#A855F7", "#F43F5E"];
const STATUS_COLOR = {
  requested: "#94a3b8", in_review: "#F59E0B", approved: "#3B82F6", active: "#10B981", completed: "#8B5CF6", rejected: "#F43F5E",
  draft: "#94a3b8", sent: "#F59E0B", signed: "#10B981", expired: "#F43F5E",
  paid: "#10B981", overdue: "#F43F5E",
};

export default function Analytics() {
  const { user } = useAuth();
  const role = user?.role || "client";
  const [data, setData] = useState({ projects: [], contracts: [], invoices: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [projects, contracts, invoices] = await Promise.all([
          base44.entities.Project.list("-created_date", 500).catch(() => []),
          base44.entities.Contract.list("-created_date", 500).catch(() => []),
          base44.entities.Invoice.list("-created_date", 500).catch(() => []),
        ]);
        setData({ projects, contracts, invoices });
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const metrics = useMemo(() => {
    const projects = data.projects;
    const contracts = data.contracts;
    const invoices = data.invoices;
    const activeProjects = projects.filter((p) => p.status === "active").length;
    const signedValue = contracts.filter((c) => c.status === "signed").reduce((s, c) => s + (c.value || 0), 0);
    const outstanding = invoices.filter((i) => i.status === "sent" || i.status === "overdue").reduce((s, i) => s + (i.amount || 0), 0);
    const paid = invoices.filter((i) => i.status === "paid").reduce((s, i) => s + (i.amount || 0), 0);
    return { totalProjects: projects.length, activeProjects, signedValue, outstanding, paid, totalContracts: contracts.length };
  }, [data]);

  const projectStatusData = useMemo(() => {
    return Object.keys(PROJECT_STATUS).map((k) => ({
      name: PROJECT_STATUS[k].label, key: k, value: data.projects.filter((p) => p.status === k).length,
    })).filter((d) => d.value > 0);
  }, [data]);

  const contractStatusData = useMemo(() => {
    return Object.keys(CONTRACT_STATUS).map((k) => ({
      name: CONTRACT_STATUS[k].label, value: data.contracts.filter((c) => c.status === k).length,
    }));
  }, [data]);

  const invoiceAmountData = useMemo(() => {
    return Object.keys(INVOICE_STATUS).map((k) => ({
      name: INVOICE_STATUS[k].label, value: data.invoices.filter((i) => i.status === k).reduce((s, i) => s + (i.amount || 0), 0),
    }));
  }, [data]);

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

  const topClientsData = useMemo(() => {
    const map = {};
    data.projects.forEach((p) => {
      const name = p.client_name || "Unassigned";
      map[name] = (map[name] || 0) + (p.budget || 0);
    });
    return Object.entries(map).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 6);
  }, [data]);

  if (loading) {
    return (
      <div className="flex justify-center py-20"><div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-primary" /></div>
    );
  }

  const kpis = [
    { label: "Total Projects", value: metrics.totalProjects, sub: `${metrics.activeProjects} active`, icon: FolderKanban, tone: "text-sky-600 bg-sky-50" },
    { label: "Contracts", value: metrics.totalContracts, sub: formatCurrency(metrics.signedValue) + " signed", icon: FileText, tone: "text-violet-600 bg-violet-50" },
    { label: "Outstanding", value: formatCurrency(metrics.outstanding), sub: "awaiting payment", icon: Clock, tone: "text-amber-600 bg-amber-50" },
    { label: "Paid Invoices", value: formatCurrency(metrics.paid), sub: "collected", icon: PoundSterling, tone: "text-emerald-600 bg-emerald-50" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight text-slate-900">Analytics</h1>
          <p className="mt-1 text-sm text-slate-500">Portfolio intelligence across projects, contracts and invoicing.</p>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
          <TrendingUp className="h-3.5 w-3.5" /> Live data
        </span>
      </div>

      {/* KPI row */}
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
        {/* Project status donut */}
        <ChartCard title="Projects by Status" subtitle="Distribution across the portfolio">
          {projectStatusData.length === 0 ? <Empty /> : (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={projectStatusData} dataKey="value" nameKey="name" innerRadius={60} outerRadius={95} paddingAngle={2}>
                  {projectStatusData.map((d) => <Cell key={d.key} fill={STATUS_COLOR[d.key] || PALETTE[0]} />)}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        {/* Contract status bar */}
        <ChartCard title="Contracts by Status" subtitle="Count per contract stage">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={contractStatusData} margin={{ left: -10, right: 10, top: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#64748b" }} axisLine={false} tickLine={false} />
              <YAxis allowDecimals tick={{ fontSize: 12, fill: "#64748b" }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "#f1f5f9" }} />
              <Bar dataKey="value" fill="#FCA311" radius={[6, 6, 0, 0]} barSize={36} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Invoice amounts bar */}
        <ChartCard title="Invoice Value by Status" subtitle="Outstanding vs collected (£)">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={invoiceAmountData} margin={{ left: 10, right: 10, top: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#64748b" }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={(v) => `£${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`} tick={{ fontSize: 12, fill: "#64748b" }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v) => formatCurrency(v)} cursor={{ fill: "#f1f5f9" }} />
              <Bar dataKey="value" radius={[6, 6, 0, 0]} barSize={36}>
                {invoiceAmountData.map((d, i) => <Cell key={i} fill={STATUS_COLOR[Object.keys(INVOICE_STATUS)[i]] || PALETTE[0]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Pipeline area */}
        <ChartCard title="Project Pipeline" subtitle="Requests created over time">
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

      {/* Top clients by budget */}
      <ChartCard title="Top Clients by Project Budget" subtitle="Where portfolio value is concentrated">
        {topClientsData.length === 0 ? <Empty /> : (
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={topClientsData} layout="vertical" margin={{ left: 20, right: 20, top: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
              <XAxis type="number" tickFormatter={(v) => `£${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`} tick={{ fontSize: 12, fill: "#64748b" }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 12, fill: "#64748b" }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v) => formatCurrency(v)} cursor={{ fill: "#f1f5f9" }} />
              <Bar dataKey="value" fill="#1D1D35" radius={[0, 6, 6, 0]} barSize={22} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </ChartCard>
    </div>
  );
}

const tooltipStyle = {
  borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 12, boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
};

function ChartCard({ title, subtitle, children }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
        <p className="text-xs text-slate-500">{subtitle}</p>
      </div>
      {children}
    </div>
  );
}

function Empty() {
  return <div className="flex h-[260px] items-center justify-center text-sm text-slate-400">No data available</div>;
}