import React,{useState} from 'react';
import {useAuth} from '@/lib/AuthContext';
import {Button} from '@/components/ui/button';
import {TriangleAlert} from 'lucide-react';
import ProjectEndDialog from '@/components/projects/ProjectEndDialog';
export default function ProjectDangerZone({project,onUpdated}){
 const {user}=useAuth(),[open,setOpen]=useState(false);
 if(!['admin','director','bdm'].includes(user?.role))return null;
 const inactive=project.status==='inactive';
 return <section className="rounded-panel border border-destructive/30 bg-destructive/5 p-6" aria-labelledby="project-danger-title"><div className="flex flex-wrap items-center justify-between gap-4"><div><h3 id="project-danger-title" className="flex items-center gap-2 font-heading text-lg font-semibold text-destructive"><TriangleAlert className="h-5 w-5"/>Danger Zone</h3><p className="mt-2 text-sm text-muted-foreground">{inactive?'This project is inactive.':'End this project and deactivate its linked project records in Dataverse. The ending reason is retained for Commercial reporting.'}</p></div><Button variant="destructive" disabled={inactive||!project.dataverse_id} onClick={()=>setOpen(true)}>{inactive?'Project inactive':'End Project'}</Button></div>{!project.dataverse_id&&<p className="mt-2 text-sm text-muted-foreground">This project must be linked to Dataverse before it can be ended.</p>}{open&&<ProjectEndDialog project={project} onClose={()=>setOpen(false)} onUpdated={onUpdated}/>}</section>;
}