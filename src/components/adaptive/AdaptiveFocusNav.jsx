import React from 'react';
import { ClipboardList, FolderKanban, PoundSterling, FileText, Activity } from 'lucide-react';
import { focuses } from '@/components/adaptive/adaptiveEngine';
const icons=[ClipboardList,FolderKanban,PoundSterling,FileText,Activity];
const targets={'My priorities':'priorities','My projects':'projects',Commercial:'commercial',Documents:'documents','My activity':'activity'};
export default function AdaptiveFocusNav({focus,prefs,context,ready}) {
 function select(item){
  const target=targets[item];
  prefs.save(old=>({focus:item,hidden:old.hidden.filter(id=>id!==target)}));
  requestAnimationFrame(()=>{const element=document.getElementById(target==='priorities'?'adaptive-priorities':`adaptive-widget-${target}`);if(!element)return;const details=target==='priorities'&&element.querySelector('details');if(details)details.open=true;element.focus({preventScroll:true});element.scrollIntoView({behavior:'auto',block:'start'});});
 }
 return <nav className="at-focus" aria-label="Workspace focus">{focuses.map((item,index)=>{const Icon=icons[index];if(item!=='My priorities'&&!context.widgets.includes(targets[item]))return null;return <button key={item} type="button" disabled={!ready} aria-controls={targets[item]==='priorities'?'adaptive-priorities':`adaptive-widget-${targets[item]}`} aria-pressed={focus===item} className={focus===item?'at-focus-active':''} onClick={()=>select(item)}><Icon size={13} aria-hidden="true"/>{item}</button>;})}</nav>;
}