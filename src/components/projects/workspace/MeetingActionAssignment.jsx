import React,{useState} from 'react';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import MeetingPersonPicker from '@/components/projects/workspace/MeetingPersonPicker';
export default function MeetingActionAssignment({row,busy,onSave,onCancel}) {
 const [person,setPerson]=useState(row.owner_id ? {id:row.owner_id,name:row.owner || 'Assigned staff member'} : null),[due,setDue]=useState(row.due_date || '');
 return <form onSubmit={e=>{e.preventDefault();if(person)onSave({owner:person.name,owner_id:person.id,due_date:due || null});}} className="space-y-3 rounded-lg bg-muted p-3"><h4 className="text-sm font-medium">Assign follow-up action</h4><MeetingPersonPicker selected={person} disabled={busy} onSelect={setPerson}/><label className="block text-xs">Due date<Input type="date" disabled={busy} value={due} onChange={e=>setDue(e.target.value)}/></label><p className="text-xs text-muted-foreground">The action appears in the selected person’s ALSight task list; reassignment moves it from the previous owner.</p><div className="flex gap-2"><Button size="sm" disabled={busy || !person}>{busy ? 'Saving…' : 'Save assignment'}</Button><Button type="button" size="sm" variant="ghost" disabled={busy} onClick={onCancel}>Cancel</Button></div></form>;
}