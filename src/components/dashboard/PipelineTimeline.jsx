import React, { useEffect, useMemo, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { formatCurrency } from '@/lib/portal';
import { ChevronRight } from 'lucide-react';
import { projectStage, STAGES } from '@/components/dashboard/pipelineStage';
import PipelineTimelineDetail from '@/components/dashboard/PipelineTimelineDetail';
import PipelineOpportunityDetail from '@/components/dashboard/PipelineOpportunityDetail';
import PipelineStageArtwork from '@/components/dashboard/PipelineStageArtwork';

export default function PipelineTimeline({ projects, accountMap }) {
  const [selected, setSelected] = useState(null);
  const [opportunities, setOpportunities] = useState(null);
  const [opportunityError, setOpportunityError] = useState('');
  useEffect(() => {
    let active = true;
    base44.entities.Opportunity.aggregate({ query: { status: 'open', stage: { $nin: ['on_hold', 'won', 'lost'] } }, groupBy: 'stage', sum: 'budget' })
      .then(result => { if (active) setOpportunities({ count: (result.rows || []).reduce((total, row) => total + row.count, 0), value: (result.rows || []).reduce((total, row) => total + (row.sum_budget || 0), 0) }); })
      .catch(e => { if (active) setOpportunityError(e.message || 'Could not load opportunities.'); });
    return () => { active = false; };
  }, []);
  const summary = useMemo(() => STAGES.map(stage => {
    const rows = projects.filter(p => projectStage(p) === stage);
    return { stage, count: rows.length, value: rows.reduce((sum, p) => sum + (Number(p.estimated_value) || 0), 0) };
  }), [projects]);
  const nodes = [{ stage: 'crm', label: 'CRM PIPELINE', count: opportunities?.count, value: opportunities?.value }, ...summary.map(row => ({ ...row, label: row.stage }))];
  return <section className="min-w-0 overflow-hidden rounded-xl border border-border bg-card" aria-label="CRM to RIBA pipeline timeline">
    <div className="px-5 pt-5"><h2 className="font-heading text-base font-semibold text-als-navy">CRM to RIBA project pipeline</h2><p className="mt-1 text-xs text-slate-500">Open CRM opportunities lead into active RIBA projects. Select a stage to explore its records.</p></div>
    <div className="flex flex-col gap-0 px-5 py-5 md:flex-row md:items-stretch md:overflow-x-auto">
      {nodes.map((node, index) => <React.Fragment key={node.stage}>
        {index > 0 && <div aria-hidden="true" className="flex h-7 items-center justify-center text-slate-400 md:h-auto md:w-5 md:shrink-0"><ChevronRight className="h-4 w-4 rotate-90 md:rotate-0" /></div>}
        <button type="button" onClick={() => setSelected(selected === node.stage ? null : node.stage)} aria-expanded={selected === node.stage} aria-controls="pipeline-timeline-detail" className={`relative isolate min-h-28 min-w-0 overflow-hidden rounded-xl border px-3 py-3 text-left transition-colors md:min-w-32 md:flex-1 ${selected === node.stage ? 'border-primary bg-primary/10' : index === 0 ? 'border-als-navy bg-als-navy text-white hover:bg-als-navy-light' : 'border-slate-200 bg-slate-50 hover:border-primary'}`}>
          <PipelineStageArtwork stage={index === 0 ? 'PIPELINE' : node.stage} className={`pointer-events-none absolute -bottom-9 -right-9 h-36 w-36 opacity-40 contrast-125 brightness-105 ${index === 0 && selected !== node.stage ? 'invert grayscale mix-blend-screen' : 'mix-blend-multiply'}`} />
          <span className={`relative z-10 block text-xs font-bold tracking-wide ${selected === node.stage ? 'text-als-navy' : index === 0 ? 'text-white' : 'text-slate-600'}`}>{node.label}</span>
          <strong className="relative z-10 mt-3 block text-xl">{index === 0 && opportunityError ? 'Unavailable' : node.count ?? 'Loading…'} <span className="text-xs font-normal">{index === 0 ? 'opportunities' : 'projects'}</span></strong>
          <span className="relative z-10 mt-1 block text-sm font-medium">{index === 0 && opportunityError ? '—' : node.value == null ? 'Loading…' : formatCurrency(node.value)}</span>
        </button>
      </React.Fragment>)}
    </div>
    {selected === 'crm' ? <PipelineOpportunityDetail /> : selected && <PipelineTimelineDetail selection={selected} projects={projects} accountMap={accountMap} />}
  </section>;
}