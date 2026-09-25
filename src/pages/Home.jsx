import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { base44 } from "@/api/base44Client";
import { ROLE_LABELS } from "@/lib/portal";
import { FolderKanban, FileText, ShieldCheck, Building2 } from "lucide-react";

export default function Home() {
  const { user } = useAuth();
  const role = user?.role || "client";
  const [data, setData] = useState({ projects: [], docs: [], warranties: [], accounts: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [projects, docs, warranties, accounts] = await Promise.all([
          base44.entities.Project.list("-created_date", 50).catch(() => []),
          base44.entities.LegalDocument.list("-created_date", 50).catch(() => []),
          base44.entities.Warranty.list("-created_date", 50).catch(() => []),
          base44.entities.Account.list("-name", 50).catch(() => []),
        ]);
        setData({ projects, docs, warranties, accounts });
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const isStaff = role === "admin" || role === "company_director";
  const isPartner = role === "client" || role === "supplier";

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 18) return "Good afternoon";
    return "Good evening";
  };

  const stats = [
    { label: "Projects", value: data.projects.length, icon: FolderKanban, to: "/projects", accent: "bg-sky-50 text-sky-600" },
    { label: "Legal Documents", value: data.docs.length, icon: FileText, to: "/projects", accent: "bg-violet-50 text-violet-600" },
    { label: "Warranties", value: data.warranties.length, icon: ShieldCheck, to: "/projects", accent: "bg-amber-50 text-amber-600" },
  ];
  if (isStaff) {
    stats.push({ label: "Accounts", value: data.accounts.length, icon: Building2, to: "/accounts", accent: "bg-emerald-50 text-emerald-600" });
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
                <Link key={s.label} to={s.to} className="group rounded-2xl border border-slate-200 bg-white p-5 transition-shadow hover:shadow-md">
                  <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-lg ${s.accent}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <p className="text-3xl font-semibold tracking-tight text-slate-900">{s.value}</p>
                  <p className="mt-0.5 text-sm text-slate-500">{s.label}</p>
                </Link>
              );
            })}
          </div>

          <Section title="Recent Projects" to="/projects" items={data.projects.slice(0, 8).map((p) => ({
            id: p.id,
            link: `/projects/${p.id}`,
            title: p.name,
            sub: p.project_number || "—",
          }))} empty="No projects yet" />
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
            <Link key={it.id} to={it.link || to} className="flex items-center justify-between px-5 py-3.5 hover:bg-slate-50">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-slate-900">{it.title}</p>
                <div className="mt-0.5 truncate text-xs text-slate-500">{it.sub}</div>
              </div>
              {it.right}
            </Link>
          ))
        )}
      </div>
    </div>
  );
}