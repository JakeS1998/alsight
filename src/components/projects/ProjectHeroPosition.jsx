import React from 'react';
import { projectStage } from '@/components/dashboard/pipelineStage';

const LABELS = {
  'RIBA 1': 'Brief', 'RIBA 2': 'Concept Design', 'RIBA 3': 'Coordination',
  'RIBA 4': 'Technical Design', 'RIBA 5–7': 'Build',
};

export default function ProjectHeroPosition({ project }) {
  const stage = projectStage(project);
  return <dl className="ws-hero-position" aria-label="Current project position">
    <dt>Current Stage</dt>
    <dd>{stage ? LABELS[stage] : 'Complete'}</dd>
    {stage && <div className="ws-hero-stage-reference">{stage}</div>}
  </dl>;
}