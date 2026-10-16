import React from 'react';
export default function PQApprovalTimeline({round}) {
 return <ol className={round.steps.length===1?'grid gap-3':'grid gap-3 sm:grid-cols-2 xl:grid-cols-4'}>{round.steps.map((step,index)=>{
  const verified=step.verification_method==='email_otp';
  const status=step.status==='approved'?'Approved':step.status==='rejected'?'Rejected':round.status==='active'&&index===round.current_index?'Awaiting approval':round.status==='active'?'Queued':'Not reached';
  return <li key={step.user_id} className="rounded-lg border border-border bg-card p-3 text-sm">
   <p className="font-bold">{index+1}. Approver</p><p className="mt-1 break-words">{step.name||'Name not recorded'}</p><p className="break-words text-xs text-muted-foreground">{step.email}</p>
   <p className={`mt-2 font-medium ${step.status==='approved'?'text-success':step.status==='rejected'?'text-destructive':'text-foreground'}`}>{status}{verified?' · Email verified':''}</p>
   {step.decided_at&&<p className="mt-1 text-xs text-muted-foreground">{new Date(step.decided_at).toLocaleString('en-GB')}</p>}
   {step.comment&&<p className="mt-2 whitespace-pre-wrap break-words text-xs">{step.comment}</p>}
  </li>;
 })}</ol>;
}