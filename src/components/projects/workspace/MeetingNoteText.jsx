import React,{useState} from 'react';
import {useQueryClient} from '@tanstack/react-query';
import {Button} from '@/components/ui/button';
import {Textarea} from '@/components/ui/textarea';
import {meetingSessionRequest} from '@/components/projects/workspace/meetingSessionClient';
export default function MeetingNoteText({row,sessionId,editable}) {
 const cache=useQueryClient(),[draft,setDraft]=useState(null),[busy,setBusy]=useState(false),[error,setError]=useState('');
 const save=async event=>{event.preventDefault();setBusy(true);setError('');try{await meetingSessionRequest('editNote',sessionId,{noteId:row.id,note:draft});await Promise.all([cache.invalidateQueries({queryKey:['meeting-session-events']}),cache.invalidateQueries({queryKey:['project-meeting-history']})]);setDraft(null);}catch(e){setError(e.message);}finally{setBusy(false);}};
 if(!editable || draft===null)return <><p className="mt-2 whitespace-pre-wrap text-sm">{row.description}</p>{editable && <Button size="sm" variant="ghost" onClick={()=>{setError('');setDraft(row.description || '');}}>Edit note</Button>}</>;
 return <form className="mt-2 space-y-2" onSubmit={save}><Textarea aria-label="Meeting note" rows={4} maxLength={4000} value={draft} disabled={busy} onChange={e=>setDraft(e.target.value)}/>{error && <p role="alert" className="text-sm text-destructive">{error}</p>}<div className="flex gap-2"><Button size="sm" disabled={busy || !draft.trim()}>{busy ? 'Saving…' : 'Save note'}</Button><Button type="button" size="sm" variant="ghost" disabled={busy} onClick={()=>setDraft(null)}>Cancel</Button></div></form>;
}