import React from 'react';
import {UserRound} from 'lucide-react';
import IEEditablePanel from '@/components/ie/IEEditablePanel';

export default function IEEngagementTeam({item,canEdit}){
 const people=[{id:'owner',name:item.owner_name||'Unassigned',role:'Engagement owner',assigned:!!item.owner_id},...(item.team||[]).map(person=>({...person,role:'Team member',assigned:true}))];
 return <IEEditablePanel title="Team & responsibilities" section="team" item={item} canEdit={canEdit} className="h-full"><ul className="space-y-4">
  {people.map(person=><li key={person.id} className="flex items-center gap-3"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-bold text-als-navy" aria-hidden="true">{person.assigned?person.name?.split(/\s+/).filter(Boolean).slice(0,2).map(part=>part[0]).join(''):<UserRound className="h-4 w-4"/>}</span><div className="min-w-0"><p className="break-words text-xs font-bold">{person.name}</p><p className="mt-1 text-[11px] text-muted-foreground">{person.role}</p></div></li>)}
 </ul>{!item.team?.length&&<p className="mt-5 border-t border-border pt-4 text-xs text-muted-foreground">No additional team members recorded.</p>}</IEEditablePanel>;
}