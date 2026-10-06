import React, { useId, useState } from 'react';
import { projectStage } from '@/components/dashboard/pipelineStage';
import { projectCompletionDates } from '@/components/projects/projectCompletionDates';
import { formatDate } from '@/lib/portal';

const LABELS = {
  'RIBA 1': 'Brief', 'RIBA 2': 'Concept Design', 'RIBA 3': 'Coordination',
  'RIBA 4': 'Technical Design', 'RIBA 5–7': 'Build',
};

export default function ProjectHeroPosition({ project }) {
  const [hovered, setHovered] = useState(false);
  const [pinned, setPinned] = useState(false);
  const detailsId = useId();
  const expanded = hovered || pinned;
  const stage = projectStage(project);
  const number = stage ? Number(stage.match(/\d/)[0]) : 5;
  const expected = projectCompletionDates(project)[`riba${number}_system_date`];
  const actual = number === 5 ? project.practical_completion_date : project[`riba${number}_end`];
  const start = number === 1 ? project.aa_executed_date : project[`riba${number - 1}_end`];
  const term = number === 5 ? project.construction_term_weeks : project[`riba${number}_term_weeks`];
  const dates = [
    ['Stage started', start],
    ['Expected completion', expected],
    ...(actual ? [['Recorded completion', actual]] : []),
  ];
  return <section className="ws-hero-position" aria-label="Current project position" onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)} onKeyDown={event => { if (event.key === 'Escape') { setPinned(false); setHovered(false); } }}>
    <button type="button" className="ws-hero-stage-toggle" aria-expanded={expanded} aria-controls={detailsId} aria-pressed={pinned} title={pinned ? 'Click to unpin stage details' : 'Hover to preview or click to pin stage details'} onClick={() => setPinned(value => !value)}>
      <dl className="ws-hero-stage-heading">
        <div><dt>Current Stage</dt><dd>{stage ? LABELS[stage] : 'Complete'}</dd></div>
        {stage && <div className="ws-hero-stage-reference">{stage}</div>}
      </dl>
    </button>
    <dl id={detailsId} className="ws-hero-stage-dates" hidden={!expanded}>
      {dates.map(([label, date]) => <div key={label}><dt>{label}</dt><dd>{date ? formatDate(date) : 'Not recorded'}</dd></div>)}
      {term != null && <div><dt>Stage duration</dt><dd>{term} weeks</dd></div>}
    </dl>
  </section>;
}