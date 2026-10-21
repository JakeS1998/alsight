import React,{useState} from 'react';
import {useQueryClient} from '@tanstack/react-query';
import {base44} from '@/api/base44Client';
import {Dialog,DialogContent,DialogHeader,DialogTitle,DialogDescription} from '@/components/ui/dialog';
import {Button} from '@/components/ui/button';
export default function ProjectCompleteDialog({project,onClose,onUpdated}){
 const [saving,setSaving]=useState(false),[error,setError]=useState(''),client=useQueryClient();
 async function complete(){
  setSaving(true);setError('');
  try{
   const {data}=await base44.functions.invoke('manageProjectLifecycle',{action:'complete',projectId:project.id,confirm:true});
   if(data.error)throw new Error(data.error);
   onUpdated(data.project);
   await Promise.all([client.invalidateQueries({queryKey:['commercial-conversions']}),client.invalidateQueries({queryKey:['finance']}),client.invalidateQueries({queryKey:['project-completion',project.id]})]);
   onClose();
  }catch(e){setError(e.response?.data?.error||e.message);}finally{setSaving(false);}
 }
 return <Dialog open onOpenChange={open=>{if(!open&&!saving)onClose();}}><DialogContent onInteractOutside={e=>{if(saving)e.preventDefault();}} onEscapeKeyDown={e=>{if(saving)e.preventDefault();}}><DialogHeader><DialogTitle>Complete Project</DialogTitle><DialogDescription>Mark {project.name} complete and deactivate the project in Dataverse and ALS Hub. It will leave active project lists; records are not deleted.</DialogDescription></DialogHeader><p className="text-sm text-muted-foreground">Pathway section 10 will be checked again before saving. The completion will be recorded in the project comments. Linked documents and other records are retained unchanged.</p>{error&&<p role="alert" className="text-sm text-destructive">{error}</p>}<div className="flex justify-end gap-3"><Button variant="outline" disabled={saving} onClick={onClose}>Cancel</Button><Button className="bg-success text-destructive-foreground hover:bg-success/90" disabled={saving} onClick={complete}>{saving?'Completing project…':'Confirm Complete & Deactivate'}</Button></div></DialogContent></Dialog>;
}