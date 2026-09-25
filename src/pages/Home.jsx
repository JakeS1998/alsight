import React, { useEffect, useState, useMemo } from "react";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { base44 } from "@/api/base44Client";
import { listAll } from "@/components/data/loadAll";
import { ROLE_LABELS, formatCurrency, regionName } from "@/lib/portal";
import { DashboardKPIs } from "@/components/dashboard/DashboardKPIs";
import { PipelineChart } from "@/components/dashboard/PipelineChart";
import { RegionBreakdown } from "@/components/dashboard/RegionBreakdown";
import { ProjectMap } from "@/components/dashboard/ProjectMap";
import { MapPin, Filter } from "lucide-react";
import { INTERNAL_ROLES } from "@/lib/portal";
import usePortfolioExtras from "@/components/dashboard/usePortfolioExtras";
import { buildPortfolio } from "@/components/dashboard/portfolioMetrics";
import PortfolioSummary from "@/components/dashboard/PortfolioSummary";
import ProjectRiskTracker from "@/components/dashboard/ProjectRiskTracker";

export default function Home() {
  const { user } = useAuth();
  const role = user?.role || "client";
  const internal = INTERNAL_ROLES.includes(role);
  const { data: extras, loading: extrasLoading, error: extrasError } = usePortfolioExtras(internal);
  const [projects, setProjects] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [p, a] = await Promise.all([
          listAll(base44.entities.Project, "-created_date"),
          listAll(base44.entities.Account, "-name").catch(() => []),
        ]);
        setProjects(p);
        setAccounts(a);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const accountMap = useMemo(() => {
    const map = {};
    accounts.forEach((a) => { if (a.dataverse_id) map[a.dataverse_id] = a; });
    return map;
  }, [accounts]);

  const { filteredProjects, filterLabel } = useMemo(() => {
    if (role === "bdm") {
      return {
        filteredProjects: projects.filter((p) => p.bdm_aad_id === user.id || p.bsm_aad_id === user.id),
        filterLabel: "Showing projects where you are the assigned BDM or BSM",
      };
    }
    if (role === "regional_director") {
      const userRegion = regionName(user?.data?.region);
      if (userRegion) {
        return {
          filteredProjects: projects.filter((p) => regionName(p.department_id) === userRegion),
          filterLabel: `Showing projects in your region: ${userRegion}`,
        };
      }
      return { filteredProjects: projects, filterLabel: null };
    }
    return { filteredProjects: projects, filterLabel: null };
  }, [projects, accountMap, role, user]);

  const portfolio = useMemo(() => buildPortfolio(filteredProjects, extras), [filteredProjects, extras]);

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 18) return "Good afternoon";
    return "Good evening";
  };

  if (role === 'project_manager') return <Navigate to="/projects" replace />;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-slate-800" />
      </div>
    );
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
        </p>
        {filterLabel && (
          <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            <Filter className="h-3 w-3" /> {filterLabel}
          </div>
        )}
      </div>

      {extrasError && internal && <p className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{extrasError}</p>}
      {internal && extrasLoading && <p className="text-sm text-slate-500">Loading portfolio data…</p>}
      {internal && !extrasError && !extrasLoading ? <PortfolioSummary metrics={portfolio.metrics} /> : <DashboardKPIs projects={filteredProjects} hideValues={role === 'supplier'} />}

      {internal && !extrasError && !extrasLoading && <ProjectRiskTracker atRisk={portfolio.atRisk} compact />}

      {role !== 'supplier' && <div className="grid gap-6 lg:grid-cols-2">
        <PipelineChart projects={filteredProjects} />
        <RegionBreakdown projects={filteredProjects} accountMap={accountMap} />
      </div>}

      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <div className="mb-4 flex items-center gap-2">
          <MapPin className="h-4 w-4 text-primary" />
          <h2 className="font-heading text-base font-semibold text-slate-900">Project Map</h2>
          <span className="text-xs text-slate-400">Click a marker for details</span>
        </div>
        <ProjectMap projects={filteredProjects} showValues={role !== 'supplier'} />
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <h2 className="font-heading text-base font-semibold text-slate-900">Recent Projects</h2>
          <Link to="/projects" className="text-xs font-medium text-slate-500 hover:text-slate-900">View all</Link>
        </div>
        <div className="divide-y divide-slate-100">
          {filteredProjects.length === 0 ? (
            <p className="px-5 py-8 text-center text-sm text-slate-400">No projects to show.</p>
          ) : (
            filteredProjects.slice(0, 8).map((p) => (
              <Link key={p.id} to={`/projects/${p.id}`} className="flex items-center justify-between px-5 py-3.5 hover:bg-slate-50">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-slate-900">{p.name}</p>
                  <p className="truncate text-xs text-slate-500">{p.project_number || "—"}</p>
                </div>
                {role !== 'supplier' && <span className="text-sm text-slate-600">{formatCurrency(p.estimated_value)}</span>}
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
}