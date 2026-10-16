import React from 'react';
import {Link} from 'react-router-dom';
import {Button} from '@/components/ui/button';
import PQApprovalTimeline from '@/components/questionnaire/PQApprovalTimeline';
export default function PQApprovalTrail({round,showLink=true}) {
 if(!round)return null;
 return <article className="space-y-3 rounded-lg border border-border bg-card p-3"><div className="flex flex-wrap items-center justify-between gap-2"><strong className="text-sm">{round.reference}</strong><span className="rounded-full bg-secondary px-3 py-1 text-xs font-semibold capitalize">{round.status==='active'?'Awaiting approval':round.status}</span></div><p className="text-xs text-muted-foreground">Issued {new Date(round.issued_at).toLocaleString('en-GB')} by {round.issued_by_name}</p>
 <PQApprovalTimeline round={round}/>
 {round.status==='withdrawn'&&<p className="text-sm">Withdrawn by {round.withdrawn_by} on {new Date(round.withdrawn_at).toLocaleString('en-GB')}: {round.withdrawal_reason}</p>}
 {round.notification_status==='failed'&&round.status==='active'&&<p role="status" className="text-sm text-destructive">The latest email notification could not be sent. Share the review link with the current approver.</p>}
 {showLink&&<Button asChild type="button" size="sm" variant="outline"><Link to={`/pq-approvals/${round.id}`}>Review issued questionnaire</Link></Button>}</article>;
}