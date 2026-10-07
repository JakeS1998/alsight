import React, { useState } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { DeliveryCollapseContext } from '@/components/delivery/DeliveryCollapseContext';
import { projectStage } from '@/components/dashboard/pipelineStage';
import deliveryJourneyProgress from '@/components/delivery/deliveryJourneyProgress';
import useJourneyRegisters from '@/components/delivery/useJourneyRegisters';
import JourneyStageButton from '@/components/delivery/JourneyStageButton';
import DeliveryJourneySummary from '@/components/delivery/DeliveryJourneySummary';
import JourneyProgressBreakdown from '@/components/delivery/JourneyProgressBreakdown';
import PathwayInsight from '@/components/alice/PathwayInsight';
import ProjectLessons from '@/components/alliance/ProjectLessons';
import {INTERNAL_ROLES} from '@/lib/portal';
export default function DeliveryJourney({ project, delivery, feeProposals, legalDocs, dmas, jcts, warranties, suppliers, accountMap, children }) {
  const { user } = useAuth();
  const { registers, error, loading } = useJourneyRegisters(project.id);
  const stages = deliveryJourneyProgress({ project, delivery: delivery || {}, feeProposals, legalDocs, dmas, jcts, warranties, registers, suppliers, accountMap });
  const riba = projectStage(project);
  const key = `als-delivery-selection:v1:${user?.id}:${project.id}`;
  const requested = Number(new URLSearchParams(window.location.search).get('stage'));
  const saved = stages.some(stage => stage.id === requested) ? requested : Number(localStorage.getItem(key));
  const defaultStage = ({ 'RIBA 1': 1, 'RIBA 2': 3, 'RIBA 3': 4, 'RIBA 4': 4, 'RIBA 5–7': 9 })[riba] || stages.find(stage => !stage.complete)?.id || 10;
  const [selected, setSelected] = useState(() => stages.some(stage => stage.id === saved) ? saved : defaultStage);
  const [visited, setVisited] = useState(() => new Set([selected, 2]));
  const onSelect = id => { setSelected(id); setVisited(previous => new Set([...previous, id])); localStorage.setItem(key, String(id)); };
  const panels = React.Children.toArray(children);
  return <DeliveryCollapseContext.Provider value={null}><div className="min-w-0 w-full space-y-4">
    <PathwayInsight stages={stages} loading={loading} error={error} onSelect={onSelect} />
    <DeliveryJourneySummary riba={riba} project={project} delivery={delivery || {}} feeProposals={feeProposals} jcts={jcts} />
    <div className="grid min-w-0 gap-4 lg:grid-cols-[12rem_minmax(0,1fr)]">
      <aside className="min-w-0 rounded-xl border border-border bg-card p-2 lg:sticky lg:top-[calc(var(--portal-header-height,4rem)+1rem+var(--project-header-height,0px)+var(--delivery-summary-height,5rem))] lg:max-h-[calc(100dvh-var(--portal-header-height,4rem)-2rem-var(--project-header-height,0px)-var(--delivery-summary-height,5rem))] lg:self-start lg:overflow-y-auto"><p className="hidden px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground lg:block">Pathway steps</p><nav aria-label="ALSight Project Pathway steps" className="flex gap-1 overflow-x-auto lg:flex-col lg:overflow-visible">{stages.map(stage => <JourneyStageButton key={stage.id} stage={stage} active={selected === stage.id} onSelect={onSelect} />)}</nav><p className="px-3 py-2 text-[10px] text-muted-foreground">{loading ? 'Checking registers…' : error ? 'Register progress unavailable.' : 'Progress uses recorded completion indicators.'}</p></aside>
      <main aria-label={`ALSight Project Pathway · Step ${selected}: ${stages[selected - 1].label}`} className="min-w-0 [&_section>div]:space-y-4"><JourneyProgressBreakdown stage={stages[selected - 1]} />{panels.map((panel, index) => visited.has(index + 1) && <div key={index} hidden={selected !== index + 1}>{panel}</div>)}</main>
    </div>
    {INTERNAL_ROLES.includes(user?.role) && <ProjectLessons key={`${project.id}-${selected}`} project={project} stage={stages[selected - 1].label} />}
  </div></DeliveryCollapseContext.Provider>;
}