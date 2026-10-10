import React from 'react';
import {useQueryClient} from '@tanstack/react-query';
import {RegisterList} from '@/components/delivery/RegisterList';
import {ACTION_COLS,ACTION_TABLE,DECISION_COLS,DECISION_TABLE} from '@/components/delivery/projectRegisterColumns';
export default function ProjectRegisterTab({project,user,kind}) {
  const cache=useQueryClient(),action=kind==='actions',canEdit=['admin','director','bdm','bsm'].includes(user.role);
  const changed=()=>{cache.invalidateQueries({queryKey:['project-command',project.id]});cache.invalidateQueries({queryKey:['project-attention-actions',project.id]});cache.invalidateQueries({queryKey:['project-meeting-history',project.id]});};
  return <section className="rounded-xl border border-border bg-card p-5"><h2 className="mb-4 text-xl font-semibold">{action ? 'Project actions' : 'Project decisions'}</h2><RegisterList title={action ? 'Action' : 'Decision'} description={`Connected to ${project.name}`} entityName={action ? 'ProjectAction' : 'ProjectDecision'} projectId={project.id} project={project} columns={action ? ACTION_COLS : DECISION_COLS} tableColumns={action ? ACTION_TABLE : DECISION_TABLE} addLabel={action ? 'Add action' : 'Record decision'} sortBy={action ? 'due_date' : '-date_requested'} paginated sortable readOnly={!canEdit} onChanged={changed}/></section>;
}