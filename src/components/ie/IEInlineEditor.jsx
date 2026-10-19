import React,{useEffect,useRef,useState} from 'react';
import {useQuery,useQueryClient} from '@tanstack/react-query';
import {useAuth} from '@/lib/AuthContext';
import {ieCall} from '@/components/ie/ieClient';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import IEInlineFields from '@/components/ie/IEInlineFields';
export default function IEInlineEditor({section,field,item,onClose}){
 const container=useRef(null);
 const {user}=useAuth(),cache=useQueryClient(),[original]=useState(item);
 const [value,setValue]=useState(item),[reason,setReason]=useState(''),[saving,setSaving]=useState(false),[error,setError]=useState('');
 const needsTypes=field?(Array.isArray(field)?field:[field]).some(key=>['product_id','support_type_id'].includes(key)):['summary','information'].includes(section);
 const types=useQuery({queryKey:['ie-classifications',user.id],queryFn:()=>ieCall('classifications'),enabled:needsTypes,staleTime:60000,retry:false});
 useEffect(()=>{container.current?.querySelector('input:not(:disabled),textarea:not(:disabled),select:not(:disabled),[role="combobox"]')?.focus();},[types.isPending,field]);
 const set=(key,val)=>setValue(old=>({...old,...(typeof key==='object'?key:{[key]:val})}));
 const submit=async event=>{event.preventDefault();setError('');setSaving(true);try{const result=await ieCall('save',{id:original.id,revision:original.revision,values:value,reason});cache.setQueriesData({queryKey:['ie-detail',original.id]},old=>old?{...old,item:result.item}:old);await cache.invalidateQueries({predicate:query=>String(query.queryKey[0]).startsWith('ie-')});onClose();}catch(failure){setError(failure.message);}finally{setSaving(false);}};
 return <form ref={container} onSubmit={submit} className="space-y-4" aria-label={`Edit ${field || section}`}>
  <fieldset disabled={saving} className="min-w-0 space-y-4">
   {needsTypes&&types.isPending?<p role="status" className="text-sm text-muted-foreground">Loading products…</p>:needsTypes&&types.error?<p role="alert" className="text-sm text-destructive">{types.error.message}</p>:<IEInlineFields section={section} field={field} value={value} set={set} previous={original} classifications={types.data?.items||[]} reason={reason} setReason={setReason}/>}
   {section!=='dates'&&field!=='completion_date'&&value.status==='completed'&&(!original.completion_date||original.status!=='completed')&&<label className="block space-y-1 text-xs font-semibold">Actual completion *<Input type="date" required value={value.completion_date||''} onChange={event=>set('completion_date',event.target.value)}/></label>}
   {error&&<p role="alert" className="text-sm text-destructive">{error}</p>}
   <div className="flex flex-wrap gap-2"><Button type="submit" size="sm" disabled={saving||(needsTypes&&(types.isPending||!!types.error))}>{saving?'Saving…':'Save changes'}</Button><Button type="button" size="sm" variant="outline" onClick={onClose}>Cancel</Button></div>
  </fieldset>
 </form>;
}