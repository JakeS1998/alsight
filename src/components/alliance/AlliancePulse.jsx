import React,{useState} from 'react';
import {Button} from '@/components/ui/button';
import PulseForm from '@/components/alliance/PulseForm';
import PulseComposer from '@/components/alliance/PulseComposer';
import PulsePost from '@/components/alliance/PulsePost';
import allianceRequest,{allianceError} from '@/components/alliance/allianceClient';
export default function AlliancePulse({data,user,onRefresh,onMore,loadingMore,hasMore}) {
  const [adding,setAdding]=useState(false),[error,setError]=useState(''),[removing,setRemoving]=useState(false);
  const remove=async item=>{if(!window.confirm('Remove this Alliance update from Pulse and Stories?')) return;setRemoving(true);setError('');try{await allianceRequest('remove',{kind:'pulse',id:item.id});onRefresh();}catch(e){setError(allianceError(e));}finally{setRemoving(false);}};
  const events=[...(data.pulse || []),...(data.milestones || []).map(p=>({id:`completion-${p.id}`,type:'Completion',title:`${p.name} · practical completion recorded`,summary:'The recorded practical completion date has been reached.',created_date:p.practical_completion_date,href:`/projects/${p.id}?tab=general`,system:true})),...(data.lessons || []).map(l=>({id:`knowledge-${l.id}`,type:'Knowledge',title:`Learning from ${l.project_name}`,summary:l.what_happened,created_date:l.created_date,href:l.href,author_name:l.author_name,system:true}))].sort((a,b)=>new Date(b.created_date)-new Date(a.created_date));
  return <section aria-label="Alliance update feed" className="min-w-0 space-y-4">
    <PulseComposer user={user} onAdd={()=>setAdding(true)}/>
    <header className="flex items-center justify-between border-b border-border px-1 pb-3"><h2 className="text-sm font-bold">Latest updates</h2><span className="text-xs text-muted-foreground">Across Alliance</span></header>
    {error && <p role="alert" className="rounded-panel border border-border bg-card p-4 text-sm text-destructive">{error}</p>}
    <div className={removing ? 'pointer-events-none space-y-4 opacity-60' : 'space-y-4'}>{events.map(item=><PulsePost key={item.id} item={item} user={user} onRemove={remove} removing={removing}/>)}{!events.length && <div className="rounded-panel border border-border bg-card p-8 text-center"><h3 className="font-heading text-base font-bold">Start the conversation</h3><p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">No Alliance moments have been shared yet. Add a real project milestone, team update or recognition.</p><Button size="sm" className="mt-5" onClick={()=>setAdding(true)}>Share the first update</Button></div>}</div>
    {hasMore && <Button variant="outline" className="w-full" disabled={loadingMore} onClick={onMore}>{loadingMore ? 'Loading…' : 'More updates'}</Button>}
    {adding && <PulseForm onClose={()=>setAdding(false)} onSaved={()=>{setAdding(false);onRefresh();}}/>}
  </section>;
}