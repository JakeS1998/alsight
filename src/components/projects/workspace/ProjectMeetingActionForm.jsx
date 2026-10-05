import React,{useState,useContext} from 'react';
import MeetingOperationContext from '@/components/projects/workspace/MeetingOperationContext';
import {base44} from '@/api/base44Client';
import ActionOwnerInput from '@/components/delivery/ActionOwnerInput';
import {Input} from '@/components/ui/input';
import {Textarea} from '@/components/ui/textarea';
import {Button} from '@/components/ui/button';
export default function ProjectMeetingActionForm({project,onCreated}) {
 const operation=useContext(MeetingOperationContext);
 const [form,setForm]=useState({action:'',owner:'',owner_id:'',due_date:'',comments:''}),[busy,setBusy]=useState(false),[error,setError]=useState('');
 const set=(key,value)=>setForm(f=>({...f,[key]:value}));
 const save=async e=>{e.preventDefault();setBusy(true);setError('');operation.begin();try {
  const row=await base44.entities.ProjectAction.create({...form,action:form.action.trim(),due_date:form.due_date || null,project_id:project.id,client_account_id:project.client_account_id || null,bdm_aad_id:project.bdm_aad_id || null,status:'open',priority:'medium'});
  setForm({action:'',owner:'',owner_id:'',due_date:'',comments:''});await onCreated(row);window.dispatchEvent(new Event('alsight-tasks-changed'));
 }catch(e){setError(e.message);}finally{setBusy(false);operation.finish();}};
 return <form onSubmit={save} className="space-y-3 rounded-xl border border-border bg-muted p-4"><h3 className="text-sm font-semibold">Create action</h3><label className="block text-xs">Action<Input required maxLength={1000} value={form.action} onChange={e=>set('action',e.target.value)}/></label><label className="block text-xs">Owner<ActionOwnerInput value={form.owner} onChange={(owner,owner_id)=>setForm(f=>({...f,owner,owner_id}))}/></label><label className="block text-xs">Due date<Input type="date" value={form.due_date} onChange={e=>set('due_date',e.target.value)}/></label><label className="block text-xs">Short action note<Textarea rows={2} maxLength={2000} value={form.comments} onChange={e=>set('comments',e.target.value)}/></label>{error && <p role="alert" className="text-sm text-destructive">{error}</p>}<Button size="sm" disabled={busy || !form.action.trim() || (form.owner.trim() && !form.owner.trim().includes(' '))}>{busy ? 'Saving…' : 'Create action'}</Button></form>;
}