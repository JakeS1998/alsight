import React from 'react';
import {Navigate} from 'react-router-dom';
import {INTERNAL_ROLES} from '@/lib/portal';
import useDashboardData from '@/components/dashboard/useDashboardData';
import AllianceHome from '@/components/alliance/AllianceHome';

export default function Pulse() {
  const dashboard=useDashboardData();
  if(dashboard.user && !INTERNAL_ROLES.includes(dashboard.user.role)) return <Navigate to={dashboard.user.role==='framework_stakeholder' ? '/framework-reports' : '/'} replace/>;
  if(dashboard.error) return <div role="alert" className="rounded-panel border border-border bg-card p-6"><p className="text-sm text-destructive">{dashboard.error}</p><button className="mt-3 text-sm underline" onClick={dashboard.refresh}>Try again</button></div>;
  if(dashboard.loading || !dashboard.user) return <div role="status" className="rounded-panel border border-border bg-card p-6 text-sm text-muted-foreground">Loading Alliance Pulse…</div>;
  return <AllianceHome user={dashboard.user} projectIds={dashboard.projects.map(project=>project.id)}/>;
}