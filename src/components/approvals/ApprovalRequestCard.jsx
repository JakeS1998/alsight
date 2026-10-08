import React from 'react';
import ApprovalTimestamp from '@/components/approvals/ApprovalTimestamp.jsx';
const labels={pending:'Awaiting approval',approved:'Approved',rejected:'Rejected',superseded:'Superseded'};
const writebacks={awaiting_connection:'Decision recorded in ALSight. Dataverse write-back is not connected.',pending:'Dataverse write-back pending.',confirmed:'Result confirmed in Dataverse.',error:'Dataverse write-back needs attention.'};
export default function ApprovalRequestCard({request}) {
  const url=request.document_url && /^https:\/\//i.test(request.document_url) ? request.document_url : null;
  return <article className="rounded-panel border border-border bg-card p-5">
    <div className="flex flex-wrap items-start justify-between gap-3"><h2 className="font-heading font-semibold">{request.document_title}</h2><div className="flex items-center gap-2">{request.is_demo && <span className="rounded-md bg-secondary px-2 py-1 text-xs font-medium">Demo</span>}<span className="rounded-md bg-secondary px-2 py-1 text-xs font-medium">{labels[request.status]}</span></div></div>
    <p className="mt-2 text-sm text-muted-foreground">{request.source_table==='dma' ? 'Development agreement' : request.source_table==='warranties' ? 'Warranty' : 'Legal document'}</p>
    <ApprovalTimestamp value={request.drafted_date} label="Drafted" />
    <ApprovalTimestamp value={request.created_date} label="Requested" />
    {request.is_demo && <p className="mt-2 text-xs text-muted-foreground">Read-only demonstration. No approval decision or Dataverse update will be made.</p>}
    {url && <a href={url} target="_blank" rel="noopener noreferrer" className="mt-3 inline-block text-sm font-semibold underline">Open document</a>}
    {request.decision_comments && <p className="mt-3 whitespace-pre-wrap text-sm">{request.decision_comments}</p>}
    {request.decided_at && <div className="mt-3 text-xs text-muted-foreground"><p>{request.decided_by_name}</p><ApprovalTimestamp value={request.decided_at} label="Decision recorded" /></div>}
    {writebacks[request.writeback_status] && <p className="mt-3 text-xs text-muted-foreground">{writebacks[request.writeback_status]}</p>}
  </article>;
}