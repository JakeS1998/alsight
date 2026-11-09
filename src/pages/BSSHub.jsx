import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/AuthContext';
import { canViewWorkspace } from '@/components/navigation/workspaceAccess';
import WorkspacePageHeader from '@/components/layout/WorkspacePageHeader';
import AccessDenied from '@/pages/AccessDenied';
import BssNavigation from '@/components/bss/BssNavigation';
import BssDashboard from '@/components/bss/BssDashboard';
import BssRegister from '@/components/bss/BssRegister';
import { bssRegisters, powerAppUrl } from '@/components/bss/bssConfig';
export default function BSSHub() {
  const { user } = useAuth();
  const [params, setParams] = useSearchParams();
  const tab = bssRegisters[params.get('view')] ? params.get('view') : 'overview';
  const changeTab = value => setParams(current => { const next = new URLSearchParams(current); next.set('view', value); return next; });
  if (!canViewWorkspace(user, 'bss')) return <AccessDenied />;
  return <section className="flex min-h-[calc(100dvh-10rem)] w-full flex-col gap-5 p-3 sm:p-4">
    <WorkspacePageHeader title="BSS Hub" description="Business support, connected. Manage project drafting, agreements, contracts and warranties in one ALS Hub workspace." image="https://base44.app/api/apps/6ab62433a194f918c54c8249/files/mp/public/6ab62433a194f918c54c8249/bddf53516_bss-team.png" imageAlt="Alliance Leisure team meeting" imageAspectRatio={1024 / 436} imageMaxWidth="clamp(564px, 40vw, 1024px)" imageFocalPointY={0} minimizeOnScroll actions={<Button asChild variant="outline" size="sm"><a href={powerAppUrl} target="_blank" rel="noopener noreferrer">Original PowerApp<ExternalLink /></a></Button>} />
    <BssNavigation tab={tab} onChange={changeTab} />
    {tab === 'overview' ? <BssDashboard onChange={changeTab} /> : <BssRegister key={tab} tab={tab} />}
  </section>;
}