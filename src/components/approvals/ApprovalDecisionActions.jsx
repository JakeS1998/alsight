import React,{useState} from 'react';
import {useMutation,useQueryClient} from '@tanstack/react-query';
import {Button} from '@/components/ui/button';
import {Textarea} from '@/components/ui/textarea';
import {Dialog,DialogContent,DialogHeader,DialogTitle,DialogDescription} from '@/components/ui/dialog';
import approvalClient from '@/components/approvals/approvalClient';
export default function ApprovalDecisionActions({request}) {
 const [response,setResponse]=useState(''),[comments,setComments]=useState(''),[notice,setNotice]=useState(''),cache=useQueryClient();
 const decision=useMutation({mutationFn:action=>approvalClient(action,{requestId:request.id,response,comments}),onSuccess:async result=>{setResponse('');setNotice(result.ok ? result.is_demo ? 'Demo decision recorded. Dataverse remains unchanged.' : 'Decision confirmed in Dataverse.' : 'We couldn’t complete this approval. The decision has not yet been confirmed in the source system.');await Promise.all([cache.invalidateQueries({queryKey:['approval-inbox']}),cache.invalidateQueries({queryKey:['approval-detail']}),cache.invalidateQueries({queryKey:['approval-summary']})]);}});
 const needsComments=response==='Approved - Subject to Comments';
 return <div className="mt-5 space-y-3 border-t border-border pt-4">
  {request.is_demo && <p className="rounded-lg bg-secondary p-3 text-xs text-muted-foreground">Demo approval: decisions are saved in ALSight only. The document and Dataverse are unchanged.</p>}
  {(request.writeback_status==='error' || request.can_retry) && <div role="alert" className="rounded-lg border border-destructive/30 p-3 text-xs"><p className="font-semibold">We couldn’t complete this approval</p><p className="mt-1">The decision has not yet been confirmed in the source system.</p><p className="mt-2 text-muted-foreground">{request.integration_error}</p>{request.can_retry && <Button className="mt-3" size="sm" variant="outline" disabled={decision.isPending} onClick={()=>decision.mutate('retry')}>{decision.isPending ? 'Retrying…' : 'Retry saved decision'}</Button>}</div>}
  {request.can_respond && !request.response && <><Textarea aria-label="Approval comment" placeholder="Add a comment (optional)…" value={comments} onChange={e=>setComments(e.target.value)} maxLength={4000}/><div className="grid grid-cols-2 gap-2"><Button variant="outline" className="h-auto min-h-9 whitespace-normal" onClick={()=>setResponse('Further Review Required')} disabled={decision.isPending}>Further Review Required</Button><Button onClick={()=>setResponse('Approve')} disabled={decision.isPending}>Approve</Button></div><div className="flex flex-wrap gap-3"><button className="text-xs text-chart-2 underline" onClick={()=>setResponse('Approved - Subject to Comments')}>Approve subject to comments</button></div></>}
  {request.writeback_status==='pending' && request.response && !request.can_retry && <p role="status" className="text-xs text-muted-foreground">Your decision is recorded in ALSight. Waiting for confirmation from Dataverse.</p>}
  {notice && <p role="status" className="text-xs">{notice}</p>}{decision.error && <p role="alert" className="text-xs text-destructive">{decision.error.response?.data?.error || decision.error.message}</p>}
  <Dialog open={!!response} onOpenChange={open=>{if(!open && !decision.isPending)setResponse('');}}><DialogContent>
   <DialogHeader><DialogTitle>Confirm approval response</DialogTitle><DialogDescription>{request.document_title}{request.is_demo ? '. This is a demo and will not change Dataverse.' : '. Your decision will be sent directly to Dataverse.'}</DialogDescription></DialogHeader>
   <p className="text-sm font-semibold">{response}</p><Textarea aria-label="Decision comment" placeholder={needsComments ? 'Add your required approval comments…' : 'Add a comment (optional)…'} value={comments} onChange={e=>setComments(e.target.value)} maxLength={4000} disabled={decision.isPending}/>
   <div className="flex justify-end gap-2"><Button variant="outline" disabled={decision.isPending} onClick={()=>setResponse('')}>Cancel</Button><Button disabled={decision.isPending || (needsComments && !comments.trim())} onClick={()=>decision.mutate('respond')}>{decision.isPending ? 'Recording…' : 'Confirm decision'}</Button></div>
   {decision.error && <p role="alert" className="text-sm text-destructive">{decision.error.response?.data?.error || decision.error.message}</p>}
  </DialogContent></Dialog>
 </div>;
}