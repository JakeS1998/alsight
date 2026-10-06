import React from 'react';
import AllSeeingEyeCard from '@/components/intelligence/AllSeeingEyeCard';
import useProject360 from '@/components/projects/useProject360';
import project360Summary from '@/components/projects/project360Summary';
import useHealthFacts from '@/components/alice/useHealthFacts';
import useProjectTiming from '@/components/intelligence/useProjectTiming';
import projectAssessment from '@/components/intelligence/projectAssessment';
export default function ProjectAllSeeingEye({project,singleTask}) {
  const summary=useProject360(project),facts=useHealthFacts(project),timing=useProjectTiming(project),base=`/projects/${project.id}`;
  const loading=summary.isPending || facts.isPending || timing.isPending,error=summary.error || facts.error || timing.error;
  const dimensions=loading || error ? [] : projectAssessment(project,summary.data,facts.data,timing.data);
  const flags=dimensions.filter(d=>['Watch','At Risk'].includes(d.status)),risk=dimensions.some(d=>d.name==='Risk' && d.status==='At Risk');
  const overdue=timing.data?.overdueActions || 0;
  const classification=flags.length || overdue ? 'Needs attention' : dimensions.some(d=>d.status==='Healthy') ? 'Recorded indicators clear' : 'Not assessed';
  const signals=[...(overdue ? [{label:'Actions',value:`${overdue} overdue`,attention:true,detail:'Open or in-progress Project Actions with a recorded due date in the past.',to:`${base}?tab=delivery`,action:'Review Actions'}] : []),...dimensions.map(d=>({label:d.name,value:d.status==='At Risk' && d.name!=='Risk' ? 'Attention' : d.status,attention:['Watch','At Risk'].includes(d.status),detail:d.reason,to:`${base}?tab=${d.tab}`,action:d.name==='Programme' ? 'View Programme' : d.name==='Legal' ? 'Review Documents' : d.name==='Commercial' ? 'Review Finance' : d.name==='Delivery' || d.name==='Risk' ? 'Open Project Pathway' : 'Review Warranties'}))];
  const phase=summary.data ? project360Summary(project,summary.data,singleTask).phase : '';
  return <AllSeeingEyeCard kind="project" recordId={project.id} classification={classification} tone={risk ? 'risk' : flags.length || overdue ? 'attention' : classification==='Recorded indicators clear' ? 'good' : 'neutral'} signals={signals} loading={loading} error={error} methodology="Project Health · stage-aware presentation v1" context={`${phase}. Existing dimension rules; no overall numerical score is inferred. Pathway readiness remains stage by stage.`} explanation={flags.length || overdue ? `${flags.map(d=>`${d.name}: ${d.reason}`).slice(0,2).join(' ')}${overdue ? ` ${overdue} recorded action(s) have passed their due date.` : ''}` : 'No attention flags are present in the assessed, applicable indicators. Unassessed or not-yet-due requirements are not treated as poor performance.'} actions={[{label:'Open Project Pathway',to:`${base}?tab=delivery`},{label:'Review Documents',to:`${base}?tab=drafting`},{label:'View Programme',to:`${base}?tab=timeline`}]} />;
}