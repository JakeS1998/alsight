import React, { useState } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { DeliveryCollapseContext } from '@/components/delivery/DeliveryCollapseContext';
import { projectStage } from '@/components/dashboard/pipelineStage';
import deliveryJourneyProgress from '@/components/delivery/deliveryJourneyProgress';
import useJourneyRegisters from '@/components/delivery/useJourneyRegisters';
import JourneyStageButton from '@/components/delivery/JourneyStageButton';
import DeliveryJourneySummary from '@/components/delivery/DeliveryJourneySummary';
export default function DeliveryJourney({ project, delivery, feeProposals, legalDocs, dmas, jcts, warranties, children }) {
  const { user } = useAuth();
  const { registers, error, loading } = useJourneyRegisters(project.id);
  const stages = deliveryJourneyProgress({ project, delivery: delivery || {}, feeProposals, legalDocs, dmas, jcts, warranties, registers });
  const riba = projectStage(project);
  const key = `als-delivery-selection:v1:${user?.id}:${project.id}`;
  const saved = Number(localStorage.getItem(key));
  const defaultStage = ({ 'RIBA 1': 1, 'RIBA 2': 3, 'RIBA 3': 4, 'RIBA 4': 4, 'RIBA 5–7': 9 })[riba] || stages.find(stage => !stage.complete)?.id || 10;
  const [selected, setSelected] = useState(() => stages.some(stage => stage.id === saved) ? saved : defaultStage);
  const [visited, setVisited] = useState(() => new Set([selected, 2]));
  const onSelect = id => { setSelected(id); setVisited(previous => new Set([...previous, id])); localStorage.setItem(key, String(id)); };
  const panels = React.Children.toArray(children);
  return <DeliveryCollapseContext.Provider value={null}><div className="min-w-0 w-full space-y-4">
    <DeliveryJourneySummary riba={riba} project={project} delivery={delivery || {}} feeProposals={feeProposals} jcts={jcts} />
    <div className="grid min-w-0 gap-4 lg:grid-cols-[12rem_minmax(0,1fr)]">
      <aside className="min-w-0 rounded-xl border border-border bg-card p-2 lg:sticky lg:top-[calc(5rem+var(--project-header-height,0px)+var(--delivery-summary-height,5rem))] lg:max-h-[calc(100dvh-6rem-var(--project-header-height,0px)-var(--delivery-summary-height,5rem))] lg:self-start lg:overflow-y-auto"><p className="hidden px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground lg:block">Delivery stages</p><nav aria-label="Select delivery stage" className="flex gap-1 overflow-x-auto lg:flex-col lg:overflow-visible">{stages.map(stage => <JourneyStageButton key={stage.id} stage={stage} active={selected === stage.id} onSelect={onSelect} />)}</nav><p className="px-3 py-2 text-[10px] text-muted-foreground">{loading ? 'Checking registers…' : error ? 'Register progress unavailable.' : 'Progress uses recorded completion indicators.'}</p></aside>
      <main aria-label={`${stages[selected - 1].label} details`} className="min-w-0 [&_section>div]:space-y-4">{panels.map((panel, index) => visited.has(index + 1) && <div key={index} hidden={selected !== index + 1}>{panel}</div>)}</main>
    </div>
  </div></DeliveryCollapseContext.Provider>;
}