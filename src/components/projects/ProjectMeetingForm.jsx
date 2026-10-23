import React,{useContext,useEffect,useState} from 'react';
import {useQueryClient} from '@tanstack/react-query';
import {base44} from '@/api/base44Client';
import {Button} from '@/components/ui/button';
import {formInputClass} from '@/components/forms/PowerForm';
import PathwayWorkContext from '@/components/delivery/PathwayWorkContext';
export default function ProjectMeetingForm({project,user}) {
 const cache=useQueryClient(),work=useContext(PathwayWorkContext);
 const [form,setForm]=useState({kind:'progress',subject:'',occurred_at:'',participants:'',description:''}),[busy,setBusy]=useState(false),[error,setError]=useState('');
 useEffect(()=>{if(work?.request?.meetingKind){setForm(previous=>({...previous,kind:work.request.meetingKind,subject:work.request.label}));work.handled();}},[work?.request]);
 const field=(name,value)=>setForm(previous=>({...previous,[name]:value}));
 const save=async event=>{event.preventDefault();setBusy(true);setError('');try{
  const date=new Date(form.occurred_at);if(!Number.isFinite(date.getTime())||date.getTime()>Date.now())throw new Error('Record a meeting that has already taken place.');
  await base44.entities.CRMActivity.create({project_id:project.id,account_id:project.client_account_id||'',type:'project_meeting',next_action:`bms_meeting_${form.kind}`,subject:form.subject.trim(),occurred_at:date.toISOString(),participants:form.participants.trim(),description:form.description.trim(),author_id:user.id,author_name:user.full_name||user.email,owner_id:user.id,line_manager_id:user.data?.line_manager_id||user.line_manager_id||'',meeting_member_ids:[user.id]});
  setForm(previous=>({...previous,subject:'',description:'',participants:'',occurred_at:''}));
  await Promise.all([cache.invalidateQueries({queryKey:['project-meetings',project.id]}),cache.invalidateQueries({queryKey:['project-meeting-history',project.id]}),cache.invalidateQueries({queryKey:['pathway-bms',project.id]})]);
 }catch(err){setError(err.message);}finally{setBusy(false);}};
 return <form onSubmit={save} className="space-y-3"><fieldset disabled={busy} className="grid gap-3 sm:grid-cols-2">
  <label className="space-y-1 text-xs font-medium">Meeting purpose<select className={formInputClass} value={form.kind} onChange={e=>field('kind',e.target.value)}><option value="progress">Project / progress meeting</option><option value="handover">Client handover meeting</option><option value="post_review">Post-project review</option></select></label>
  <label className="space-y-1 text-xs font-medium">Held on<input required type="datetime-local" className={formInputClass} value={form.occurred_at} onChange={e=>field('occurred_at',e.target.value)}/></label>
  <label className="space-y-1 text-xs font-medium sm:col-span-2">Meeting title<input required maxLength={200} className={formInputClass} value={form.subject} onChange={e=>field('subject',e.target.value)}/></label>
  <label className="space-y-1 text-xs font-medium sm:col-span-2">Attendees<input required maxLength={1500} className={formInputClass} value={form.participants} onChange={e=>field('participants',e.target.value)}/></label>
  <label className="space-y-1 text-xs font-medium sm:col-span-2">Minutes / outcomes<textarea required maxLength={4000} rows={4} className="w-full rounded-md border border-input bg-card p-3 text-sm" value={form.description} onChange={e=>field('description',e.target.value)}/></label>
  <div className="sm:col-span-2"><Button type="submit" disabled={busy||!form.subject.trim()||!form.participants.trim()||!form.description.trim()}>{busy?'Recording…':'Record meeting'}</Button></div>
 </fieldset><p className="text-xs text-muted-foreground">Saved in existing project activity. Existing activity access applies. Record follow-up actions in Act and formal approvals in Decide; minutes alone do not approve a gateway.</p>{error&&<p role="alert" className="text-sm text-destructive">{error}</p>}</form>;
}