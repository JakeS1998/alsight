import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import useDashboardData from '@/components/dashboard/useDashboardData';
import useOverviewAnalytics from '@/components/dashboard/useOverviewAnalytics';
import DashboardSkeleton from '@/components/dashboard/DashboardSkeleton';
import OverviewFilters from '@/components/dashboard/OverviewFilters';
import OverviewKpis from '@/components/dashboard/OverviewKpis';
import PipelineTimeline from '@/components/dashboard/PipelineTimeline';
import OverviewHealth from '@/components/dashboard/OverviewHealth';
import OverviewAttention from '@/components/dashboard/OverviewAttention';
import OverviewCommercial from '@/components/dashboard/OverviewCommercial';
import OverviewReadiness from '@/components/dashboard/OverviewReadiness';
import OverviewRegions from '@/components/dashboard/OverviewRegions';
import OverviewUpdates from '@/components/dashboard/OverviewUpdates';
import DashboardAliceCard from '@/components/dashboard/DashboardAliceCard';
import DashboardPanel from '@/components/dashboard/DashboardPanel';
import { ProjectMap } from '@/components/dashboard/ProjectMap';
import '@/components/dashboard/dashboard-reference.css';
export default function PortfolioOverview() {
  const [filters, setFilters] = useState({});
  const dashboard = useDashboardData(filters);
  const [since, setSince] = useState(() => null);
  useEffect(() => { if (!dashboard.user?.id) return; const key = `als-portfolio-last-checked:${dashboard.user.id}`; setSince(localStorage.getItem(key)); return () => localStorage.setItem(key,new Date().toISOString()); }, [dashboard.user?.id]);
  const analytics = useOverviewAnalytics(dashboard,since);
  if (dashboard.user && !dashboard.internal) return <Navigate to="/" replace />;
  const data = analytics.data;
  const error = dashboard.error || analytics.error?.message;
  const opportunities = data ? {count:data.opportunities.reduce((n,r)=>n+r.count,0),value:data.opportunities.reduce((n,r)=>n+(r.sum_budget || 0),0)} : null;
  const serverCount = data?.projects.reduce((n,r)=>n+r.count,0);
  const metrics = data ? {...dashboard.portfolio.metrics,projects:serverCount,live:data.projects.filter(r=>r.live_project === true).reduce((n,r)=>n+r.count,0),value:data.projects.reduce((n,r)=>n+(r.sum_estimated_value || 0),0)} : dashboard.portfolio.metrics;
  return <div className="portfolio-reference space-y-4"><header className="flex flex-wrap items-start justify-between gap-4"><div><h1 className="font-heading text-3xl font-extrabold tracking-tight">Portfolio Overview</h1><p className="mt-1 text-sm text-muted-foreground">Live commercial and delivery position across Alliance Leisure.</p></div><OverviewFilters user={dashboard.user} filters={filters} onChange={setFilters} onRefresh={dashboard.refresh} loading={dashboard.loading || analytics.isFetching} refreshedAt={data?.refreshedAt} /></header>
    {error ? <div role="alert" className="dashboard-panel text-sm text-destructive">{error}<button onClick={dashboard.refresh} className="ml-3 underline">Try again</button></div> : dashboard.loading || !data ? <DashboardSkeleton internal /> : <>
      <OverviewKpis metrics={metrics} onRisk={() => document.getElementById('overview-attention')?.scrollIntoView({behavior:'smooth',block:'center'})} />
      <div className="overview-journey-row"><PipelineTimeline projects={dashboard.portfolio.pipeline} accountMap={dashboard.accountMap} stageSummary={data.stages} opportunitySummary={opportunities} /><OverviewHealth metrics={metrics} /></div>
      <div className="overview-middle"><OverviewAttention portfolio={dashboard.portfolio} user={dashboard.user} /><OverviewCommercial rows={data.opportunities} poNet={metrics.poNet} /><OverviewReadiness data={data} metrics={metrics} fees={dashboard.portfolio.fees} /></div>
      <div className="overview-bottom"><OverviewRegions rows={data.regions} /><DashboardPanel title="Project locations" link="/projects" linkLabel="View projects" className="overview-map"><ProjectMap projects={dashboard.portfolio.pipeline} /></DashboardPanel><OverviewUpdates rows={data.recent} since={since} /><DashboardAliceCard portfolio /></div>
    </>}
  </div>;
}