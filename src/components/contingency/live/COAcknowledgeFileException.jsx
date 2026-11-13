import React,{useState} from 'react';
import {useMutation,useQueryClient} from '@tanstack/react-query';
import {Button} from '@/components/ui/button';
import {Dialog,DialogContent,DialogHeader,DialogTitle,DialogDescription} from '@/components/ui/dialog';
import {coCall} from '@/components/contingency/live/useContingencyOperations';
export default function COAcknowledgeFileException({item}){
 const [open,setOpen]=useState(false),[note,setNote]=useState(''),client=useQueryClient();
 const mutation=useMutation({mutationFn:()=>coCall('file_exception_acknowledge',{id:item.id,confirm_exclusion:true,note}),onSuccess:async()=>{await Promise.all([client.invalidateQueries({queryKey:['co']}),client.invalidateQueries({queryKey:['co-status']})]);setOpen(false);}});
 return <><Button size="sm" variant="outline" onClick={()=>{mutation.reset();setNote('');setOpen(true);}}>Acknowledge & exclude</Button>
 <Dialog open={open} onOpenChange={value=>{if(!mutation.isPending)setOpen(value);}}><DialogContent><DialogHeader><DialogTitle>Acknowledge and exclude this file?</DialogTitle><DialogDescription>This removes the exception from readiness blockers, but does not confirm that the file is backed up.</DialogDescription></DialogHeader>
 <p className="break-words font-semibold">{item.filename}</p><p className="text-sm text-muted-foreground">Future backups from this source will skip this file, even if its size or contents change. Other files continue normally; the acknowledgement remains in the audit history.</p>
 <form className="space-y-4" onSubmit={e=>{e.preventDefault();mutation.mutate();}}><label className="block text-sm">Acknowledgement note (optional)<textarea className="cc-field mt-2" maxLength={2000} value={note} onChange={e=>setNote(e.target.value)} disabled={mutation.isPending}/></label>
 {mutation.isError&&<p role="alert" className="text-sm text-destructive">{mutation.error?.response?.data?.error||mutation.error?.message||'Unable to acknowledge this exception.'}</p>}
 <div className="flex flex-wrap justify-end gap-2"><Button type="button" variant="outline" disabled={mutation.isPending} onClick={()=>setOpen(false)}>Cancel</Button><Button type="submit" disabled={mutation.isPending}>{mutation.isPending?'Acknowledging…':'Acknowledge and exclude'}</Button></div></form>
 </DialogContent></Dialog></>;
}