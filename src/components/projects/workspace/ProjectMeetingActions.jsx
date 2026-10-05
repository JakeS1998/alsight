import React,{useState} from 'react';
import {useInfiniteQuery,useQueryClient} from '@tanstack/react-query';
import {base44} from '@/api/base44Client';
import {Button} from '@/components/ui/button';
import ProjectMeetingActionForm from '@/components/projects/workspace/ProjectMeetingActionForm';
import ProjectMeetingActionRow from '@/components/projects/workspace/ProjectMeetingActionRow';
import ReviewQueryState from '@/components/projects/workspace/ReviewQueryState';
export default function ProjectMeetingActions({project,user,onRecord}) {
 const [pending,setPending]=useState(null),[retrying,setRetrying]=useState(false);
 const cache=useQueryClient(),canEdit=['admin','director','bdm','bsm'].includes(user.role);
 const query=useInfiniteQuery({queryKey:['meeting-actions',project.id,user.id,user.role],initialPageParam:null,queryFn:({pageParam})=>base44.entities.ProjectAction.filter({project_id:project.id,status:{$ne:'done'}},{sort:'due_date',limit:25,...(pageParam ? {cursor:pageParam} : {})}),getNextPageParam:p=>p.has_more ? p.next_cursor : undefined});
 const changed=async(kind,row)=>{cache.invalidateQueries({queryKey:['meeting-actions',project.id]});cache.invalidateQueries({queryKey:['workspace-action-metrics']});if(kind){const result=await onRecord(kind,row);if(!result)setPending({kind,row});}};
 const retry=async()=>{setRetrying(true);const result=await onRecord(pending.kind,pending.row);if(result)setPending(null);setRetrying(false);};
 return <div className="space-y-4">{pending && <p role="alert" className="text-sm text-destructive">The action was saved, but its meeting record could not be saved. <Button size="sm" variant="outline" disabled={retrying} onClick={retry}>Retry meeting record</Button></p>}{canEdit && <ProjectMeetingActionForm project={project} onCreated={row=>changed('actions',row)}/>}<ReviewQueryState query={query}><div className="space-y-2">{query.data?.pages.flatMap(p=>p.items).map(row=><ProjectMeetingActionRow key={row.id} row={row} canEdit={canEdit} onChanged={changed}/>)}{!query.data?.pages[0].items.length && <p className="text-sm text-muted-foreground">No accessible open actions.</p>}{query.hasNextPage && <Button size="sm" variant="outline" disabled={query.isFetchingNextPage} onClick={()=>query.fetchNextPage()}>Load more actions</Button>}</div></ReviewQueryState></div>;
}