import React,{useState} from 'react';
import {useAuth} from '@/lib/AuthContext';
import {useQueryClient} from '@tanstack/react-query';
import {Button} from '@/components/ui/button';
import AlliancePanel from '@/components/alliance/AlliancePanel';
import PurposeForm from '@/components/alliance/PurposeForm';
import PurposeText from '@/components/alliance/PurposeText';
import {Sparkles} from 'lucide-react';
import {refreshAlliance} from '@/components/alliance/allianceClient';
export default function ProjectPurpose({project,onUpdated}) {
  const {user}=useAuth(),cache=useQueryClient(),[editing,setEditing]=useState(false);
  const canEdit=['admin','director','bdm'].includes(user?.role);
  return <AlliancePanel title="WHY THIS MATTERS" eyebrow="People • Place • Purpose" className="border-l-4 border-l-primary" action={canEdit && <div className="flex flex-wrap gap-2"><Button variant="secondary" size="sm" onClick={()=>setEditing('research')}><Sparkles/>ALICE research</Button><Button variant="outline" size="sm" onClick={()=>setEditing('manual')}>{project.why_this_matters ? 'Edit purpose' : 'Add your own purpose'}</Button></div>}>
    {project.why_this_matters ? <PurposeText text={project.why_this_matters}/> : <p className="text-sm text-muted-foreground">Why this matters hasn’t been captured yet.</p>}
    {!!project.impact_themes?.length && <div className="mt-4 flex flex-wrap gap-2">{project.impact_themes.map(theme=><span key={theme} className="rounded-full bg-primary/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wide">{theme}</span>)}</div>}
    {editing && <PurposeForm project={project} startResearch={editing==='research'} onClose={()=>setEditing(false)} onSaved={updated=>{onUpdated?.(updated);refreshAlliance(cache);cache.invalidateQueries({queryKey:['dashboard-data']});setEditing(false);}}/>}
  </AlliancePanel>;
}