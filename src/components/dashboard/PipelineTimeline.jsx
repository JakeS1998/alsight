import React, { useMemo, useState } from 'react';
import { formatCurrency } from '@/lib/portal';
import { ChevronRight } from 'lucide-react';
import { projectStage, STAGES } from '@/components/dashboard/pipelineStage';
import PipelineTimelineDetail from '@/components/dashboard/PipelineTimelineDetail';

export default function PipelineTimeline({ projects, accountMap }) {
  const [selected, setSelected] = useState(null);
  const summary = useMemo(() => STAGES.map(stage => {
    const rows = projects.filter(p => projectStage(p) === stage);
    return { stage, count: rows.length, value: rows.reduce((sum, p) => sum + (Number(p.estimated_value) || 0), 0) };
  }), [projects]);
  const total = summary.reduce((sum, row) => sum + row.value, 0);
  const nodes = [{ stage: 'total', label: 'PIPELINE TOTAL', count: projects.length, value: total }, ...summary.map(row => ({ ...row, label: row.stage }))];
  return <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white" aria-label="RIBA pipeline timeline">
    <div className="px-5 pt-5"><h2 className="font-heading text-base font-semibold text-als-navy">RIBA project pipeline</h2><p className="mt-1 text-xs text-slate-500">Follow active projects through the lifecycle. Select a stage to explore projects.</p></div>
    <div className="flex flex-col gap-0 px-5 py-5 md:flex-row md:items-stretch md:overflow-x-auto">
      {nodes.map((node, index) => <React.Fragment key={node.stage}>
        {index > 0 && <div aria-hidden="true" className="flex h-7 items-center justify-center text-slate-400 md:h-auto md:w-5 md:shrink-0"><ChevronRight className="h-4 w-4 rotate-90 md:rotate-0" /></div>}
        <button type="button" onClick={() => setSelected(selected === node.stage ? null : node.stage)} aria-expanded={selected === node.stage} aria-controls="pipeline-timeline-detail" className={`min-w-0 rounded-xl border px-3 py-4 text-left transition-colors md:min-w-36 md:flex-1 ${selected === node.stage ? 'border-primary bg-primary/10' : index === 0 ? 'border-als-navy bg-als-navy text-white hover:bg-als-navy-light' : 'border-slate-200 bg-slate-50 hover:border-primary'}`}>
          <span className={`block text-xs font-bold tracking-wide ${selected === node.stage ? 'text-als-navy' : index === 0 ? 'text-white' : 'text-slate-600'}`}>{node.label}</span>
          <strong className="mt-3 block text-xl">{node.count} <span className="text-xs font-normal">projects</span></strong>
          <span className="mt-1 block text-sm font-medium">{formatCurrency(node.value)}</span>
        </button>
      </React.Fragment>)}
    </div>
    {selected && <PipelineTimelineDetail selection={selected} projects={projects} accountMap={accountMap} />}
  </section>;
}