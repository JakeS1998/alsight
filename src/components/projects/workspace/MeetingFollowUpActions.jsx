import React,{useState} from 'react';
import {useQuery,useQueryClient} from '@tanstack/react-query';
import {Link} from 'react-router-dom';
import {base44} from '@/api/base44Client';
import {Button} from '@/components/ui/button';
import ProjectMeetingActionRow from '@/components/projects/workspace/ProjectMeetingActionRow';
import ReviewQueryState from '@/components/projects/workspace/ReviewQueryState';
import {meetingWriter} from '@/components/projects/workspace/meetingSessionActivity';
export default function MeetingFollowUpActions({session,user,manager}) {
 const [cursors,setCursors]=useState([null]),cache=useQueryClient(),cursor=cursors[cursors.length-1];
 const query=useQuery({queryKey:['meeting-follow-up',user.id,user.role,session.key_points,cursor],queryFn:async()=>{
  const events=await base44.entities.CRMActivity.filter({key_points:session.key_points,next_action:'meeting_action'},{sort:'occurred_at',limit:25,fields:['commitments','project_id'],...(cursor ? {cursor} : {})});
  if(!events.items.length)return {events,actions:[],projects:{}};
  const [actions,projects]=await Promise.all([base44.entities.ProjectAction.filter({id:{$in:events.items.map(event=>event.commitments)},status:{$in:['open','in_progress']}},{sort:'due_date',limit:25}),base44.entities.Project.filter({id:{$in:events.items.map(event=>event.project_id)}},{limit:25,fields:['name','client_account_id']})]);
  return {events,actions:actions.items,projects:Object.fromEntries(projects.items.map(project=>[project.id,project]))};
 }});
 const changed=async(kind,row)=>{
  if(kind && manager.active)await manager.record(kind,query.data.projects[row.project_id] || {id:row.project_id,name:'Project unavailable',client_account_id:row.client_account_id},row);
  cache.invalidateQueries({queryKey:['meeting-follow-up']});cache.invalidateQueries({queryKey:['meeting-actions',row.project_id]});cache.invalidateQueries({queryKey:['workspace-action-metrics']});
 };
 return <div className="space-y-4"><h3 className="text-sm font-semibold">{session.subject}</h3><p className="text-xs text-muted-foreground">These are the current action statuses, not the original meeting snapshot. {manager.active ? 'Completions are also recorded in your current meeting.' : 'You can complete actions without starting a meeting.'}</p>{manager.pendingRecords.length>0 && <p role="alert" className="text-sm text-destructive">The action was saved, but its current meeting record still needs saving. <Button size="sm" variant="outline" disabled={manager.busy} onClick={manager.retryRecords}>Retry meeting records</Button></p>}<ReviewQueryState query={query}><div className="space-y-4">{query.data?.actions.map(row=><div key={row.id} className="space-y-2"><Link to={`/projects/${row.project_id}`} className="text-xs font-medium underline">{query.data.projects[row.project_id]?.name || 'Open project'}</Link><ProjectMeetingActionRow row={row} canEdit={meetingWriter(user) && !manager.busy} onChanged={(kind,action)=>changed(kind,action)}/></div>)}{!query.data?.actions.length && <p className="text-sm text-muted-foreground">{query.data?.events.items.length ? 'No accessible outstanding actions in these meeting records; they may already be complete.' : 'No actions were created in this meeting.'}</p>}</div></ReviewQueryState>{(cursors.length>1 || query.data?.events.has_more) && <div className="flex justify-between gap-2"><Button size="sm" variant="outline" disabled={cursors.length===1 || query.isFetching} onClick={()=>setCursors(items=>items.slice(0,-1))}>Previous records</Button><Button size="sm" variant="outline" disabled={!query.data?.events.has_more || query.isFetching} onClick={()=>setCursors(items=>[...items,query.data.events.next_cursor])}>Next records</Button></div>}</div>;
}