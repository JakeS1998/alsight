import React,{useEffect,useState} from 'react';
import {useQuery,useQueryClient} from '@tanstack/react-query';
import {useAuth} from '@/lib/AuthContext';
import {base44} from '@/api/base44Client';
import {Button} from '@/components/ui/button';
import {CircleCheck,LockKeyhole} from 'lucide-react';
import ProjectCompleteDialog from '@/components/projects/ProjectCompleteDialog';
export default function ProjectCompleteZone({project,onUpdated}){
 const {user}=useAuth(),client=useQueryClient(),[open,setOpen]=useState(false);
 const allowed=['admin','director','bdm'].includes(user?.role),inactive=project.status==='inactive';
 const key=['project-completion',project.id,user?.id,user?.role];
 const query=useQuery({queryKey:key,enabled:allowed&&!inactive,retry:false,staleTime:0,queryFn:async()=>{
  const {data}=await base44.functions.invoke('manageProjectLifecycle',{action:'completionStatus',projectId:project.id});
  if(data.error)throw new Error(data.error);return data;
 }});
 useEffect(()=>{
  if(!allowed||inactive)return;
  const refresh=()=>client.invalidateQueries({queryKey:['project-completion',project.id]});
  const delivery=base44.entities.ProjectDelivery.subscribe(e=>{if(!e.data?.project_id||e.data.project_id===project.id)refresh();});
  const framework=base44.entities.FrameworkProjectReport.subscribe(refresh);
  return ()=>{delivery();framework();};
 },[allowed,inactive,project.id,client]);
 if(!allowed)return null;
 const completed=inactive&&String(project.comments||'').includes('[ALS Hub Project Complete]');
 const ready=!inactive&&!query.isFetching&&!query.isError&&query.data?.ready===true;
 return <section className="rounded-panel border border-success/30 bg-success/5 p-6" aria-labelledby="project-complete-title"><div className="flex flex-wrap items-center justify-between gap-4"><div><h3 id="project-complete-title" className="flex items-center gap-2 font-heading text-lg font-semibold text-success"><CircleCheck className="h-5 w-5"/>Project Complete</h3><p className="mt-2 text-sm text-muted-foreground">{completed?'This project has been marked complete and deactivated.':inactive?'This project is inactive.':query.isFetching?'Checking pathway section 10…':ready?'Section 10 is complete. Mark this project complete and deactivate it.':'Complete section 10 · Handover of the pathway to unlock project completion.'}</p></div><Button className="bg-success text-destructive-foreground hover:bg-success/90" disabled={!ready||!project.dataverse_id} onClick={()=>setOpen(true)}>{!ready&&!inactive&&<LockKeyhole className="h-4 w-4"/>}{completed?'Project completed':inactive?'Project inactive':'Complete Project'}</Button></div>{!inactive&&query.data?.missing?.length>0&&<p className="mt-2 text-sm text-muted-foreground">Outstanding: {query.data.missing.join(', ')}.</p>}{query.error&&!inactive&&<div className="mt-2" role="alert"><p className="text-sm text-destructive">{query.error.response?.data?.error||query.error.message}</p><Button variant="outline" onClick={()=>query.refetch()}>Retry completion check</Button></div>}{!project.dataverse_id&&<p className="mt-2 text-sm text-muted-foreground">Link this project to Dataverse before completing it.</p>}{open&&<ProjectCompleteDialog project={project} onClose={()=>setOpen(false)} onUpdated={onUpdated}/>}</section>;
}