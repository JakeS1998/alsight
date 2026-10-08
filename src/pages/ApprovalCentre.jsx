import React,{useState} from 'react';
import {Link} from 'react-router-dom';
import {Button} from '@/components/ui/button';
import {useAuth} from '@/lib/AuthContext';
import useApprovalAccess from '@/components/approvals/useApprovalAccess';
import useApprovalSummary from '@/components/approvals/useApprovalSummary';
import ApprovalSummaryCards from '@/components/approvals/ApprovalSummaryCards.jsx';
import ApprovalWorkspace from '@/components/approvals/ApprovalWorkspace.jsx';
export default function ApprovalCentre() {
 const {user}=useAuth(),access=useApprovalAccess(),summary=useApprovalSummary(),[view,setView]=useState('pending');
 if(access.isPending)return <p role="status" className="text-sm text-muted-foreground">Checking approval access…</p>;
 if(access.error)return <section className="rounded-panel border border-border bg-card p-6"><p role="alert">Approval access could not be checked.</p><Button className="mt-3" variant="outline" onClick={()=>access.refetch()}>Try again</Button></section>;
 if(!access.enabled)return <section className="rounded-panel border border-border bg-card p-6"><h1 className="font-heading text-xl font-semibold">Approval access required</h1><p className="mt-2 text-sm text-muted-foreground">An administrator must enable Approval access on your Portal Account before you can use the Approval Centre.</p></section>;
 return <div className="space-y-5"><header className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs text-muted-foreground">Commercial workspace</p><h1 className="mt-1 font-heading text-2xl font-bold">Approval Centre</h1><p className="mt-1 text-sm text-muted-foreground">View and action approvals that require your decision.</p></div>{user?.role==='admin' && <Button variant="outline" asChild><Link to="/admin/approvals">Approval settings</Link></Button>}</header><ApprovalSummaryCards summary={summary} view={view} onView={setView}/>{summary.error && <p role="alert" className="text-xs text-destructive">Approval totals could not be loaded.</p>}<ApprovalWorkspace key={view} view={view}/></div>;
}