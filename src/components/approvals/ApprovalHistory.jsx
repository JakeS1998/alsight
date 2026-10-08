import React,{useState} from 'react';
import {useMutation} from '@tanstack/react-query';
import {Button} from '@/components/ui/button';
import ApprovalTimestamp from '@/components/approvals/ApprovalTimestamp.jsx';
import approvalClient from '@/components/approvals/approvalClient';
export default function ApprovalHistory({detail}) {
 const [extra,setExtra]=useState([]),[cursor,setCursor]=useState(detail.history_cursor);
 const more=useMutation({mutationFn:()=>approvalClient('history',{requestId:detail.request.id,cursor}),onSuccess:page=>{setExtra(v=>[...v,...page.items]);setCursor(page.has_more ? page.next_cursor : null);}});
 const events=[...detail.history,...extra];
 return <div className="space-y-4"><div className="border-l-2 border-primary/30 pl-4"><p className="text-xs font-semibold">Approval requested{detail.request.requested_by_name ? ` by ${detail.request.requested_by_name}` : ''}</p><ApprovalTimestamp value={detail.request.requested_at || detail.request.created_date}/></div>{events.map(event=><article key={event.id} className="border-l-2 border-border pl-4"><p className="text-xs font-semibold">{event.action} · {event.actor_name}</p><ApprovalTimestamp value={event.occurred_at}/>{event.comment && <p className="mt-2 whitespace-pre-wrap text-xs">{event.comment}</p>}{event.integration_result && <p className="mt-1 text-xs text-muted-foreground">{event.integration_result}</p>}</article>)}{cursor && <Button variant="outline" size="sm" disabled={more.isPending} onClick={()=>more.mutate()}>{more.isPending ? 'Loading…' : 'Load earlier history'}</Button>}{more.error && <p role="alert" className="text-xs text-destructive">{more.error.message}</p>}</div>;
}