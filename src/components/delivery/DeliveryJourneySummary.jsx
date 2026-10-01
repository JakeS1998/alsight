import React, { useRef } from 'react';
import useStickyHeight from '@/components/projects/useStickyHeight';


import JourneyMilestoneStrip from '@/components/delivery/JourneyMilestoneStrip';
export default function DeliveryJourneySummary({ riba, project, delivery, feeProposals, jcts }) {
  const ref = useRef(null);
  useStickyHeight(ref, '--delivery-summary-height');
  return <header ref={ref} className="sticky top-16 z-20 min-w-0 w-full space-y-2 rounded-xl border border-border bg-card px-3 py-2 shadow-sm md:top-[calc(4rem+var(--project-header-height,0px))]">
    <div className="flex items-center justify-between gap-2"><h3 className="text-xs font-bold">ALSight Project Pathway</h3><div className="flex items-center gap-2" aria-label="Current RIBA stage"><span className="text-[10px] font-semibold text-muted-foreground">CURRENT RIBA</span><span className="rounded bg-primary px-2 py-1 text-[10px] font-bold text-primary-foreground">{riba || 'Not active'}</span></div></div>
    <JourneyMilestoneStrip project={project} delivery={delivery} feeProposals={feeProposals} jcts={jcts} />
  </header>;
}