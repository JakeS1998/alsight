import React from 'react';
import {Input} from '@/components/ui/input';
import {Textarea} from '@/components/ui/textarea';
import {IE_WORK_AREAS,IE_WORK_STATUS} from '@/components/ie/ieWorkConfig';
export default function IEWorkFields({value,set,engagement,kind}){
 const config=IE_WORK_AREAS[kind],people=[...(engagement.owner_id?[{id:engagement.owner_id,name:engagement.owner_name}]:[]),...(engagement.team||[])];
 const selectClass='flex h-9 w-full rounded-md border border-input bg-card px-3 text-sm';
 return <div className="grid gap-4 sm:grid-cols-2">
  <label className="space-y-2 text-sm sm:col-span-2"><span>Title</span><Input required maxLength={200} value={value.title} onChange={e=>set('title',e.target.value)}/></label>
  <label className="space-y-2 text-sm"><span>{config.typeLabel}</span><Input maxLength={100} value={value.work_type||''} onChange={e=>set('work_type',e.target.value)}/></label>
  <label className="space-y-2 text-sm"><span>Status</span><select className={selectClass} value={value.status} onChange={e=>set('status',e.target.value)}>{Object.entries(IE_WORK_STATUS).map(([id,label])=><option key={id} value={id}>{label}</option>)}</select></label>
  <label className="space-y-2 text-sm"><span>Owner</span><select className={selectClass} value={value.owner_id||''} onChange={e=>set('owner_id',e.target.value)}><option value="">Unassigned</option>{people.map((p,i)=><option key={`${p.id}:${i}`} value={p.id}>{p.name}</option>)}</select></label>
  <label className="space-y-2 text-sm"><span>Due date</span><Input type="date" value={value.due_date||''} onChange={e=>set('due_date',e.target.value)}/></label>
  {kind==='consultation'&&<>
   <label className="space-y-2 text-sm"><span>Activity date</span><Input type="date" value={value.held_on||''} onChange={e=>set('held_on',e.target.value)}/></label>
   <label className="space-y-2 text-sm"><span>Audience</span><Input maxLength={250} value={value.audience||''} onChange={e=>set('audience',e.target.value)}/></label>
   {['attendees','stakeholders','survey_responses'].map(key=><label key={key} className="space-y-2 text-sm"><span>{key==='survey_responses'?'Survey responses':key==='stakeholders'?'Key stakeholders':'Attendees'}</span><Input type="number" min="0" step="1" value={value[key]??''} onChange={e=>set(key,e.target.value===''?null:Number(e.target.value))}/></label>)}
  </>}
  <label className="space-y-2 text-sm sm:col-span-2"><span>{config.notesLabel}</span><Textarea rows={5} maxLength={4000} value={value.notes||''} onChange={e=>set('notes',e.target.value)}/></label>
 </div>;
}