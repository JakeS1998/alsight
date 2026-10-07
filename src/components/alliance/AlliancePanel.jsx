import React from 'react';
export default function AlliancePanel({title,eyebrow,children,action,id,className=''}) {
  return <section id={id} className={`min-w-0 rounded-panel border border-border bg-card p-5 shadow-sm md:p-6 ${className}`}><header className="mb-4 flex flex-wrap items-start justify-between gap-3"><div>{eyebrow && <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{eyebrow}</p>}<h2 className="font-heading text-lg font-extrabold text-foreground">{title}</h2></div>{action}</header>{children}</section>;
}