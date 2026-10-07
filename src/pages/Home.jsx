import React from 'react';
import { Navigate } from 'react-router-dom';
import useDashboardData from '@/components/dashboard/useDashboardData';
import useOverviewAnalytics from '@/components/dashboard/useOverviewAnalytics';
import useAssignedTasks from '@/components/tasks/useAssignedTasks';
import HomeJourneyHero from '@/components/dashboard/HomeJourneyHero';
import HomeWelcome from '@/components/dashboard/HomeWelcome';
import HomeJourney from '@/components/dashboard/HomeJourney';
import HomeQuickActions from '@/components/dashboard/HomeQuickActions';
import DashboardAliceCard from '@/components/dashboard/DashboardAliceCard';
import HomeToday from '@/components/dashboard/TodayPlanner.jsx';
import HomeProjectsPanel from '@/components/dashboard/HomeProjectsPanel';
import HomeMilestones from '@/components/dashboard/HomeMilestones';
import DashboardSkeleton from '@/components/dashboard/DashboardSkeleton';
import '@/components/dashboard/dashboard-reference.css';
export default function Home() {
  const dashboard = useDashboardData();
  const analytics = useOverviewAnalytics(dashboard);
  const tasks = useAssignedTasks(dashboard.internal ? dashboard.user : null, 'today');
  if (dashboard.role === 'project_manager') return <Navigate to="/projects" replace />;
  if (dashboard.error) return <div role="alert" className="dashboard-panel"><p>{dashboard.error}</p><button onClick={dashboard.refresh} className="mt-3 underline">Try again</button></div>;
  if (dashboard.loading || !dashboard.user) return <DashboardSkeleton internal={dashboard.internal} />;
  const recentIds = JSON.parse(localStorage.getItem(`als-recent-projects:${dashboard.user.id}`) || '[]');
  const opportunityCount = analytics.data?.opportunities.reduce((n,r) => n+r.count,0);
  return <div className="home-reference space-y-4">
    <HomeJourneyHero />
    <HomeWelcome user={dashboard.user} metrics={dashboard.portfolio.metrics} opportunities={opportunityCount} tasks={tasks} internal={dashboard.internal} />
    {dashboard.internal && <HomeToday user={dashboard.user} tasks={tasks} />}
    <HomeJourney internal={dashboard.internal} />
    <div className="home-actions-row"><HomeQuickActions project={dashboard.portfolio.pipeline[0]} role={dashboard.role} /><DashboardAliceCard /></div>
    <div className="grid gap-4 lg:grid-cols-2"><HomeProjectsPanel projects={dashboard.projects} recentIds={recentIds} atRisk={dashboard.portfolio.atRisk} /><HomeMilestones rows={analytics.data?.milestones} loading={dashboard.internal && analytics.isPending} error={analytics.error} /></div>
  </div>;
}