import React,{useState} from 'react';
import PulseMentionInput from '@/components/alliance/PulseMentionInput';
import {PULSE_TYPES} from '@/components/alliance/allianceOptions';
import {Button} from '@/components/ui/button';
import {ChevronDown} from 'lucide-react';
import PulsePostOptions from '@/components/alliance/PulsePostOptions';
import PulseImageUpload from '@/components/alliance/PulseImageUpload';
import allianceRequest,{allianceError} from '@/components/alliance/allianceClient';
export default function PulseForm({onSaved,groupId=''}) {
  const initial={type:'Social',title:'',summary:'',mentions:[],images:[],related_entity_type:'none',related_entity_id:'',is_story:false};
  const [value,setValue]=useState(initial),[saving,setSaving]=useState(false),[uploading,setUploading]=useState(false),[error,setError]=useState(''),[optionsOpen,setOptionsOpen]=useState(false);
  const set=(key,text)=>setValue(current=>({...current,[key]:text}));
  const submit=async e=>{e.preventDefault();if(uploading || saving || !value.summary.trim()) return;if(value.related_entity_type!=='none' && !value.related_entity_id){setOptionsOpen(true);setError('Choose a record to link to your post.');return;}if(value.is_story && value.related_entity_type==='none'){setOptionsOpen(true);setError('Link a record to feature this post in Alliance Stories.');return;}setSaving(true);setError('');try{const title=value.title.trim() || value.summary.trim().split('\n')[0].slice(0,200);await allianceRequest('pulseAdd',{item:{...value,title,group_id:groupId}});setValue(initial);setOptionsOpen(false);onSaved();}catch(e){setError(allianceError(e));}finally{setSaving(false);}};
  return <form onSubmit={submit} className="space-y-3"><fieldset disabled={saving} className="min-w-0 space-y-3">
    <label className="flex flex-wrap items-center gap-3 text-xs font-semibold">Post category<select className="rounded-md border border-input bg-card px-3 py-2 text-sm" value={value.type} onChange={event=>set('type',event.target.value)}>{PULSE_TYPES.map(type=><option key={type}>{type}</option>)}</select></label>
    <PulseMentionInput value={value} setValue={setValue} groupId={groupId}/>
    <div className="flex items-center justify-between text-xs text-muted-foreground"><span>Type @ to mention a colleague or add #hashtags.</span>{!!value.summary.length && <span>{value.summary.length}/1500</span>}</div>
    <div className="border-t border-border pt-3"><PulseImageUpload compact images={value.images} onChange={images=>set('images',images)} onBusyChange={setUploading} disabled={saving}/></div>
    <button type="button" aria-expanded={optionsOpen} aria-controls="pulse-post-options" className="flex items-center gap-2 rounded-md py-2 text-xs font-semibold text-muted-foreground hover:text-foreground" onClick={()=>setOptionsOpen(open=>!open)}>Post options<ChevronDown className={`h-4 w-4 ${optionsOpen ? 'rotate-180' : ''}`}/></button>
    {optionsOpen && <div id="pulse-post-options"><PulsePostOptions value={value} setValue={setValue} groupId={groupId}/></div>}
    {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
    <div className="flex items-center justify-end gap-2 border-t border-border pt-3"><Button type="button" disabled={saving || uploading} variant="ghost" onClick={()=>{setValue(initial);setError('');setOptionsOpen(false);}}>Clear</Button><Button className="min-w-28" disabled={saving || uploading || !value.summary.trim()}>{saving ? 'Posting…' : uploading ? 'Uploading…' : 'Post'}</Button></div>
  </fieldset></form>;
}