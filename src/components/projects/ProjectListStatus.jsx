import React from 'react';
import { projectStage } from '@/components/dashboard/pipelineStage';
export default function ProjectListStatus({ project, comfortable }) {
  const stage = comfortable ? projectStage(project) || 'Completed' : null;
  return <div className="flex flex-wrap items-center gap-1.5">
    <span className={project.live_project ? 'inline-flex rounded-full border border-chart-2/25 bg-chart-2/10 px-2 py-0.5 text-xs font-medium text-chart-2' : 'inline-flex rounded-full border border-chart-1/30 bg-chart-1/10 px-2 py-0.5 text-xs font-medium text-foreground'}>{project.live_project ? 'Live' : 'On Hold'}</span>
    {stage && <span className="inline-flex rounded-full border border-border bg-secondary px-2 py-0.5 text-xs text-muted-foreground">{stage}</span>}
  </div>;
}