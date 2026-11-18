import React from 'react';
import {useInfiniteQuery,useQueryClient} from '@tanstack/react-query';
import {Link} from 'react-router-dom';
import {base44} from '@/api/base44Client';
import {Button} from '@/components/ui/button';
import {formatDateTime} from '@/lib/portal';
import ReviewQueryState from '@/components/projects/workspace/ReviewQueryState';
import MeetingSessionEvents from '@/components/projects/workspace/MeetingSessionEvents';
import ProjectMeetingActionRow from '@/components/projects/workspace/ProjectMeetingActionRow';

export default function MeetingCarryOver({session,user,manager,readOnly=false}) {
 const cache=useQueryClient();
 const query=useInfiniteQuery({queryKey:['meeting-carry-actions',user.id,user.role,session.id],initialPageParam:null,queryFn:async({pageParam})=>{
  const events=await base44.entities.CRMActivity.filter({meeting_series_id:session.meeting_series_id,next_action:{$in:['meeting_action','meeting_completed']},occurred_at:{$lt:session.occurred_at}},{sort:'-occurred_at',limit:25,...(pageParam ? {cursor:pageParam} : {})});
  const ids=[...new Set(events.items.map(event=>event.commitments).filter(Boolean))];
  if(!ids.length)return {...events,items:[]};
  const statuses=[{id:{$in:events.items.filter(event=>event.next_action==='meeting_action').map(event=>event.commitments)},status:{$in:['open','in_progress']}}];
  if(session.meeting_previous_at)statuses.push({status:'done',completed_at:{$gte:session.meeting_previous_at,$lt:session.occurred_at}});
  const actions=await base44.entities.ProjectAction.filter({id:{$in:ids},$or:statuses},{sort:'due_date',limit:25});
  const projectIds=[...new Set(actions.items.map(row=>row.project_id).filter(Boolean))];
  const projects=projectIds.length ? (await base44.entities.Project.filter({id:{$in:projectIds}},{limit:25,fields:['name','client_account_id']})).items : [];
  const byId=new Map(projects.map(project=>[project.id,project]));
  return {...events,items:actions.items.filter(row=>byId.has(row.project_id)).map(row=>({row,project:byId.get(row.project_id)}))};
 },getNextPageParam:page=>page.has_more ? page.next_cursor : undefined});
 const entries=[...new Map(query.data?.pages.flatMap(page=>page.items.map(item=>[item.row.id,item])) || []).values()];
 const changed=async(kind,row,project)=>{
  if(kind && manager?.active)await manager.record(kind,project,row);
  cache.invalidateQueries({queryKey:['meeting-carry-actions']});
  cache.invalidateQueries({queryKey:['meeting-actions',project.id]});
  cache.invalidateQueries({queryKey:['workspace-action-metrics']});
 };
 return <div className="space-y-6"><ReviewQueryState query={query}><div className="space-y-4">
  <p className="text-xs text-muted-foreground">Outstanding statuses are current. Completed actions are those recorded from the previous session’s start up to this session’s start.</p>
  {[['Outstanding actions',false],['Completed since the previous session',true]].map(([title,done])=>{
   const items=entries.filter(({row})=>(row.status==='done')===done);
   return <section className="space-y-2" key={title}><h3 className="text-sm font-semibold">{title}</h3>{items.map(({row,project})=><article key={row.id} className="space-y-1"><Link className="text-xs underline" to={`/projects/${project.id}`}>{project.name}</Link>{done ? <p className="rounded-lg border p-3 text-sm">{row.action} <span className="block text-xs text-muted-foreground">{formatDateTime(row.completed_at)}</span></p> : <ProjectMeetingActionRow row={row} canEdit={!readOnly && !!manager?.active && !manager.busy} onChanged={(kind,updated)=>changed(kind,updated,project)}/>}</article>)}{!items.length && <p className="text-sm text-muted-foreground">{query.hasNextPage ? 'None in the records loaded so far.' : 'None recorded.'}</p>}</section>;
  })}
  {query.hasNextPage && <Button size="sm" variant="outline" disabled={query.isFetchingNextPage} onClick={()=>query.fetchNextPage()}>Load more action records</Button>}
 </div></ReviewQueryState><section className="space-y-2"><h3 className="text-sm font-semibold">Notes from earlier sessions</h3><MeetingSessionEvents session={session} user={user} carryNotes/></section></div>;
}