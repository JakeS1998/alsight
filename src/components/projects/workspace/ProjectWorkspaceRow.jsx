import React from 'react';
import RecordUpdatedAt from '@/components/RecordUpdatedAt';
import { Check, MapPin, ArrowUpRight, MoreHorizontal } from 'lucide-react';
import {Link} from 'react-router-dom';
import {Button} from '@/components/ui/button';
import ProjectWorkspaceQuickMenu from '@/components/projects/workspace/ProjectWorkspaceQuickMenu';
import { projectStage, nextStageDate } from '@/components/dashboard/pipelineStage';
import { formatDate } from '@/lib/portal';
import { projectStaffName } from '@/components/projects/projectStaffName';
import FrameworkVersionBadge from '@/components/projects/FrameworkVersionBadge';
export default function ProjectWorkspaceRow({project,selected,onSelect,reviewed,staffMap,accountMap,metrics,user,onAction}) {
 const stage=projectStage(project),date=stage && nextStageDate(project,stage);
 return <div className="relative"><button type="button" aria-label={`Select project: ${project.name}`} aria-pressed={selected} onClick={()=>onSelect(project)} className={`block w-full border-b border-border p-4 pb-14 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary ${selected ? 'bg-primary/10 border-l-4 border-l-primary' : 'hover:bg-muted border-l-4 border-l-transparent'}`}>
  <div className="flex flex-wrap items-center gap-2 pr-12 text-xs"><span className="text-muted-foreground">{project.project_number}</span><FrameworkVersionBadge projectNumber={project.project_number}/>{reviewed && <span className="inline-flex items-center gap-1 text-success"><Check className="h-3 w-3"/>Reviewed</span>}<span className="ml-auto rounded-md bg-muted px-2 py-1">{project.live_project ? 'Live' : 'On hold'}</span></div>
  <h2 className="mt-2 text-sm font-semibold text-foreground">{project.name}</h2>
  <RecordUpdatedAt record={project} className="mt-1" />
  <p className="mt-1 text-xs text-muted-foreground">{accountMap[project.client_account_id]?.name || project.client_name || 'Client not recorded'}</p>
  <p className="mt-2 flex items-center gap-1 text-xs text-muted-foreground"><MapPin className="h-3 w-3"/>{project.site_postcode || 'Location not recorded'} · {stage || 'Stage not recorded'}</p>
  <p className="mt-2 text-xs text-muted-foreground">PM: {projectStaffName(project.project_manager_id,staffMap) || '—'}<br/>BDM: {projectStaffName(project.bdm_aad_id,staffMap) || '—'} · BSM: {projectStaffName(project.bsm_aad_id,staffMap) || '—'}</p>
  <div className="mt-2 flex flex-wrap gap-2 text-xs"><span>{date ? `${stage} milestone · ${formatDate(date)}` : 'Next milestone not recorded'}</span>{metrics && <span>{metrics.open} open actions</span>}{metrics?.overdue>0 && <span className="font-medium text-destructive">{metrics.overdue} overdue</span>}</div>
 </button><ProjectWorkspaceQuickMenu project={project} user={user} onSelect={onSelect} onAction={onAction}><Button type="button" size="icon" variant="outline" className="absolute top-3 right-4" aria-label={`Quick actions for ${project.name}`} title="Project quick actions"><MoreHorizontal/></Button></ProjectWorkspaceQuickMenu><Button asChild size="sm" variant="outline" className="absolute bottom-3 right-4"><Link to={`/projects/${project.id}`} aria-label={`Open project record: ${project.name}`}><ArrowUpRight/>Open project</Link></Button></div>;
 }