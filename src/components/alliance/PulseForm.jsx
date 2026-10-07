import React,{useState} from 'react';
import {Textarea} from '@/components/ui/textarea';
import {Button} from '@/components/ui/button';
import {ChevronDown} from 'lucide-react';
import PulsePostOptions from '@/components/alliance/PulsePostOptions';
import PulseImageUpload from '@/components/alliance/PulseImageUpload';
import allianceRequest,{allianceError} from '@/components/alliance/allianceClient';
export default function PulseForm({onSaved,groupId=''}) {
  const initial={type:'Team news',title:'',summary:'',images:[],related_entity_type:'none',related_entity_id:'',is_story:false};
  const [value,setValue]=useState(initial),[saving,setSaving]=useState(false),[uploading,setUploading]=useState(false),[error,setError]=useState(''),[optionsOpen,setOptionsOpen]=useState(false);
  const set=(key,text)=>setValue(current=>({...current,[key]:text}));
  const submit=async e=>{e.preventDefault();if(uploading || saving || !value.summary.trim()) return;if(value.related_entity_type!=='none' && !value.related_entity_id){setOptionsOpen(true);setError('Choose a record to link to your post.');return;}if(value.is_story && value.related_entity_type==='none'){setOptionsOpen(true);setError('Link a record to feature this post in Alliance Stories.');return;}setSaving(true);setError('');try{const title=value.title.trim() || value.summary.trim().split('\n')[0].slice(0,200);await allianceRequest('pulseAdd',{item:{...value,title,group_id:groupId}});setValue(initial);setOptionsOpen(false);onSaved();}catch(e){setError(allianceError(e));}finally{setSaving(false);}};
  return <form onSubmit={submit} className="space-y-3"><fieldset disabled={saving} className="min-w-0 space-y-3">
    <Textarea id="pulse-update-text" aria-label="Write your post" className="min-h-36 resize-y border-0 bg-transparent px-0 py-3 text-base shadow-none placeholder:text-muted-foreground focus-visible:ring-0 md:text-lg" value={value.summary} required maxLength={1500} onChange={e=>set('summary',e.target.value)} placeholder="What’s on your mind? Share a moment, celebrate someone, or tell us what’s happening…"/>
    <div className="flex items-center justify-between text-xs text-muted-foreground"><span>Add #hashtags to connect your post.</span>{!!value.summary.length && <span>{value.summary.length}/1500</span>}</div>
    <div className="border-t border-border pt-3"><PulseImageUpload compact images={value.images} onChange={images=>set('images',images)} onBusyChange={setUploading} disabled={saving}/></div>
    <button type="button" aria-expanded={optionsOpen} aria-controls="pulse-post-options" className="flex items-center gap-2 rounded-md py-2 text-xs font-semibold text-muted-foreground hover:text-foreground" onClick={()=>setOptionsOpen(open=>!open)}>Post options<ChevronDown className={`h-4 w-4 ${optionsOpen ? 'rotate-180' : ''}`}/></button>
    {optionsOpen && <div id="pulse-post-options"><PulsePostOptions value={value} setValue={setValue} groupId={groupId}/></div>}
    {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
    <div className="flex items-center justify-end gap-2 border-t border-border pt-3"><Button type="button" disabled={saving || uploading} variant="ghost" onClick={()=>{setValue(initial);setError('');setOptionsOpen(false);}}>Clear</Button><Button className="min-w-28" disabled={saving || uploading || !value.summary.trim()}>{saving ? 'Posting…' : uploading ? 'Uploading…' : 'Post'}</Button></div>
  </fieldset></form>;
}