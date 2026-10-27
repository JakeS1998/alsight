import React from 'react';
import {PORTAL_PAGES,canViewPage} from '@/components/navigation/workspaceAccess';
export default function PortalPageAccessFields({user,value,onChange,disabled,approvalEnabled}) {
 const change=(key,checked)=>{const next={...value};if(checked===canViewPage({...user,page_access:{}},key,approvalEnabled))delete next[key];else next[key]=checked;onChange(next);};
 return <fieldset disabled={disabled} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
  <legend className="sr-only">Top navigation page access</legend>
  {PORTAL_PAGES.map(page=>{const defaultOn=canViewPage({...user,page_access:{}},page.key,approvalEnabled),checked=canViewPage({...user,page_access:value},page.key,approvalEnabled),custom=typeof value[page.key]==='boolean';
   return <label key={page.key} className="flex cursor-pointer items-center gap-3 rounded-panel border border-border bg-card p-3 text-sm">
    <input type="checkbox" className="h-4 w-4 accent-primary" checked={checked} onChange={event=>change(page.key,event.target.checked)}/>
    <span><span className="block font-medium">{page.label}</span><span className="text-xs text-muted-foreground">{custom?(checked?'Additional page':'Hidden'):`Default: ${defaultOn?'shown':'hidden'}`}</span></span>
   </label>;
  })}
 </fieldset>;
}