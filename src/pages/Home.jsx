import React, { useEffect, useState, useMemo } from "react";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { base44 } from "@/api/base44Client";
import { listAll, filterAll } from "@/components/data/loadAll";
import { ROLE_LABELS, formatCurrency, regionName } from "@/lib/portal";
import { DashboardKPIs } from "@/components/dashboard/DashboardKPIs";
import { RegionBreakdown } from "@/components/dashboard/RegionBreakdown";
import { ProjectMap } from "@/components/dashboard/ProjectMap";
import { MapPin, Filter } from "lucide-react";
import { INTERNAL_ROLES } from "@/lib/portal";
import usePortfolioExtras from "@/components/dashboard/usePortfolioExtras";
import { buildPortfolio } from "@/components/dashboard/portfolioMetrics";
import useConfirmedInvoices from "@/components/dashboard/useConfirmedInvoices";
import PortfolioSummary from "@/components/dashboard/PortfolioSummary";
import PipelineTimeline from "@/components/dashboard/PipelineTimeline";
import DashboardAttention from "@/components/dashboard/DashboardAttention";
import { projectStage } from "@/components/dashboard/pipelineStage";
import projectScope from '@/components/projects/projectScope';
import DashboardSkeleton from '@/components/dashboard/DashboardSkeleton';

export default function Home() {
  const { user } = useAuth();
  const role = user?.role || "client";
  const internal = INTERNAL_ROLES.includes(role);
  const scopeKey = JSON.stringify([user?.id, role, user?.staff_aad_id || user?.data?.staff_aad_id, user?.region || user?.data?.region, user?.delegate_of || user?.data?.delegate_of, user?.delegate_region || user?.data?.delegate_region]);
  const [projects, setProjects] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [staffAadId, setStaffAadId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadedFor, setLoadedFor] = useState(null);
  const [loadError, setLoadError] = useState('');
  const [retry, setRetry] = useState(0);
  const [riskExpanded, setRiskExpanded] = useState(false);
  const { data: extras, loading: extrasLoading, error: extrasError } = usePortfolioExtras(!!user && internal, `${scopeKey}:${retry}`);

  useEffect(() => {
    if (!user?.id) return;
    let active = true;
    setLoading(true);
    setLoadError('');
    (async () => {
      try {
        const contact = ['bdm', 'bsm'].includes(role) && user.email ? (await base44.entities.Contact.filter({ email: { $regex: `^${user.email.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, $options: 'i' } }, { limit: 1, fields: ['aad_id'] })).items[0] : null;
        const [p, a] = await Promise.all([
          role === 'supplier' ? base44.functions.invoke('supplierProjectAccess', { action: 'projects' }).then(res => res.data.projects || []) : filterAll(base44.entities.Project, { $and: [{ status: { $ne: 'inactive' } }, projectScope(user, contact?.aad_id)] }, '-created_date'),
          listAll(base44.entities.Account, '-name').catch(() => []),
        ]);
        if (active) { setProjects(p); setAccounts(a); setStaffAadId(contact?.aad_id || null); setLoadedFor(scopeKey); }
      } catch (error) {
        if (active) setLoadError('The dashboard could not load. Please try again.');
      } finally { if (active) setLoading(false); }
    })();
    return () => { active = false; };
  }, [scopeKey, user?.email, retry]);

  const accountMap = useMemo(() => {
    const map = {};
    accounts.forEach((a) => { if (a.dataverse_id) map[a.dataverse_id] = a; });
    return map;
  }, [accounts]);

  const { filteredProjects, filterLabel } = useMemo(() => {
    if (role === "bdm" || role === "bsm") {
      const assignedIds = [user?.id, user?.data?.staff_aad_id || user?.staff_aad_id, staffAadId, user?.data?.delegate_of || user?.delegate_of].filter(Boolean);
      return {
        filteredProjects: projects.filter((p) => role === 'bsm' ? assignedIds.includes(p.bsm_aad_id) : assignedIds.includes(p.bdm_aad_id) || assignedIds.includes(p.bsm_aad_id)),
        filterLabel: "Showing your assigned projects",
      };
    }
    if (role === "regional_director") {
      const region = user?.data?.region || user?.region;
      return {
        filteredProjects: region ? projects.filter((p) => p.department_id === region) : [],
        filterLabel: region ? `Showing projects in your region: ${regionName(region)}` : "No region assigned to your profile",
      };
    }
    return { filteredProjects: projects, filterLabel: null };
  }, [projects, accountMap, role, user, staffAadId]);

  const portfolio = useMemo(() => buildPortfolio(filteredProjects, extras), [filteredProjects, extras]);
  const { amounts: confirmedAmounts, loading: invoicesLoading, error: invoicesError } = useConfirmedInvoices(filteredProjects, role !== 'supplier' && role !== 'project_manager' && loadedFor === scopeKey && !loading, `${scopeKey}:${retry}`);

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 18) return "Good afternoon";
    return "Good evening";
  };

  if (role === 'project_manager') return <Navigate to="/projects" replace />;

  if (loadError) return <div role="alert" className="rounded-xl border border-border bg-card p-6 text-center"><p className="text-sm text-destructive">{loadError}</p><button type="button" onClick={() => setRetry(value => value + 1)} className="mt-3 text-sm text-foreground underline">Try again</button></div>;
  if (!user || loadedFor !== scopeKey || loading || (internal && (extrasLoading || invoicesLoading))) {
    return <DashboardSkeleton internal={internal} />;
  }

  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm text-slate-500">{greeting()},</p>
        <h1 className="font-heading text-2xl font-semibold tracking-tight text-slate-900">
          {user?.full_name?.trim().split(/\s+/)[0] || user?.email}
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
      {internal ? !extrasError && <PortfolioSummary metrics={portfolio.metrics} onRiskClick={() => { setRiskExpanded(true); document.getElementById('dashboard-attention')?.scrollIntoView(); }} /> : <DashboardKPIs projects={filteredProjects} hideValues={role === 'supplier'} />}

      {internal && !extrasError && !extrasLoading && <PipelineTimeline projects={portfolio.pipeline} accountMap={accountMap} />}

      {internal && !extrasError && !extrasLoading ? <div className="grid gap-6 lg:grid-cols-2">
        <DashboardAttention portfolio={portfolio} riskExpanded={riskExpanded} onRiskExpandedChange={setRiskExpanded} />
        <RegionBreakdown projects={filteredProjects} confirmedAmounts={confirmedAmounts} invoicesLoading={invoicesLoading} invoicesError={invoicesError} />
      </div> : role !== 'supplier' && <RegionBreakdown projects={filteredProjects} confirmedAmounts={confirmedAmounts} invoicesLoading={invoicesLoading} invoicesError={invoicesError} />}

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
                  <p className="truncate text-xs text-slate-500">{[p.project_number, projectStage(p), regionName(p.department_id)].filter(Boolean).join(' · ') || '—'}</p>
                  </div>
                  <div className="shrink-0 text-right"><p className="text-xs text-slate-500">{portfolio.atRisk.some(row => row.project.id === p.id) ? 'At risk' : p.live_project ? 'Live' : 'On hold'}</p>{role !== 'supplier' && <p className="text-sm text-slate-600">{formatCurrency(p.estimated_value)}</p>}</div>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
}