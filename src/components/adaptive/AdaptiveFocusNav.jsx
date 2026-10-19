import React from 'react';
import { ClipboardList, FolderKanban, PoundSterling, FileText, Activity } from 'lucide-react';
import { focuses } from '@/components/adaptive/adaptiveEngine';
const icons=[ClipboardList,FolderKanban,PoundSterling,FileText,Activity];
export const focusTargets={'My priorities':'priorities','My projects':'projects',Commercial:'commercial',Documents:'documents','My activity':'activity'};
export default function AdaptiveFocusNav({focus,prefs,context,ready}) {
 const visible=focuses.filter(item=>item==='My priorities'||context.widgets.includes(focusTargets[item]));
 function select(item){
  prefs.save(old=>({focus:item,hidden:old.hidden.filter(id=>id!==focusTargets[item])}));
 }
 function onKeyDown(event,index){
  if(!ready||!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;
  event.preventDefault();
  const next=event.key==='Home'?0:event.key==='End'?visible.length-1:(index+(event.key==='ArrowRight'?1:-1)+visible.length)%visible.length;
  select(visible[next]);
  document.getElementById(`adaptive-focus-tab-${focuses.indexOf(visible[next])}`)?.focus({preventScroll:true});
 }
 return <nav className="at-focus" role="tablist" aria-label="Workspace focus">{visible.map((item,index)=>{const id=focuses.indexOf(item),Icon=icons[id];return <button key={item} id={`adaptive-focus-tab-${id}`} role="tab" type="button" disabled={!ready} aria-controls="adaptive-focus-panel" aria-selected={focus===item} tabIndex={focus===item?0:-1} className={focus===item?'at-focus-active':''} onKeyDown={event=>onKeyDown(event,index)} onClick={()=>select(item)}><Icon size={13} aria-hidden="true"/>{item}</button>;})}</nav>;
}