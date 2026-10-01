import React from 'react';
import useProject360 from '@/components/projects/useProject360';
import project360Summary from '@/components/projects/project360Summary';
import useHealthFacts from '@/components/alice/useHealthFacts';
import projectHealthDimensions from '@/components/alice/projectHealthDimensions';
import AliceInsight from '@/components/alice/AliceInsight';
import ProjectHealth from '@/components/alice/ProjectHealth';
export default function ProjectOverviewInsight({ project, singleTask }) {
  const summary = useProject360(project);
  const facts = useHealthFacts(project);
  if (summary.isPending || facts.isPending) return <p role="status" className="text-sm text-muted-foreground">Loading ALICE Insight…</p>;
  if (summary.error || facts.error) return <AliceInsight statements={[{ text: 'The project interpretation is unavailable. Existing project records remain below; no health status has been inferred.' }]} />;
  const dimensions = projectHealthDimensions(summary.data, facts.data);
  const phase = project360Summary(project, summary.data, singleTask).phase;
  const statements = [{ text: `The recorded project phase is ${phase}.`, to: `/projects/${project.id}?tab=delivery` }, ...dimensions.filter(d => ['Programme', 'Legal'].includes(d.name)).map(d => ({ text: `${d.name} — ${d.status}: ${d.reason}`, to: `/projects/${project.id}?tab=${d.tab}` }))];
  return <div className="space-y-4"><AliceInsight statements={statements} evidence={dimensions.map(d => ({ text: `${d.name}: ${d.reason}`, to: `/projects/${project.id}?tab=${d.tab}` }))} signals={dimensions.filter(d => ['Watch', 'At Risk'].includes(d.status)).map(d => ({ text: d.reason, to: `/projects/${project.id}?tab=${d.tab}` }))} /><ProjectHealth project={project} dimensions={dimensions} /></div>;
}