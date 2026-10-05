import React from 'react';
import { Link } from 'react-router-dom';
import { Building2, ChevronRight } from 'lucide-react';
import DashboardPanel from '@/components/dashboard/DashboardPanel';
import { projectStage } from '@/components/dashboard/pipelineStage';
export default function HomeProjectsPanel({ projects, recentIds = [], atRisk }) {
  const visited = recentIds.map(id => projects.find(p => p.id === id)).filter(Boolean);
  const rows = (visited.length ? visited : projects).slice(0,4);
  return <DashboardPanel title={visited.length ? 'Continue where you left off' : 'Recently updated projects'} link="/projects">{!rows.length ? <p className="py-4 text-xs text-muted-foreground">No accessible projects yet.</p> : <ul className="divide-y divide-border/60">{rows.map(p => <li key={p.id}><Link to={`/projects/${p.id}`} className="flex items-center gap-3 py-3 hover:bg-muted/40"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-chart-4/15"><Building2 className="h-5 w-5 text-chart-2" /></span><div className="min-w-0 flex-1"><p className="truncate text-xs font-semibold">{p.name}</p><p className="mt-1 text-[10px] text-muted-foreground">{projectStage(p) || 'Completed'} · {p.project_number || 'Project delivery'}</p></div><span className={`rounded-full px-2 py-1 text-[10px] ${atRisk.some(r => r.project.id === p.id) ? 'bg-destructive/10 text-destructive' : 'bg-success/10 text-success'}`}>{atRisk.some(r => r.project.id === p.id) ? 'Flagged' : p.live_project ? 'Live' : 'On hold'}</span><ChevronRight className="h-3 w-3 shrink-0 text-muted-foreground" /></Link></li>)}</ul>}</DashboardPanel>;
}