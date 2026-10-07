import React from 'react';
import {Navigate} from 'react-router-dom';
import {INTERNAL_ROLES} from '@/lib/portal';
import useDashboardData from '@/components/dashboard/useDashboardData';
import AllianceHome from '@/components/alliance/AllianceHome';
import WorkspacePageHeader from '@/components/layout/WorkspacePageHeader';

export default function Pulse() {
  const dashboard=useDashboardData();
  if(dashboard.user && !INTERNAL_ROLES.includes(dashboard.user.role)) return <Navigate to={dashboard.user.role==='framework_stakeholder' ? '/framework-reports' : '/'} replace/>;
  if(dashboard.error) return <div role="alert" className="rounded-panel border border-border bg-card p-6"><p className="text-sm text-destructive">{dashboard.error}</p><button className="mt-3 text-sm underline" onClick={dashboard.refresh}>Try again</button></div>;
  if(dashboard.loading || !dashboard.user) return <div role="status" className="rounded-panel border border-border bg-card p-6 text-sm text-muted-foreground">Loading Alliance Insider…</div>;
  return <div className="w-full min-w-0 space-y-5"><WorkspacePageHeader title="Alliance Insider" eyebrow="Projects + People + Purpose" description="The people making it happen. The difference we’re working towards. The knowledge we build along the way." image="https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1800&q=85" imageAlt="Colleagues sharing ideas around a table"/><AllianceHome user={dashboard.user} projectIds={dashboard.projects.map(project=>project.id)}/></div>;
}