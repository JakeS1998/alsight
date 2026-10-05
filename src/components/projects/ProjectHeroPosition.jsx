import React from 'react';
import { projectStage } from '@/components/dashboard/pipelineStage';
import { projectCompletionDates } from '@/components/projects/projectCompletionDates';
import { formatDate } from '@/lib/portal';

const LABELS = {
  'RIBA 1': 'Brief', 'RIBA 2': 'Concept Design', 'RIBA 3': 'Coordination',
  'RIBA 4': 'Technical Design', 'RIBA 5–7': 'Build',
};

export default function ProjectHeroPosition({ project }) {
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
  return <dl className="ws-hero-position" aria-label="Current project position">
    <div className="ws-hero-stage-heading">
      <div><dt>Current Stage</dt><dd>{stage ? LABELS[stage] : 'Complete'}</dd></div>
      {stage && <div className="ws-hero-stage-reference">{stage}</div>}
    </div>
    <div className="ws-hero-stage-dates">
      {dates.map(([label, date]) => <div key={label}><dt>{label}</dt><dd>{date ? formatDate(date) : 'Not recorded'}</dd></div>)}
      {term != null && <div><dt>Stage duration</dt><dd>{term} weeks</dd></div>}
    </div>
  </dl>;
}