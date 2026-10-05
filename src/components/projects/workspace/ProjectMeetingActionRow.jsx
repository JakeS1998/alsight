import React,{useState,useContext} from 'react';
import MeetingOperationContext from '@/components/projects/workspace/MeetingOperationContext';
import {base44} from '@/api/base44Client';
import {Button} from '@/components/ui/button';
import {Textarea} from '@/components/ui/textarea';
import {formatDate} from '@/lib/portal';
export default function ProjectMeetingActionRow({row,canEdit,onChanged}) {
 const operation=useContext(MeetingOperationContext);
 const [busy,setBusy]=useState(false),[error,setError]=useState(''),[edit,setEdit]=useState(false),[note,setNote]=useState(row.comments||'');
 const update=async data=>{setBusy(true);setError('');operation.begin();try{await base44.entities.ProjectAction.update(row.id,data);setEdit(false);await onChanged(data.status==='done' ? 'completed' : null,row);window.dispatchEvent(new Event('alsight-tasks-changed'));}catch(e){setError(e.message);}finally{setBusy(false);operation.finish();}};
 const overdue=row.due_date && row.due_date.slice(0,10)<new Date().toLocaleDateString('en-CA');
 return <article className="space-y-2 rounded-xl border border-border p-3"><h3 className="text-sm font-medium">{row.action}</h3><p className="text-xs text-muted-foreground">{row.owner || 'Unassigned'} · Due {formatDate(row.due_date)} · {row.status.replaceAll('_',' ')}{overdue && <span className="ml-2 text-destructive">Overdue</span>}</p>{row.comments && !edit && <p className="whitespace-pre-wrap text-sm text-muted-foreground">{row.comments}</p>}{canEdit && <div className="flex gap-2"><Button size="sm" variant="outline" disabled={busy} onClick={()=>update({status:'done'})}>Mark complete</Button><Button size="sm" variant="ghost" disabled={busy} onClick={()=>setEdit(!edit)}>Action note</Button></div>}{edit && <form onSubmit={e=>{e.preventDefault();update({comments:note});}} className="space-y-2"><Textarea aria-label="Short action note" rows={2} maxLength={2000} value={note} onChange={e=>setNote(e.target.value)}/><Button size="sm" disabled={busy}>Save note</Button></form>}{error && <p role="alert" className="text-sm text-destructive">{error}</p>}</article>;
}