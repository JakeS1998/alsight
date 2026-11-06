import React from 'react';
import {ExternalLink} from 'lucide-react';
import {Button} from '@/components/ui/button';
import ApprovalTimestamp from '@/components/approvals/ApprovalTimestamp';
export default function MicrosoftApprovalCard({approval,onSelect}){
 return <article className="rounded-panel border border-border bg-card p-4"><div className="flex flex-wrap items-start justify-between gap-3"><div className="min-w-0 flex-1"><button type="button" className="text-left font-semibold underline-offset-4 hover:underline" onClick={onSelect}>{approval.title}</button><p className="mt-1 text-xs text-muted-foreground">{approval.status}{approval.result?` · ${approval.result}`:''}</p><ApprovalTimestamp label="Requested" value={approval.createdAt}/><ApprovalTimestamp label="Due" value={approval.dueAt}/><ApprovalTimestamp label="Completed" value={approval.completedAt}/></div><Button variant="outline" size="sm" asChild><a href={approval.microsoftUrl} target="_blank" rel="noopener noreferrer">Open in Microsoft<ExternalLink/></a></Button></div><Button variant="link" size="sm" className="mt-2 px-0" onClick={onSelect}>View details and responses</Button></article>;
}