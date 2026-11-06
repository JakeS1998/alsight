import React,{useState} from 'react';
import useApprovalSummary from '@/components/approvals/useApprovalSummary';
import ApprovalSummaryCards from '@/components/approvals/ApprovalSummaryCards';
import ApprovalWorkspace from '@/components/approvals/ApprovalWorkspace';
import ProjectApprovalInbox from '@/components/approvals/ProjectApprovalInbox';
export default function HubApprovalWorkspace(){
 const summary=useApprovalSummary(),[view,setView]=useState('pending');
 return <div className="space-y-5"><p className="text-sm text-muted-foreground">Existing Hub workflows remain available here and have not been migrated or deleted. The Microsoft view above reads Dataverse directly and creates no Hub approval requests.</p><ApprovalSummaryCards summary={summary} view={view} onView={setView}/>{summary.error&&<p role="alert" className="text-xs text-destructive">Hub approval totals could not be loaded.</p>}<ProjectApprovalInbox key={`projects:${view}`} view={view}/><ApprovalWorkspace key={view} view={view}/></div>;
}