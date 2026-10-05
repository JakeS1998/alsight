import React,{useState,useContext} from 'react';
import MeetingOperationContext from '@/components/projects/workspace/MeetingOperationContext';
import {useQueryClient} from '@tanstack/react-query';
import {base44} from '@/api/base44Client';
import {Button} from '@/components/ui/button';
import {Textarea} from '@/components/ui/textarea';
import ProjectActivityHistory from '@/components/projects/workspace/ProjectActivityHistory';
export default function ProjectMeetingNotes({project,user,session,sessionKey,onRecord}) {
 const operation=useContext(MeetingOperationContext);
 const cache=useQueryClient(),[note,setNote]=useState(''),[busy,setBusy]=useState(false),[error,setError]=useState(''),canWrite=['admin','director','bdm','bsm'].includes(user.role);
 const save=async e=>{e.preventDefault();setBusy(true);setError('');operation.begin();try{
  await base44.entities.CRMActivity.create({project_id:project.id,account_id:project.client_account_id || '',type:'project_meeting',subject:`Project meeting note · ${project.name}`,description:note.trim(),occurred_at:new Date().toISOString(),author_id:user.id,author_name:user.full_name || user.email,owner_id:session?.owner_id || user.id,line_manager_id:session?.line_manager_id || user.data?.line_manager_id || user.line_manager_id || '',meeting_member_ids:session?.meeting_member_ids || [user.id],key_points:sessionKey,next_action:'meeting_note'});
  setNote('');await onRecord('notes');cache.invalidateQueries({queryKey:['project-meeting-history',project.id]});cache.invalidateQueries({queryKey:['meeting-overview',project.id]});
 }catch(e){setError(e.message);}finally{setBusy(false);operation.finish();}};
 return <div className="space-y-5">{canWrite && <form onSubmit={save} className="space-y-3"><label className="block text-sm font-medium">Meeting Note / Project Comment<Textarea rows={3} maxLength={4000} value={note} onChange={e=>setNote(e.target.value)} placeholder="Record a decision, update or follow-up…"/></label><p className="text-xs text-muted-foreground">Saved to existing project activity with your name, timestamp and review-session reference. Existing activity permissions apply.</p>{error && <p role="alert" className="text-sm text-destructive">{error}</p>}<Button size="sm" disabled={busy || !note.trim()}>{busy ? 'Saving…' : 'Add note'}</Button></form>}<ProjectActivityHistory project={project} user={user}/></div>;
}