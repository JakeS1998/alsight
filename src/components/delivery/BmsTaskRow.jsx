import React, { useState } from 'react';
import { CheckCircle2, Circle, MinusCircle, ChevronDown } from 'lucide-react';
import BmsTaskReviewForm from '@/components/delivery/BmsTaskReviewForm';
import BmsWorkAction from '@/components/delivery/BmsWorkAction';
export default function BmsTaskRow({task,projectId,canEdit,onSave,onSelect}) {
 const [open,setOpen]=useState(false);
 const Icon=task.notApplicable?MinusCircle:task.done?CheckCircle2:Circle;
 return <div className="border-t border-border py-3 text-xs">
  <div className="flex items-start gap-2"><Icon className={task.done?'mt-0.5 h-4 w-4 shrink-0 text-success':'mt-0.5 h-4 w-4 shrink-0 text-muted-foreground'}/><div className="min-w-0 flex-1"><p className="font-medium">{task.label}</p><p className="mt-1 text-muted-foreground">{task.procedure} · Issue {task.issue} · {task.gate?'Approval / decision gate':'Supporting activity'} · {task.notApplicable?'Not applicable':task.pending?'Checking':task.done?'Recorded':'Outstanding'}</p>{task.notApplicable?<p className="mt-1 text-muted-foreground">{task.reason}</p>:task.detail&&<p className="mt-1 text-muted-foreground">{task.detail}</p>}
   {task.linked&&<button type="button" onClick={()=>onSelect(task.linked.entity==='ProjectDecision'?7:6)} className="mt-1 underline">Existing {task.linked.entity==='ProjectDecision'?'decision':'action'}: {task.linked.label}</button>}
   {task.url&&/^https?:\/\//i.test(task.url)&&<a href={task.url} target="_blank" rel="noopener noreferrer" className="ml-2 underline">Open evidence</a>}
   <BmsWorkAction task={task} projectId={projectId} canEdit={canEdit}/>
   {task.subchecks?.map(check=><p key={check.label} className="mt-1 text-muted-foreground">{check.done?'Recorded: ':'Outstanding: '}{check.label}</p>)}
  </div><button type="button" aria-expanded={open} onClick={()=>setOpen(!open)} className="flex shrink-0 items-center gap-1 rounded-md border border-border px-2 py-1 hover:bg-muted">{canEdit&&!task.source?'Review':'Details'}<ChevronDown className="h-3 w-3"/></button></div>
  {open&&<BmsTaskReviewForm task={task} projectId={projectId} canEdit={canEdit} onSave={onSave} onDone={()=>setOpen(false)}/>}
 </div>;
}