import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { base44 } from "@/api/base44Client";
import { ROLE_LABELS, PROJECT_STATUS, CONTRACT_STATUS, formatCurrency, formatDate } from "@/lib/portal";
import { StatusBadge } from "@/components/StatusBadge";
import { FolderKanban, FileText, Receipt, Building2, Plus, ArrowRight } from "lucide-react";

export default function Home() {
  const { user } = useAuth();
  const role = user?.role || "client";
  const [data, setData] = useState({ projects: [], contracts: [], invoices: [], accounts: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [projects, contracts, invoices, accounts] = await Promise.all([
          base44.entities.Project.list("-updated_date", 50).catch(() => []),
          base44.entities.Contract.list("-updated_date", 50).catch(() => []),
          base44.entities.Invoice.list("-updated_date", 50).catch(() => []),
          base44.entities.Account.list("-updated_date", 50).catch(() => []),
        ]);
        setData({ projects, contracts, invoices, accounts });
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const isStaff = role === "admin" || role === "company_director";
  const isDevManager = role === "development_manager";
  const isPartner = role === "client" || role === "supplier";

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 18) return "Good afternoon";
    return "Good evening";
  };

  const stats = [
    { label: "Projects", value: data.projects.length, icon: FolderKanban, to: "/projects", accent: "bg-sky-50 text-sky-600" },
    { label: "Contracts", value: data.contracts.length, icon: FileText, to: "/contracts", accent: "bg-violet-50 text-violet-600" },
    { label: "Invoices", value: data.invoices.length, icon: Receipt, to: "/invoices", accent: "bg-emerald-50 text-emerald-600" },
  ];
  if (isStaff) {
    stats.push({ label: "Accounts", value: data.accounts.length, icon: Building2, to: "/accounts", accent: "bg-amber-50 text-amber-600" });
  }

  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm text-slate-500">{greeting()},</p>
        <h1 className="font-heading text-2xl font-semibold tracking-tight text-slate-900">
          {user?.full_name || user?.email}
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          You're signed in as <span className="font-medium text-slate-700">{ROLE_LABELS[role]}</span>.
          {isPartner && " Only information relevant to your account is shown below."}
          {isDevManager && " Submit and track your project requests."}
          {isStaff && " You have oversight across all accounts and projects."}
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-slate-800" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {stats.map((s) => {
              const Icon = s.icon;
              return (
                <Link
                  key={s.label}
                  to={s.to}
                  className="group rounded-2xl border border-slate-200 bg-white p-5 transition-shadow hover:shadow-md"
                >
                  <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-lg ${s.accent}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <p className="text-3xl font-semibold tracking-tight text-slate-900">{s.value}</p>
                  <p className="mt-0.5 text-sm text-slate-500">{s.label}</p>
                </Link>
              );
            })}
          </div>

          {isDevManager && (
            <Link
              to="/projects"
              className="flex items-center justify-between rounded-2xl border border-slate-900 bg-slate-900 p-5 text-white transition-transform hover:scale-[1.01]"
            >
              <div className="flex items-center gap-3">
                <Plus className="h-5 w-5" />
                <div>
                  <p className="font-medium">Request a new project</p>
                  <p className="text-sm text-slate-300">Submit a project request for director review</p>
                </div>
              </div>
              <ArrowRight className="h-5 w-5" />
            </Link>
          )}

          <div className="grid gap-6 lg:grid-cols-2">
            <Section title="Recent Projects" to="/projects" items={data.projects.slice(0, 5).map((p) => ({
              id: p.id,
              title: p.name,
              sub: p.client_name || p.supplier_name || "—",
              right: <StatusBadge status={p.status} map={PROJECT_STATUS} />,
            }))} empty="No projects yet" />

            <Section title="Recent Contracts" to="/contracts" items={data.contracts.slice(0, 5).map((c) => ({
              id: c.id,
              title: c.title,
              sub: c.project_name || "—",
              right: <StatusBadge status={c.status} map={CONTRACT_STATUS} />,
            }))} empty="No contracts yet" />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Section title="Recent Invoices" to="/invoices" items={data.invoices.slice(0, 5).map((i) => ({
              id: i.id,
              title: i.invoice_number,
              sub: i.project_name || "—",
              right: <span className="text-sm font-medium text-slate-700">{formatCurrency(i.amount)}</span>,
            }))} empty="No invoices yet" />

            {isStaff && (
              <Section title="Recent Accounts" to="/accounts" items={data.accounts.slice(0, 5).map((a) => ({
                id: a.id,
                title: a.name,
                sub: a.contact_person || a.contact_email || "—",
                right: <span className="text-xs font-medium uppercase text-slate-400">{a.type}</span>,
              }))} empty="No accounts yet" />
            )}
          </div>
        </>
      )}
    </div>
  );
}

function Section({ title, to, items, empty }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white">
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
        <h2 className="font-heading text-base font-semibold text-slate-900">{title}</h2>
        <Link to={to} className="text-xs font-medium text-slate-500 hover:text-slate-900">View all</Link>
      </div>
      <div className="divide-y divide-slate-100">
        {items.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-slate-400">{empty}</p>
        ) : (
          items.map((it) => (
            <Link key={it.id} to={to} className="flex items-center justify-between px-5 py-3.5 hover:bg-slate-50">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-slate-900">{it.title}</p>
                <p className="truncate text-xs text-slate-500">{it.sub}</p>
              </div>
              {it.right}
            </Link>
          ))
        )}
      </div>
    </div>
  );
}