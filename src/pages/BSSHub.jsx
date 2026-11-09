import React from 'react';
import {ExternalLink} from 'lucide-react';
import {Button} from '@/components/ui/button';
import WorkspacePageHeader from '@/components/layout/WorkspacePageHeader';
const powerAppUrl='https://alslive.crm11.dynamics.com/main.aspx?appid=e986c390-c4b0-f011-bbd3-6045bd0e7eeb';
export default function BSSHub(){
 return <section className="flex min-h-[calc(100dvh-10rem)] w-full flex-col gap-3 p-3 sm:p-4">
  <WorkspacePageHeader title="BSS Hub" minimizeOnScroll description="Uses your own Microsoft work account and Power Apps permissions. If embedded sign-in is blocked, open in a new tab to sign in and use the app." image="https://base44.app/api/apps/6ab62433a194f918c54c8249/files/mp/public/6ab62433a194f918c54c8249/bddf53516_bss-team.png" imageAlt="Alliance Leisure team meeting" imageAspectRatio={1024 / 436} imageMaxWidth="clamp(564px, 40vw, 1024px)" imageFocalPointY={0} actions={<Button asChild variant="outline" size="sm"><a href={powerAppUrl} target="_blank" rel="noopener noreferrer">Open in new tab<ExternalLink/></a></Button>}/>
  <iframe title="BSS Hub Power App" src={powerAppUrl} className="h-[max(24rem,calc(100dvh-24rem))] w-full flex-none rounded-panel border border-border bg-card lg:h-[max(24rem,calc(100dvh-var(--portal-header-height,4rem)-var(--portal-page-header-gap,16px)-7rem))]" allow="clipboard-read; clipboard-write"/>
 </section>;
}