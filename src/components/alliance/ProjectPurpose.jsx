import React,{useState} from 'react';
import {useAuth} from '@/lib/AuthContext';
import {useQueryClient} from '@tanstack/react-query';
import {Button} from '@/components/ui/button';
import AlliancePanel from '@/components/alliance/AlliancePanel';
import PurposeForm from '@/components/alliance/PurposeForm';
import {refreshAlliance} from '@/components/alliance/allianceClient';
export default function ProjectPurpose({project,onUpdated}) {
  const {user}=useAuth(),cache=useQueryClient(),[editing,setEditing]=useState(false);
  const canEdit=['admin','director','bdm'].includes(user?.role);
  return <AlliancePanel title="WHY THIS MATTERS" eyebrow="People • Place • Purpose" className="border-l-4 border-l-primary" action={canEdit && <Button variant="outline" size="sm" onClick={()=>setEditing(true)}>{project.why_this_matters ? 'Edit why this matters' : 'Add project purpose'}</Button>}>
    {project.why_this_matters ? <p className="max-w-5xl whitespace-pre-line break-words text-base leading-relaxed">{project.why_this_matters}</p> : <p className="text-sm text-muted-foreground">Why this matters hasn’t been captured yet.</p>}
    {!!project.impact_themes?.length && <div className="mt-4 flex flex-wrap gap-2">{project.impact_themes.map(theme=><span key={theme} className="rounded-full bg-primary/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wide">{theme}</span>)}</div>}
    {editing && <PurposeForm project={project} onClose={()=>setEditing(false)} onSaved={updated=>{onUpdated?.(updated);refreshAlliance(cache);cache.invalidateQueries({queryKey:['dashboard-data']});setEditing(false);}}/>}
  </AlliancePanel>;
}