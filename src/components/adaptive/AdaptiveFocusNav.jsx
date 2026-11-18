import React from 'react';
import { ClipboardList, FolderKanban, PoundSterling, FileText, Activity, NotebookPen } from 'lucide-react';
import { focuses } from '@/components/adaptive/adaptiveEngine';
import SlidingTabHighlight from '@/components/navigation/SlidingTabHighlight';
const icons=[ClipboardList,FolderKanban,PoundSterling,FileText,Activity,NotebookPen];
export const focusTargets={'My priorities':'priorities','My projects':'projects',Commercial:'commercial',Documents:'documents','My activity':'activity'};
export default function AdaptiveFocusNav({focus,prefs,context,ready}) {
 const visible=focuses.filter(item=>item==='My priorities'||item==='My Notes'||context.widgets.includes(focusTargets[item]));
 const canSelect=item=>ready||item==='My Notes'||focus==='My Notes';
 function select(item){
  prefs.save(old=>item==='My Notes'?{focus:item}:{focus:item,hidden:old.hidden.filter(id=>id!==focusTargets[item])});
 }
 function onKeyDown(event,item){
  if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;
  event.preventDefault();
  const available=visible.filter(canSelect),index=available.indexOf(item);
  const next=event.key==='Home'?0:event.key==='End'?available.length-1:(index+(event.key==='ArrowRight'?1:-1)+available.length)%available.length;
  select(available[next]);
  document.getElementById(`adaptive-focus-tab-${focuses.indexOf(available[next])}`)?.focus({preventScroll:true});
 }
 return <nav className="at-focus sliding-tab-list" role="tablist" aria-label="Workspace focus"><SlidingTabHighlight/>{visible.map(item=>{const id=focuses.indexOf(item),Icon=icons[id];return <button key={item} id={`adaptive-focus-tab-${id}`} role="tab" type="button" disabled={!canSelect(item)} aria-controls="adaptive-focus-panel" aria-selected={focus===item} tabIndex={focus===item||(!ready&&item==='My Notes')?0:-1} className={focus===item?'at-focus-active':''} onKeyDown={event=>onKeyDown(event,item)} onClick={()=>select(item)}><span className="sliding-tab-label"><Icon size={13} aria-hidden="true"/>{item}</span></button>;})}</nav>;
}