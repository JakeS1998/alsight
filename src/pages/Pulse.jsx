import React from 'react';
import AccessDenied from '@/pages/AccessDenied';
import {INTERNAL_ROLES} from '@/lib/portal';
import useDashboardData from '@/components/dashboard/useDashboardData';
import AllianceHome from '@/components/alliance/AllianceHome';
import PageContentSkeleton from '@/components/loading/PageContentSkeleton';
import WorkspacePageHeader from '@/components/layout/WorkspacePageHeader';

export default function Pulse() {
  const dashboard=useDashboardData();
  if(dashboard.user && !INTERNAL_ROLES.includes(dashboard.user.role)) return <AccessDenied/>;
  if(dashboard.error) return <div role="alert" className="rounded-panel border border-border bg-card p-6"><p className="text-sm text-destructive">{dashboard.error}</p><button className="mt-3 text-sm underline" onClick={dashboard.refresh}>Try again</button></div>;
  if(dashboard.loading || !dashboard.user) return <PageContentSkeleton label="Loading Alliance Insider"/>;
  return <div className="w-full min-w-0 space-y-5"><WorkspacePageHeader title="Alliance Insider" eyebrow="Projects + People + Purpose" description="The people making it happen. The difference we’re working towards. The knowledge we build along the way." image="https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1800&q=85" imageAlt="Colleagues sharing ideas around a table"/><AllianceHome user={dashboard.user} projectIds={dashboard.projects.map(project=>project.id)}/></div>;
}