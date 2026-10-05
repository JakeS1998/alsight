import React from 'react';
import {Link} from 'react-router-dom';
import {Button} from '@/components/ui/button';
import {projectStage,nextStageDate} from '@/components/dashboard/pipelineStage';
import {projectStaffName} from '@/components/projects/projectStaffName';
import {formatDate} from '@/lib/portal';
export default function ProjectReviewHeader({project,staffMap,accountMap}) {
 const stage=projectStage(project),date=stage && nextStageDate(project,stage);
 return <header className="space-y-3 border-b border-border p-5"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs text-muted-foreground">Project review · {project.project_number}</p><h2 className="mt-1 text-xl font-heading font-bold">{project.name}</h2><p className="mt-1 text-sm text-muted-foreground">{accountMap[project.client_account_id]?.name || project.client_name || 'Client not recorded'} · {project.site_postcode || 'Location not recorded'}</p></div><Button asChild size="sm" variant="outline"><Link to={`/projects/${project.id}`}>Open Full Project</Link></Button></div>
  <div className="flex flex-wrap gap-2 text-xs"><span className="rounded-md bg-primary/10 px-2 py-1">{stage || 'Stage not recorded'}</span><span className="rounded-md bg-muted px-2 py-1">{project.live_project ? 'Live' : 'On hold'}</span></div>
  <dl className="grid grid-cols-3 gap-3 text-xs">{[['BDM',project.bdm_aad_id],['BSM',project.bsm_aad_id],['PM',project.project_manager_id]].map(([label,id])=><div key={label}><dt className="text-muted-foreground">{label}</dt><dd className="mt-1 font-medium">{projectStaffName(id,staffMap)||'Not assigned'}</dd></div>)}</dl><p className="text-xs text-muted-foreground">Next milestone: {date ? `${stage} · ${formatDate(date)}` : 'Not recorded'}</p>
 </header>;
}