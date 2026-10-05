import React from 'react';
import useProject360 from '@/components/projects/useProject360';
import project360Summary from '@/components/projects/project360Summary';
import ProjectOverviewInsight from '@/components/alice/ProjectOverviewInsight';
export default function Project360Strip({ project, singleTask }) {
  const { data, isPending, error } = useProject360(project);
  const summary = project360Summary(project, data, singleTask);
  return <div className="space-y-4"><ProjectOverviewInsight project={project} singleTask={singleTask} /><section aria-label="Project 360 summary" className="rounded-xl border border-border bg-card px-4 py-3">
    <div className="mb-3 flex flex-wrap items-center gap-3"><h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Project 360</h2><span className="rounded-md bg-primary/10 px-2.5 py-1 text-sm font-semibold text-foreground">{summary.phase}</span></div>
    {error ? <p role="alert" className="text-sm text-destructive">Project summary unavailable — existing details remain below.</p> : isPending ? <p role="status" className="text-sm text-muted-foreground">Loading project summary…</p> : <dl className="grid gap-x-4 gap-y-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)] 2xl:gap-x-6">{summary.fields.map(field => <div key={field.label} title={field.detail} className="min-w-0"><dt className="text-xs text-muted-foreground">{field.label}</dt><dd className="mt-1 text-sm font-semibold text-foreground">{field.value}</dd></div>)}</dl>}
  </section></div>;
}