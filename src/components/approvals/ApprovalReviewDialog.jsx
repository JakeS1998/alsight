import React,{useState} from 'react';
import {useMutation,useQueryClient} from '@tanstack/react-query';
import {Dialog,DialogContent,DialogHeader,DialogTitle,DialogDescription} from '@/components/ui/dialog';
import {Button} from '@/components/ui/button';
import {Textarea} from '@/components/ui/textarea';
import ApprovalTimestamp from '@/components/approvals/ApprovalTimestamp.jsx';
import approvalClient from '@/components/approvals/approvalClient';
const responses=['Approve','Approved - Subject to Comments','Further Review Required'];
export default function ApprovalReviewDialog({request,open,onOpenChange}) {
 const [response,setResponse]=useState(request.response || ''),[comments,setComments]=useState(request.decision_comments || ''),cache=useQueryClient();
 const decision=useMutation({mutationFn:()=>approvalClient('respond',{requestId:request.id,response,comments}),onSuccess:async()=>{await cache.invalidateQueries({queryKey:['approval-inbox']});onOpenChange(false);}});
 const pending=request.status==='pending',canRespond=pending && request.is_demo,needsComments=response==='Approved - Subject to Comments',url=/^https:\/\//i.test(request.document_url || '') ? request.document_url : null;
 return <Dialog open={open} onOpenChange={value=>{if(!decision.isPending)onOpenChange(value);}}><DialogContent className="max-h-[90vh] overflow-y-auto"><DialogHeader><DialogTitle>{request.document_title}</DialogTitle><DialogDescription>{request.is_demo ? 'Demo approval. Your response is saved in ALSight only; the source document and Dataverse remain unchanged.' : 'Live approval decisions and Dataverse write-back are not connected yet.'}</DialogDescription></DialogHeader>
  <ApprovalTimestamp value={request.drafted_date} label="Drafted" />
  {url ? <a href={url} target="_blank" rel="noopener noreferrer" className="font-semibold underline">Open document</a> : <p className="text-sm text-muted-foreground">No document link has been supplied.</p>}
  <form className="space-y-4" onSubmit={event=>{event.preventDefault();if(canRespond)decision.mutate();}}>
   <div><label htmlFor={`response-${request.id}`} className="mb-1 block text-sm font-medium">Response</label><select id={`response-${request.id}`} required value={response} onChange={event=>setResponse(event.target.value)} disabled={!canRespond || decision.isPending} className="w-full rounded-md border border-input bg-card p-2 text-sm"><option value="" disabled>Select a response</option>{responses.map(value=><option key={value} value={value}>{value}</option>)}</select></div>
   <div><label htmlFor={`comments-${request.id}`} className="mb-1 block text-sm font-medium">Comments{needsComments ? ' (required)' : ''}</label><Textarea id={`comments-${request.id}`} value={comments} onChange={event=>setComments(event.target.value)} required={needsComments} maxLength={4000} disabled={!canRespond || decision.isPending} rows={5}/></div>
   {!pending && <div className="text-sm text-muted-foreground"><p>Responded by {request.decided_by_name || 'Approver'}</p><ApprovalTimestamp value={request.decided_at} label="Response recorded" /></div>}
   {decision.error && <p role="alert" className="text-sm text-destructive">{decision.error.response?.data?.error || decision.error.message}</p>}
   <div className="flex justify-end gap-2"><Button type="button" variant="outline" disabled={decision.isPending} onClick={()=>onOpenChange(false)}>Close</Button>{canRespond && <Button type="submit" disabled={decision.isPending || !response || (needsComments && !comments.trim())}>{decision.isPending ? 'Saving…' : 'Submit demo response'}</Button>}</div>
  </form>
 </DialogContent></Dialog>;
}