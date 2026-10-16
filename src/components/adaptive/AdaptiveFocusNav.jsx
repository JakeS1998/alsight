import React from 'react';
import { ClipboardList, FolderKanban, PoundSterling, FileText, Activity } from 'lucide-react';
import { focuses } from '@/components/adaptive/adaptiveEngine';
const icons=[ClipboardList,FolderKanban,PoundSterling,FileText,Activity];
export default function AdaptiveFocusNav({focus,prefs}) {
 return <nav className="at-focus" aria-label="Workspace focus">{focuses.map((item,index)=>{const Icon=icons[index];return <button key={item} aria-pressed={focus===item} className={focus===item?'at-focus-active':''} onClick={()=>prefs.save({focus:item})}><Icon size={13} aria-hidden="true"/>{item}</button>;})}</nav>;
}