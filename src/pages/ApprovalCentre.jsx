import React from 'react';
import {Link} from 'react-router-dom';
import {Button} from '@/components/ui/button';
import {useAuth} from '@/lib/AuthContext';
import useApprovalAccess from '@/components/approvals/useApprovalAccess';
import MicrosoftApprovalInbox from '@/components/approvals/MicrosoftApprovalInbox';
import HubApprovalWorkspace from '@/components/approvals/HubApprovalWorkspace';
export default function ApprovalCentre() {
 const {user}=useAuth(),access=useApprovalAccess();
 if(access.isPending)return <p role="status" className="text-sm text-muted-foreground">Checking approval access…</p>;
 if(access.error)return <section className="rounded-panel border border-border bg-card p-6"><p role="alert">Approval access could not be checked.</p><Button className="mt-3" variant="outline" onClick={()=>access.refetch()}>Try again</Button></section>;
 if(!access.enabled)return <section className="rounded-panel border border-border bg-card p-6"><h1 className="font-heading text-xl font-semibold">Approval access required</h1><p className="mt-2 text-sm text-muted-foreground">An administrator must enable Approval access on your Portal Account before you can use the Approval Centre.</p></section>;
 return <div className="space-y-5"><header className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs text-muted-foreground">Commercial workspace</p><h1 className="mt-1 font-heading text-2xl font-bold">Approval Centre</h1><p className="mt-1 text-sm text-muted-foreground">View and action approvals that require your decision.</p></div>{user?.role==='admin' && <Button variant="outline" asChild><Link to="/admin/approvals">Approval settings</Link></Button>}</header><MicrosoftApprovalInbox/><section className="space-y-4 border-t border-border pt-5"><h2 className="font-heading text-lg font-semibold">Existing Hub approvals</h2><HubApprovalWorkspace/></section></div>;
}