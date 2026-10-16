import React,{useState} from 'react';
import {useInfiniteQuery} from '@tanstack/react-query';
import {base44} from '@/api/base44Client';
import {Button} from '@/components/ui/button';
import PQApprovalRoute from '@/components/questionnaire/PQApprovalRoute';
import PQApprovalTrail from '@/components/questionnaire/PQApprovalTrail';
import pqContext from '@/components/questionnaire/pqContext';
export default function PQApprovalPanel({project,subject,record,locked,onChanged}) {
 const source=pqContext(project.id,subject);
 const [busy,setBusy]=useState(false),[error,setError]=useState(''),[reason,setReason]=useState('');
 const query=useInfiniteQuery({queryKey:['pq-approval-state',source,record?.revision],enabled:!!record,initialPageParam:null,retry:false,queryFn:async({pageParam})=>(await base44.functions.invoke('manageProjectQuestionnaire',{action:'approval_state',...source,...(pageParam?{cursor:pageParam}:{})})).data,getNextPageParam:page=>page.has_more?page.next_cursor:undefined});
 const run=async(action,extra={})=>{setBusy(true);setError('');try{await base44.functions.invoke('manageProjectQuestionnaire',{action,...source,revision:record?.revision,...extra});await onChanged();}catch(e){setError(e.response?.data?.error||e.message);}finally{setBusy(false);}};
 const data=query.data?.pages[0],round=data?.round,history=query.data?.pages.flatMap(page=>page.history)||[];
 return <section className="space-y-4 border-t border-border pt-6" aria-label="PQ sequential approvals"><div className="flex flex-wrap items-center justify-between gap-2"><h4 className="text-lg font-semibold">Sequential approvals</h4>{record&&<Button type="button" variant="outline" size="sm" disabled={busy||query.isFetching} onClick={()=>record.status==='submitted'?onChanged():query.refetch()}>Refresh approval status</Button>}</div><p className="text-sm text-muted-foreground">Approval applies only to the issued version. An approved, current PQ is required before an opportunity or direct request can create a project.</p>
 {!record?<p className="text-sm text-muted-foreground">Save and submit the questionnaire to set up its approval sequence.</p>:query.isPending?<p role="status">Loading approval sequence…</p>:query.error?<div role="alert"><p className="text-sm text-destructive">{query.error.response?.data?.error||query.error.message}</p><Button type="button" variant="outline" onClick={()=>query.refetch()}>Retry</Button></div>:<>
 {error&&<p role="alert" className="text-sm text-destructive">{error}</p>}
 {round&&<PQApprovalTrail round={round}/>}
 {data?.canStart?<PQApprovalRoute projectId={project.id} subject={subject} busy={busy} onStart={steps=>run('start_approval',{steps})}/>:!round&&<p className="text-sm text-muted-foreground">{record?.status==='submitted'?'No approval sequence has been issued. A project editor can assign approvers.':'Submit the completed questionnaire before requesting approval.'}</p>}
 {round?.status==='active'&&data?.canManage&&<div className="space-y-2"><label className="block text-sm font-medium" htmlFor="pq-withdraw-reason">Reason for withdrawing</label><textarea id="pq-withdraw-reason" rows={2} maxLength={1000} value={reason} onChange={event=>setReason(event.target.value)} disabled={busy} className="w-full rounded-md border border-input bg-background p-3 text-sm"/><Button type="button" variant="outline" disabled={busy||!reason.trim()} onClick={()=>{if(window.confirm('Withdraw this approval sequence? Previous decisions will remain in its history.'))run('withdraw_approval',{roundId:round.id,comment:reason});}}>Withdraw approval sequence</Button></div>}
 {!locked&&round&&round.status!=='active'&&!data?.canStart&&record.status==='submitted'&&<p className="text-sm text-muted-foreground">Reopen and resubmit the questionnaire to request a new approval sequence. Earlier decisions remain attached to their issued version.</p>}
 {!!history.length&&<div className="space-y-2"><h5 className="text-sm font-semibold">Approval issue history</h5>{history.map(item=><details key={item.id} className="rounded-md border border-border p-3"><summary className="cursor-pointer text-sm">{item.reference} · {item.status} · {new Date(item.issued_at).toLocaleDateString('en-GB')}</summary><div className="mt-3"><PQApprovalTrail round={item}/></div></details>)}</div>}
 {query.hasNextPage&&<Button type="button" variant="outline" disabled={query.isFetchingNextPage} onClick={()=>query.fetchNextPage()}>Load more approval history</Button>}
 </>}</section>;
}