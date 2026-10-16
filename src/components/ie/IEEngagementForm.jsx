import React,{useState} from 'react';
import {useQuery,useQueryClient} from '@tanstack/react-query';
import {useNavigate} from 'react-router-dom';
import {useAuth} from '@/lib/AuthContext';
import {ieCall} from '@/components/ie/ieClient';
import {Dialog,DialogContent,DialogHeader,DialogTitle,DialogDescription} from '@/components/ui/dialog';
import {Button} from '@/components/ui/button';
import IEIdentityFields from '@/components/ie/IEIdentityFields';
import IEScopeFields from '@/components/ie/IEScopeFields';
import IETeamFields from '@/components/ie/IETeamFields';
import IELifecycleFields from '@/components/ie/IELifecycleFields';
export default function IEEngagementForm({item,onClose}){
 const {user}=useAuth(),cache=useQueryClient(),navigate=useNavigate();
 const [value,setValue]=useState(item||{name:'',owner_id:user.role==='sam'?user.id:'',client_id:'',service:'engagement',status:'scoping',priority:'normal',sites:[],team_ids:[]}),[labels,setLabels]=useState({client:item?.client_name||'',project:item?.project_name||'',opportunity:item?.opportunity_name||''}),[reason,setReason]=useState(''),[saving,setSaving]=useState(false),[error,setError]=useState('');
 const types=useQuery({queryKey:['ie-classifications',user.id],queryFn:()=>ieCall('classifications'),staleTime:60000,retry:false});
 const set=(key,val)=>setValue(old=>({...old,...(typeof key==='object'?key:{[key]:val})}));
 const submit=async event=>{event.preventDefault();setError('');setSaving(true);try{const result=await ieCall('save',{id:item?.id,revision:item?.revision,values:value,reason});await cache.invalidateQueries({predicate:q=>String(q.queryKey[0]).startsWith('ie-')});onClose();navigate(`/insights-engagement/${result.item.id}`);}catch(failure){setError(failure.message);}finally{setSaving(false);}};
 return <Dialog open onOpenChange={open=>{if(!open&&!saving)onClose();}}><DialogContent className="max-h-[90dvh] max-w-3xl overflow-y-auto bg-card"><DialogHeader><DialogTitle>{item?'Edit engagement':'New I&E engagement'}</DialogTitle><DialogDescription>Standalone work is welcome. Project and opportunity links are optional.</DialogDescription></DialogHeader><form className="space-y-6" onSubmit={submit}><IEIdentityFields value={value} set={set} labels={labels} setLabels={setLabels}/><IETeamFields value={value} set={set} editing={!!item}/>{types.error&&<p role="alert" className="text-sm text-destructive">{types.error.message}</p>}<IEScopeFields value={value} set={set} classifications={types.data?.items||[]}/><IELifecycleFields value={value} set={set} previous={item} reason={reason} setReason={setReason}/>{error&&<p role="alert" className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}<div className="flex justify-end gap-2"><Button type="button" variant="outline" disabled={saving} onClick={onClose}>Cancel</Button><Button disabled={saving||types.isPending||!value.client_id||!value.owner_id}>{saving?'Saving…':item?'Save changes':'Create engagement'}</Button></div></form></DialogContent></Dialog>;
}