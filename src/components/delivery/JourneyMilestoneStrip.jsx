import React from 'react';
import { formatDate } from '@/lib/portal';
import { programmeMilestones } from '@/components/delivery/programmeMilestones';
export default function JourneyMilestoneStrip({ project, delivery, feeProposals, jcts }) {
  const milestones = programmeMilestones(project, feeProposals, jcts, delivery);
  const dates = [
    { label: 'PQ', date: project.pq_approval_date },
    { label: 'AA', date: milestones.find(m => m.label === 'Agreement')?.date },
    { label: 'RIBA 1', date: project.riba1_end },
    ...milestones.filter(m => ['RIBA 2', 'RIBA 3', 'RIBA 4'].includes(m.label)),
    { label: 'PC', date: milestones.find(m => m.label === 'Construction')?.date },
  ];
  return <div aria-label="Key project milestones" className="flex gap-5 overflow-x-auto border-t border-border pt-2">{dates.map(m => <div key={m.label} className="shrink-0" title={m.details?.join(' ')}><span className="mr-1.5 text-[10px] font-semibold text-muted-foreground">{m.label}</span><span className="text-[10px] tabular-nums">{m.date ? formatDate(m.date) : 'Not recorded'}</span></div>)}</div>;
}