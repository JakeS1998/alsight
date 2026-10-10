import React, {useId,useState} from 'react';
import {ChevronDown} from 'lucide-react';
export default function AlliancePanel({title,eyebrow,children,action,id,className='',collapsible=false}) {
  const [expanded,setExpanded]=useState(true);
  const contentId=useId();
  const heading=<>{eyebrow && <span className="mb-1 block text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{eyebrow}</span>}<span className="block font-heading text-lg font-extrabold text-foreground">{title}</span></>;
  return <section id={id} className={`min-w-0 rounded-panel border border-border bg-card p-5 shadow-sm md:p-6 ${className}`}>
    <header className={`${expanded?'mb-4 ':''}flex flex-wrap items-start justify-between gap-3`}>
      {collapsible ? <h2 className="min-w-0 flex-1"><button type="button" aria-expanded={expanded} aria-controls={contentId} onClick={()=>setExpanded(value=>!value)} className="flex w-full items-center justify-between gap-3 rounded-sm text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><span>{heading}</span><ChevronDown className={`h-5 w-5 shrink-0 ${expanded?'':'-rotate-90'}`} /></button></h2> : <div>{eyebrow && <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{eyebrow}</p>}<h2 className="font-heading text-lg font-extrabold text-foreground">{title}</h2></div>}
      {action}
    </header>
    <div id={contentId} hidden={collapsible&&!expanded}>{children}</div>
  </section>;
}