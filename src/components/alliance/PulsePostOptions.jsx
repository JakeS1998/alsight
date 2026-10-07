import React from 'react';
import {Input} from '@/components/ui/input';
import PulseRecordPicker from '@/components/alliance/PulseRecordPicker';

export default function PulsePostOptions({value,setValue,groupId}) {
  const set=(key,text)=>setValue(current=>({...current,[key]:text}));
  return <div className="space-y-4 rounded-lg bg-muted p-4">
    <label className="block text-xs font-semibold">Heading (optional)<Input className="mt-1 bg-card" value={value.title} maxLength={200} placeholder="Add a heading if your post needs one" onChange={e=>set('title',e.target.value)}/></label>
    <label className="block text-xs font-semibold">Link a record<select className="mt-1 w-full rounded-md border border-input bg-card p-2 text-sm" value={value.related_entity_type} onChange={e=>setValue(current=>({...current,related_entity_type:e.target.value,related_entity_id:''}))}><option value="none">No linked record</option><option value="project">Project / project impact</option><option value="person">Person</option><option value="lesson">Lesson</option></select></label>
    {value.related_entity_type!=='none' && <PulseRecordPicker key={value.related_entity_type} kind={value.related_entity_type} value={value.related_entity_id} onChange={id=>set('related_entity_id',id)}/>}
    {!groupId && <div className="space-y-1"><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={value.is_story} onChange={e=>set('is_story',e.target.checked)}/>Feature in Alliance Stories</label><p className="text-xs text-muted-foreground">Stories must link to an existing ALSight record. Visibility follows its access permissions.</p></div>}
  </div>;
}