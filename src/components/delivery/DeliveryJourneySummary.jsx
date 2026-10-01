import React from 'react';


import JourneyMilestoneStrip from '@/components/delivery/JourneyMilestoneStrip';
export default function DeliveryJourneySummary({ riba, project, delivery, feeProposals, jcts }) {
  return <header className="sticky top-16 z-20 space-y-2 rounded-xl border border-border bg-card px-3 py-2 shadow-sm">
    <div className="flex items-center justify-between gap-2"><h3 className="text-xs font-bold">Delivery summary</h3><div className="flex items-center gap-2" aria-label="Current RIBA stage"><span className="text-[10px] font-semibold text-muted-foreground">CURRENT RIBA</span><span className="rounded bg-primary px-2 py-1 text-[10px] font-bold text-primary-foreground">{riba || 'Not active'}</span></div></div>
    <JourneyMilestoneStrip project={project} delivery={delivery} feeProposals={feeProposals} jcts={jcts} />
  </header>;
}