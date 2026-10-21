import React,{useState} from 'react';
import {useQuery,useQueryClient} from '@tanstack/react-query';
import {Dialog,DialogContent,DialogHeader,DialogTitle,DialogDescription} from '@/components/ui/dialog';
import {Button} from '@/components/ui/button';
import {Textarea} from '@/components/ui/textarea';
import {base44} from '@/api/base44Client';
const reasons=['Budget','Political','Insurance','Planning','Cabinet','Community','Other'];
async function call(payload){const {data}=await base44.functions.invoke('manageProjectLifecycle',payload);if(data.error)throw new Error(data.error);return data;}
export default function ProjectEndDialog({project,onClose,onUpdated}){
 const [reason,setReason]=useState(''),[notes,setNotes]=useState(''),[saving,setSaving]=useState(false),[error,setError]=useState('');
 const client=useQueryClient(),preview=useQuery({queryKey:['project-end-preview',project.id],queryFn:()=>call({action:'preview',projectId:project.id}),retry:false,staleTime:0,refetchOnWindowFocus:false});
 async function end(){setSaving(true);setError('');try{const result=await call({action:'end',projectId:project.id,reason,notes,hash:preview.data.hash,confirm:true});await client.invalidateQueries({queryKey:['commercial-conversions']});client.invalidateQueries({queryKey:['finance']});onUpdated(result.project);onClose();}catch(e){setError(e.response?.data?.error||e.message);}finally{setSaving(false);}}
 return <Dialog open onOpenChange={open=>{if(!open&&!saving)onClose();}}><DialogContent className="max-h-[90vh] overflow-y-auto"><DialogHeader><DialogTitle>End Project</DialogTitle><DialogDescription>End {project.name} and deactivate its linked project records in Dataverse. This does not delete records.</DialogDescription></DialogHeader>
 {preview.isPending&&<p role="status">Checking linked Dataverse records…</p>}
 {preview.error&&<div role="alert"><p className="text-destructive">{preview.error.response?.data?.error||preview.error.message}</p><Button variant="outline" onClick={()=>preview.refetch()}>Try again</Button></div>}
 {preview.data?.ended?<p>This project ended on {new Date(preview.data.endedAt).toLocaleDateString('en-GB')}. Reason: {preview.data.reason}.</p>:preview.data&&<div className="space-y-4"><p className="text-sm">{preview.data.count} project and linked records will be set inactive in one Dataverse transaction.</p><ul className="text-sm text-muted-foreground">{Object.entries(preview.data.tables).map(([table,count])=><li key={table}>{table}: {count}</li>)}</ul><p className="text-sm text-muted-foreground">Shared organisations, contacts and system history are retained. Any linked business record that cannot be made inactive blocks this operation.</p>
 <label className="block text-sm font-medium">Why is this project ending?<select className="mt-2 w-full rounded-md border border-input bg-card p-3 text-foreground" value={reason} onChange={e=>setReason(e.target.value)} disabled={saving}><option value="">Select a reason</option>{reasons.map(r=><option key={r}>{r}</option>)}</select></label>
 <label className="block text-sm font-medium">Details {reason==='Other'?'(required)':'(optional)'}<Textarea className="mt-2" maxLength={2000} value={notes} onChange={e=>setNotes(e.target.value)} disabled={saving}/></label><p className="text-sm text-destructive">This stops the project; it does not set a completion date. Confirm only when you intend to end it.</p></div>}
 {error&&<p role="alert" className="text-destructive">{error}</p>}
 <div className="flex justify-end gap-3"><Button variant="outline" disabled={saving} onClick={onClose}>Cancel</Button>{!preview.data?.ended&&<Button variant="destructive" disabled={saving||!preview.data||preview.isFetching||!reason||(reason==='Other'&&!notes.trim())} onClick={end}>{saving?'Ending project…':'Confirm End Project'}</Button>}</div></DialogContent></Dialog>;
}