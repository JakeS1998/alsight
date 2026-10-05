import React,{useEffect,useState,Suspense} from 'react';
import {useQuery} from '@tanstack/react-query';
import {base44} from '@/api/base44Client';
import {Button} from '@/components/ui/button';
import ProjectWorkspaceRow from '@/components/projects/workspace/ProjectWorkspaceRow';
import ProjectMeetingReview from '@/components/projects/workspace/ProjectMeetingReview';
import useWorkspaceMetrics from '@/components/projects/workspace/useWorkspaceMetrics';
import useReviewSession from '@/components/projects/workspace/useReviewSession';
import MeetingSessionControls from '@/components/projects/workspace/MeetingSessionControls';
import MeetingOperationContext from '@/components/projects/workspace/MeetingOperationContext';
import '@/components/projects/workspace/workspace.css';
const ProjectMapView=React.lazy(()=>import('@/components/projects/ProjectMapView'));
export default function ProjectsOperationalWorkspace({projects,user,accountMap,staffMap,loading,meeting,mapProps,filterKey,paging,total}) {
 const [selected,setSelected]=useState(null);
 const manager=useReviewSession(user,[...new Set([...projects.map(p=>p.id),selected?.id].filter(Boolean))].sort()),{session,reviewed,record}=manager;
 useEffect(()=>{setSelected(null);},[filterKey]);
 const found=projects.find(p=>p.id===selected?.id),remote=useQuery({queryKey:['workspace-selected-project',user.id,user.role,selected?.id],enabled:!!selected && !found && mapProps.serverPaging,queryFn:()=>base44.entities.Project.get(selected.id)});
 const project=found || remote.data || (!mapProps.serverPaging ? selected : null);
 const metrics=useWorkspaceMetrics(projects,user),index=projects.findIndex(p=>p.id===project?.id);
 const select=p=>setSelected(p);
 useEffect(()=>{if(!selected && projects.length)setSelected(projects[0]);},[projects,selected]);
 return <div className="space-y-3">{meeting && <MeetingSessionControls manager={manager} user={user} total={total} project={project} index={index} projects={projects} onSelect={select}/>}
 <div className="project-operations"><section className="project-operations-list" aria-label="Project list">{loading ? <p role="status" className="p-6 text-sm text-muted-foreground">Loading projects…</p> : !projects.length ? <p className="p-6 text-sm text-muted-foreground">No projects match your filters.</p> : <>{project && !found && <div className="border-b border-border"><p className="px-4 pt-3 text-xs text-muted-foreground">Selected from map</p><ProjectWorkspaceRow project={project} selected onSelect={select} staffMap={staffMap} accountMap={accountMap} reviewed={reviewed.includes(project.id)}/></div>}{projects.map(p=><ProjectWorkspaceRow key={p.id} project={p} selected={p.id===project?.id} onSelect={select} reviewed={meeting && reviewed.includes(p.id)} staffMap={staffMap} accountMap={accountMap} metrics={!metrics.data?.truncated ? metrics.data?.items[p.id] : null}/>)}</>}{metrics.error && <p className="p-3 text-xs text-muted-foreground">Action counts unavailable.</p>}{paging && <div className="flex justify-between gap-2 p-3"><Button size="sm" variant="outline" disabled={paging.previousDisabled} onClick={paging.previous}>Previous page</Button><Button size="sm" variant="outline" disabled={paging.nextDisabled} onClick={paging.next}>Next page</Button></div>}</section>
 <section className="project-operations-detail" aria-label={meeting ? 'Project review panel' : 'Project map'}>{meeting ? !manager.active ? <p className="p-6 text-sm text-muted-foreground">{manager.ended ? 'This meeting has ended. Open its summary or start a new meeting.' : 'Start or resume a named meeting to review projects.'}</p> : remote.isFetching ? <p role="status" className="p-6">Loading selected project…</p> : remote.error ? <p role="alert" className="p-6 text-destructive">Unable to load this project. <button className="underline" onClick={()=>remote.refetch()}>Try again</button></p> : <MeetingOperationContext.Provider value={manager.operationContext}><ProjectMeetingReview key={`${session.id}:${project?.id}`} project={project} user={user} staffMap={staffMap} accountMap={accountMap} session={session} sessionKey={session.key_points} onRecord={(kind,row)=>record(kind,project,row)}/></MeetingOperationContext.Provider> : <Suspense fallback={<p role="status" className="p-6">Loading map…</p>}><ProjectMapView {...mapProps} selectedId={project?.id} onSelect={select}/></Suspense>}</section></div></div>;
}