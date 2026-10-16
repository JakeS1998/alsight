import React,{useState} from 'react';
import {useQueryClient} from '@tanstack/react-query';
import {ieCall} from '@/components/ie/ieClient';
import {Dialog,DialogContent,DialogHeader,DialogTitle,DialogDescription} from '@/components/ui/dialog';
import {Input} from '@/components/ui/input';
import {Textarea} from '@/components/ui/textarea';
import {Button} from '@/components/ui/button';
import {IE_PAYMENT_TYPES} from '@/components/ie/ieWorkConfig';
export default function IEFinanceForm({engagementId,item,onClose}){
 const cache=useQueryClient(),[value,setValue]=useState(item||{engagement_value:null,invoiced:null,added_value:null,payment_type:'',notes:''}),[saving,setSaving]=useState(false),[error,setError]=useState('');
 const set=(key,val)=>setValue(old=>({...old,[key]:val}));
 const submit=async event=>{event.preventDefault();setSaving(true);setError('');try{await ieCall('financeSave',{engagement_id:engagementId,values:value});await cache.invalidateQueries({predicate:q=>String(q.queryKey[0]).startsWith('ie-')});onClose();}catch(err){setError(err.message);}finally{setSaving(false);}};
 return <Dialog open onOpenChange={open=>{if(!open&&!saving)onClose();}}><DialogContent className="max-h-[90dvh] overflow-y-auto"><DialogHeader><DialogTitle>Edit engagement finance</DialogTitle><DialogDescription>Record GBP totals excluding VAT. Blank means not recorded; zero means a confirmed £0.</DialogDescription></DialogHeader><form onSubmit={submit} className="space-y-5"><fieldset disabled={saving} className="space-y-4">
 {Object.entries({engagement_value:'Engagement value (£)',invoiced:'Invoiced total (£)',added_value:'Added value / FOC (£)'}).map(([key,label])=><label key={key} className="block space-y-2 text-sm"><span>{label}</span><Input type="number" min="0" max="1000000000000" step="0.01" value={value[key]??''} onChange={e=>set(key,e.target.value===''?null:Number(e.target.value))}/></label>)}
 <label className="block space-y-2 text-sm"><span>Payment arrangement</span><select className="h-9 w-full rounded-md border border-input bg-card px-3 text-sm" value={value.payment_type||''} onChange={e=>set('payment_type',e.target.value)}>{Object.entries(IE_PAYMENT_TYPES).map(([key,label])=><option key={key} value={key}>{label}</option>)}</select></label>
 <label className="block space-y-2 text-sm"><span>Finance notes</span><Textarea rows={5} maxLength={4000} value={value.notes||''} onChange={e=>set('notes',e.target.value)}/></label></fieldset>{error&&<p role="alert" className="text-sm text-destructive">{error}</p>}<div className="flex justify-end gap-2"><Button type="button" variant="outline" disabled={saving} onClick={onClose}>Cancel</Button><Button disabled={saving}>{saving?'Saving…':'Save finance'}</Button></div></form></DialogContent></Dialog>;
}