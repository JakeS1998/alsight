import React,{useState} from 'react';
import {Link} from 'react-router-dom';
import {Button} from '@/components/ui/button';
import {useAuth} from '@/lib/AuthContext';
import useApprovalAccess from '@/components/approvals/useApprovalAccess';
import useApprovalInbox from '@/components/approvals/useApprovalInbox';
import ApprovalRequestCard from '@/components/approvals/ApprovalRequestCard.jsx';
export default function ApprovalCentre() {
 const {user}=useAuth(),access=useApprovalAccess(),[view,setView]=useState('pending');
 const inbox=useApprovalInbox(view,access.enabled),items=inbox.data?.pages.flatMap(page=>page.items) || [];
 async function refresh(){const result=await access.refetch();if(result.data?.enabled)await inbox.refetch();}
 if(access.isPending)return <p role="status" className="text-sm text-muted-foreground">Checking approval access…</p>;
 if(access.error)return <section className="rounded-panel border border-border bg-card p-6"><p role="alert">Approval access could not be checked.</p><Button className="mt-3" variant="outline" onClick={()=>access.refetch()}>Try again</Button></section>;
 if(!access.enabled)return <section className="rounded-panel border border-border bg-card p-6"><h1 className="font-heading text-xl font-semibold">Approval access required</h1><p className="mt-2 text-sm text-muted-foreground">An administrator must enable Approval access on your Portal Account before you can use the approval centre.</p></section>;
 return <div className="space-y-5">
  <header className="flex flex-wrap items-start justify-between gap-3"><div><h1 className="font-heading text-2xl font-semibold">Approval centre</h1><p className="mt-1 text-sm text-muted-foreground">Your assigned document approvals.</p></div><Button variant="outline" onClick={refresh} disabled={access.isFetching || inbox.isFetching}>{inbox.isFetching ? 'Refreshing…' : 'Refresh'}</Button></header>
  <div className="rounded-lg border border-border bg-secondary p-4 text-sm">The assigned inbox is ready. Power Automate delivery, review decisions and Dataverse write-back still need connecting.{user?.role==='admin' && <Link to="/admin/approvals" className="ml-2 font-semibold underline">Setup instructions</Link>}</div>
  <div className="flex gap-2" role="group" aria-label="Approval view">{[['pending','Awaiting approval'],['history','History']].map(([value,label])=><Button key={value} variant={view===value ? 'default' : 'outline'} aria-pressed={view===value} onClick={()=>setView(value)}>{label}</Button>)}</div>
  {inbox.isPending ? <p role="status" className="text-sm text-muted-foreground">Loading approvals…</p> : inbox.error ? <p role="alert" className="text-sm text-destructive">{inbox.error?.response?.data?.error || inbox.error.message || 'Approvals could not be loaded.'}</p> : items.length ? <div className="grid gap-4">{items.map(request=><ApprovalRequestCard key={request.id} request={request}/>)}</div> : <section className="rounded-panel border border-border bg-card p-8 text-center"><h2 className="font-semibold">{view==='pending' ? 'No approvals awaiting your review' : 'No approval history yet'}</h2><p className="mt-2 text-sm text-muted-foreground">{view==='pending' ? 'Requests assigned to your portal email will appear here once the Power Automate connection is enabled.' : 'Completed and superseded requests assigned to you will appear here.'}</p></section>}
  {!inbox.error && inbox.hasNextPage && <Button variant="outline" onClick={()=>inbox.fetchNextPage()} disabled={inbox.isFetchingNextPage}>{inbox.isFetchingNextPage ? 'Loading…' : 'Load more'}</Button>}
 </div>;
}