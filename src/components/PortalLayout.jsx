import React, { Suspense, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import PortalHeader from '@/components/PortalHeader';
import PortalFooter from '@/components/PortalFooter';
import PageLoadingSkeleton from '@/components/loading/PageLoadingSkeleton';
import KpiIllustrationProvider from '@/components/metrics/KpiIllustrationProvider';
import PageFeedbackWidget from '@/components/feedback/PageFeedbackWidget';
import DirectMessagesWidget from '@/components/messaging/DirectMessagesWidget';
import { internalMessagingRoles } from '@/components/messaging/messageClient';
import { useAuth } from '@/lib/AuthContext';
import AliceWidget from '@/components/alice/AliceWidget';
import aliceAccessKey from '@/components/alice/aliceAccessKey';
import usePortalDataRefresh from '@/components/data/usePortalDataRefresh';
import WellbeingProvider from '@/components/wellbeing/WellbeingProvider';
import GlobalWellbeingNotifications from '@/components/wellbeing/GlobalWellbeingNotifications';
import '@/components/layout/portal-responsive.css';
import '@/components/layout/portal-design.css';
import '@/components/layout/portal-header.css';

export default function PortalLayout() {
  const { user } = useAuth();
  const { pathname } = useLocation();
  usePortalDataRefresh(user?.id, pathname);
  useEffect(() => {
    const match = pathname.match(/^\/projects\/([^/]+)$/);
    if (!match || !user?.id) return;
    const key = `als-recent-projects:${user.id}`;
    const previous = JSON.parse(localStorage.getItem(key) || '[]');
    localStorage.setItem(key, JSON.stringify([match[1], ...previous.filter(id => id !== match[1])].slice(0, 8)));
  }, [pathname, user?.id]);
  return <WellbeingProvider key={user?.id} user={user}><div className="portal-shell flex min-h-screen flex-col bg-secondary">
    <PortalHeader />
    <main className="portal-main w-full flex-1"><KpiIllustrationProvider key={pathname}><Suspense fallback={<PageLoadingSkeleton />}><Outlet /></Suspense></KpiIllustrationProvider></main>
    <PortalFooter />
    {user?.id && <PageFeedbackWidget key={user.id} user={user} route={pathname} />}
    {user?.id && internalMessagingRoles.includes(user.role) && <DirectMessagesWidget key={user.id} user={user} />}
    {user?.id && user.role !== 'framework_stakeholder' && <AliceWidget key={aliceAccessKey(user)} />}
    {user?.id && <GlobalWellbeingNotifications user={user}/>}
  </div></WellbeingProvider>;
}