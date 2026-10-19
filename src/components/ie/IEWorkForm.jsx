import React,{useState} from 'react';
import {useQueryClient} from '@tanstack/react-query';
import {Dialog,DialogContent,DialogHeader,DialogTitle,DialogDescription} from '@/components/forms/form-dialog';
import {Button} from '@/components/ui/button';
import {ieCall} from '@/components/ie/ieClient';
import {IE_WORK_AREAS} from '@/components/ie/ieWorkConfig';
import IEWorkFields from '@/components/ie/IEWorkFields';
export default function IEWorkForm({engagement,kind,item,onClose}){
 const cache=useQueryClient(),[value,setValue]=useState(item||{kind,title:'',status:'planned',owner_id:engagement.owner_id||''}),[saving,setSaving]=useState(false),[error,setError]=useState('');
 const set=(key,val)=>setValue(old=>({...old,[key]:val}));
 const submit=async event=>{event.preventDefault();setSaving(true);setError('');try{await ieCall('workSave',{engagement_id:engagement.id,id:item?.id,values:{...value,kind}});await cache.invalidateQueries({predicate:q=>String(q.queryKey[0]).startsWith('ie-')});onClose();}catch(err){setError(err.message);}finally{setSaving(false);}};
 return <Dialog open onOpenChange={open=>{if(!open&&!saving)onClose();}}><DialogContent className="max-h-[90dvh] max-w-2xl overflow-y-auto"><DialogHeader><DialogTitle>{item?'Edit':'Add'} {IE_WORK_AREAS[kind].singular}</DialogTitle><DialogDescription>Saved to this engagement in ALSight.</DialogDescription></DialogHeader><form onSubmit={submit} className="space-y-5"><fieldset disabled={saving}><IEWorkFields value={value} set={set} engagement={engagement} kind={kind}/></fieldset>{error&&<p role="alert" className="text-sm text-destructive">{error}</p>}<div className="flex justify-end gap-2"><Button type="button" variant="outline" disabled={saving} onClick={onClose}>Cancel</Button><Button disabled={saving}>{saving?'Saving…':'Save'}</Button></div></form></DialogContent></Dialog>;
}