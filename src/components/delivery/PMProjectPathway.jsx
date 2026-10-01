import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import deliveryJourneyProgress from '@/components/delivery/deliveryJourneyProgress';
import riskApprovalProgress from '@/components/delivery/riskApprovalProgress';
import JourneyStageButton from '@/components/delivery/JourneyStageButton';
import DeliveryJourneySummary from '@/components/delivery/DeliveryJourneySummary';
import PMPathwayStage from '@/components/delivery/PMPathwayStage';
import { projectStage } from '@/components/dashboard/pipelineStage';

export default function PMProjectPathway({ project }) {
  const { user } = useAuth();
  const [selected,setSelected] = useState(1);
  const query = useQuery({ queryKey: ['pm-project-pathway', user?.id, project.id], queryFn: async () => (await base44.functions.invoke('manageValuation', { action: 'pathway', projectId: project.id })).data.pathway, staleTime: 30000 });
  if (query.isLoading) return <p role="status" className="py-8 text-sm text-muted-foreground">Loading Pathway…</p>;
  if (query.error) return <p role="alert" className="py-8 text-sm text-destructive">Unable to load the Pathway. <button className="underline" onClick={() => query.refetch()}>Retry</button></p>;
  const data = query.data;
  const stages = deliveryJourneyProgress({ project, ...data, registers: { 6: {percent:null}, 7: {percent:null}, 8: riskApprovalProgress(data.riskCount,data.approvals) } });
  return <div className="space-y-4">
    <DeliveryJourneySummary riba={projectStage(project)} project={project} delivery={data.delivery} feeProposals={data.feeProposals} jcts={data.jcts} />
    <p className="text-xs text-muted-foreground">Read-only project manager view · Contractor commercial information only. Use Valuations to manage contractor valuations.</p>
    <div className="grid min-w-0 gap-4 lg:grid-cols-[12rem_minmax(0,1fr)]">
      <aside className="rounded-xl border border-border bg-card p-2 lg:self-start"><p className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Pathway steps</p><nav aria-label="ALSight Project Pathway steps" className="flex gap-1 overflow-x-auto lg:flex-col">{stages.map(stage => <JourneyStageButton key={stage.id} stage={stage} active={stage.id === selected} onSelect={setSelected} />)}</nav></aside>
      <main className="min-w-0"><PMPathwayStage key={selected} stage={stages[selected-1]} data={data} project={project} /></main>
    </div>
  </div>;
}