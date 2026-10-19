import React,{useState} from 'react';
import {useQueryClient} from '@tanstack/react-query';
import {Sheet,SheetContent,SheetHeader,SheetTitle,SheetDescription} from '@/components/ui/sheet';
import {Button} from '@/components/ui/button';
import {ieCall} from '@/components/ie/ieClient';
import {IE_WORK_AREAS} from '@/components/ie/ieWorkConfig';
import IEWorkFields from '@/components/ie/IEWorkFields';
export default function IETaskDetail({item,engagement,canEdit,onClose}) {
 const cache=useQueryClient(),[value,setValue]=useState(item),[saving,setSaving]=useState(false),[error,setError]=useState('');
 const submit=async event=>{event.preventDefault();setSaving(true);setError('');try{await ieCall('workSave',{engagement_id:engagement.id,id:item.id,values:value});await cache.invalidateQueries({predicate:q=>String(q.queryKey[0]).startsWith('ie-')});onClose();}catch(err){setError(err.message);}finally{setSaving(false);}};
 return <Sheet open onOpenChange={open=>{if(!open&&!saving)onClose();}}><SheetContent className="w-full overflow-y-auto bg-card sm:max-w-xl"><SheetHeader className="mb-6 pr-8"><SheetTitle>Task details</SheetTitle><SheetDescription>{IE_WORK_AREAS[item.kind].title} · {engagement.name}</SheetDescription></SheetHeader><form onSubmit={submit} className="space-y-6"><fieldset disabled={!canEdit||saving}><IEWorkFields value={value} set={(key,val)=>setValue(old=>({...old,[key]:val}))} engagement={engagement} kind={item.kind}/></fieldset>{error&&<p role="alert" className="text-sm text-destructive">{error}</p>}<div className="flex justify-end gap-2"><Button type="button" variant="outline" disabled={saving} onClick={onClose}>Close</Button>{canEdit&&<Button type="submit" disabled={saving}>{saving?'Saving…':'Save changes'}</Button>}</div></form></SheetContent></Sheet>;
}