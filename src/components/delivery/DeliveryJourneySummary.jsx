import React from 'react';
import { STAGES } from '@/components/dashboard/pipelineStage';
import JourneyStageButton from '@/components/delivery/JourneyStageButton';
import JourneyMilestoneStrip from '@/components/delivery/JourneyMilestoneStrip';
export default function DeliveryJourneySummary({ stages, selected, onSelect, riba, project, delivery, feeProposals, jcts }) {
  return <header className="sticky top-16 z-20 space-y-3 rounded-xl border border-border bg-card p-3 shadow-sm sm:p-4">
    <div className="flex flex-wrap items-center justify-between gap-2"><h3 className="text-sm font-bold">Project journey <span className="ml-2 text-xs font-normal text-muted-foreground">10 stages</span></h3><div className="flex flex-wrap items-center gap-1" aria-label="Current RIBA stage"><span className="mr-2 text-[10px] font-semibold text-muted-foreground">{riba ? 'CURRENT RIBA' : 'RIBA NOT ACTIVE'}</span>{STAGES.map(stage => <span key={stage} className={stage === riba ? 'rounded bg-primary px-2 py-1 text-[10px] font-bold text-primary-foreground' : 'rounded bg-muted px-2 py-1 text-[10px] text-muted-foreground'}>{stage.replace('RIBA ', '')}</span>)}</div></div>
    <nav aria-label="Journey summary" className="flex gap-1 overflow-x-auto">{stages.map(stage => <JourneyStageButton key={stage.id} stage={stage} active={selected === stage.id} onSelect={onSelect} compact />)}</nav>
    <JourneyMilestoneStrip project={project} delivery={delivery} feeProposals={feeProposals} jcts={jcts} />
  </header>;
}