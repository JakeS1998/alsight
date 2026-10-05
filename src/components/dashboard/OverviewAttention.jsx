import React, { useState } from 'react';
import AlsightAttention from '@/components/AlsightAttention';
import useAssignedTasks from '@/components/tasks/useAssignedTasks';
import DashboardPanel from '@/components/dashboard/DashboardPanel';
import HomeAttention from '@/components/dashboard/HomeAttention';
import { projectStage } from '@/components/dashboard/pipelineStage';
export default function OverviewAttention({ portfolio, user }) {
  const [mine, setMine] = useState(false);
  const tasks = useAssignedTasks(user,true);
  return <div id="overview-attention"><div className="mb-2 flex gap-2 text-[10px]"><button onClick={()=>setMine(false)} aria-pressed={!mine} className={`rounded-full px-3 py-1 ${!mine ? 'bg-als-navy text-sidebar-foreground' : 'bg-card'}`}>Portfolio prompts ({portfolio.metrics.atRisk})</button><button onClick={()=>setMine(true)} aria-pressed={mine} className={`rounded-full px-3 py-1 ${mine ? 'bg-als-navy text-sidebar-foreground' : 'bg-card'}`}>My actions ({tasks.total})</button></div>{mine ? <HomeAttention tasks={tasks}/> : <DashboardPanel title="What matters" link="/projects" linkLabel="Review projects">{!portfolio.atRisk.length ? <p className="py-8 text-xs text-muted-foreground">No recorded action or completion-date prompts currently require attention.</p> : <ul className="space-y-2">{portfolio.atRisk.slice(0,5).map(({project:p,reasons,level})=><li key={p.id}><AlsightAttention title={`${p.name} · ${projectStage(p)}`} severity={level==='high' && reasons.every(reason=>reason.startsWith('Overdue action')) ? 'urgent' : 'attention'} explanation={`${reasons.map(reason=>reason.replace('Forecast completion overdue','Recorded forecast completion date has passed')).join(' · ')}. These flags concern ALSight records, not a conclusion about site progress or contractual delay.`} actions={[{label:'Review Project Pathway',to:`/projects/${p.id}?tab=delivery`},{label:'Open project',to:`/projects/${p.id}`}]}/></li>)}</ul>}</DashboardPanel>}</div>;
}