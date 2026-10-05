import React from 'react';
import {useInfiniteQuery,useQueryClient} from '@tanstack/react-query';
import {base44} from '@/api/base44Client';
import {Button} from '@/components/ui/button';
import ProjectMeetingActionForm from '@/components/projects/workspace/ProjectMeetingActionForm';
import ProjectMeetingActionRow from '@/components/projects/workspace/ProjectMeetingActionRow';
import ReviewQueryState from '@/components/projects/workspace/ReviewQueryState';
export default function ProjectMeetingActions({project,user,onRecord}) {
 const cache=useQueryClient(),canEdit=['admin','director','bdm','bsm'].includes(user.role);
 const query=useInfiniteQuery({queryKey:['meeting-actions',project.id,user.id,user.role],initialPageParam:null,queryFn:({pageParam})=>base44.entities.ProjectAction.filter({project_id:project.id,status:{$ne:'done'}},{sort:'due_date',limit:25,...(pageParam ? {cursor:pageParam} : {})}),getNextPageParam:p=>p.has_more ? p.next_cursor : undefined});
 const changed=kind=>{if(kind)onRecord(kind);cache.invalidateQueries({queryKey:['meeting-actions',project.id]});cache.invalidateQueries({queryKey:['workspace-action-metrics']});};
 return <div className="space-y-4">{canEdit && <ProjectMeetingActionForm project={project} onCreated={()=>changed('actions')}/>}<ReviewQueryState query={query}><div className="space-y-2">{query.data?.pages.flatMap(p=>p.items).map(row=><ProjectMeetingActionRow key={row.id} row={row} canEdit={canEdit} onChanged={changed}/>)}{!query.data?.pages[0].items.length && <p className="text-sm text-muted-foreground">No accessible open actions.</p>}{query.hasNextPage && <Button size="sm" variant="outline" disabled={query.isFetchingNextPage} onClick={()=>query.fetchNextPage()}>Load more actions</Button>}</div></ReviewQueryState></div>;
}