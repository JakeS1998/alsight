import React,{useState} from 'react';
import {useInfiniteQuery} from '@tanstack/react-query';
import {base44} from '@/api/base44Client';
import {Button} from '@/components/ui/button';
import PQApprovalRoute from '@/components/questionnaire/PQApprovalRoute';
import PQApprovalTrail from '@/components/questionnaire/PQApprovalTrail';
import pqContext from '@/components/questionnaire/pqContext';
export default function PQApprovalPanel({project,subject,record,locked,recordedApproval,onChanged}) {
 const source=pqContext(project.id,subject);
 const [busy,setBusy]=useState(false),[error,setError]=useState(''),[reason,setReason]=useState(''),[historyOpen,setHistoryOpen]=useState(false);
 const query=useInfiniteQuery({queryKey:['pq-approval-state',source,record?.revision],enabled:!!record,initialPageParam:null,retry:false,queryFn:async({pageParam})=>(await base44.functions.invoke('manageProjectQuestionnaire',{action:'approval_state',...source,...(pageParam?{cursor:pageParam}:{})})).data,getNextPageParam:page=>page.has_more?page.next_cursor:undefined});
 const run=async(action,extra={})=>{setBusy(true);setError('');try{await base44.functions.invoke('manageProjectQuestionnaire',{action,...source,revision:record?.revision,...extra});await Promise.all([onChanged(),query.refetch()]);}catch(e){setError(e.response?.data?.error||e.message);}finally{setBusy(false);}};
 const data=query.data?.pages[0],round=data?.round,history=query.data?.pages.flatMap(page=>page.history)||[];
 const percent=round?.steps?.length?Math.round(round.steps.filter(step=>step.status==='approved').length/round.steps.length*100):0;
 return <section className="space-y-4 rounded-xl border border-border bg-muted/40 p-4" aria-label="PQ sequential approvals"><div className="flex flex-wrap justify-between gap-3"><div><h4 className="text-sm font-bold">Project questionnaire approval</h4><p className="mt-1 text-xs text-muted-foreground">Sequential invitations · Email verification before each decision · Approval applies to the issued version.</p></div>{round&&<span className="text-xs font-bold">{percent}% complete</span>}</div>
 {record&&<Button type="button" variant="outline" size="sm" disabled={busy||query.isFetching} onClick={()=>Promise.all([onChanged(),query.refetch()])}>Refresh approval status</Button>}
 {!record?<p className="text-sm text-muted-foreground">{locked?'No verified approval sequence recorded.':'Save and submit the questionnaire to set up its approval sequence.'}</p>:query.isPending?<p role="status">Loading approval sequence…</p>:query.error?<div role="alert"><p className="text-sm text-destructive">{query.error.response?.data?.error||query.error.message}</p><Button type="button" variant="outline" onClick={()=>query.refetch()}>Retry</Button></div>:<>
 {error&&<p role="alert" className="text-sm text-destructive">{error}</p>}
 {round&&<PQApprovalTrail round={round}/>}
 {data?.canStart?<PQApprovalRoute projectId={project.id} subject={subject} busy={busy} onStart={steps=>run('start_approval',{steps})}/>:!round&&<p className="text-sm text-muted-foreground">{locked?'No verified approval sequence recorded.':record?.status==='submitted'?'No approval sequence has been issued. A project editor can assign approvers.':'Submit the completed questionnaire before requesting approval.'}</p>}
 {round?.status==='active'&&data?.canManage&&<div className="space-y-2"><label className="block text-sm font-medium" htmlFor="pq-withdraw-reason">Reason for withdrawing</label><textarea id="pq-withdraw-reason" rows={2} maxLength={1000} value={reason} onChange={event=>setReason(event.target.value)} disabled={busy} className="w-full rounded-md border border-input bg-background p-3 text-sm"/><Button type="button" variant="outline" disabled={busy||!reason.trim()} onClick={()=>{if(window.confirm('Withdraw this approval sequence? Previous decisions will remain in its history.'))run('withdraw_approval',{roundId:round.id,comment:reason});}}>Withdraw approval sequence</Button></div>}
 {!locked&&round&&round.status!=='active'&&!data?.canStart&&record.status==='submitted'&&<p className="text-sm text-muted-foreground">Reopen and resubmit the questionnaire to request a new approval sequence. Earlier decisions remain attached to their issued version.</p>}
 {!!history.length&&<div className="space-y-3"><Button type="button" variant="ghost" size="sm" onClick={()=>setHistoryOpen(value=>!value)}>{historyOpen?'Hide':'Show'} issued-version history</Button>{historyOpen&&history.map(item=><PQApprovalTrail key={item.id} round={item}/>)}</div>}
 {historyOpen&&query.hasNextPage&&<Button type="button" variant="outline" disabled={query.isFetchingNextPage} onClick={()=>query.fetchNextPage()}>Load more approval history</Button>}
 </>}
 {recordedApproval&&<details className="text-xs text-muted-foreground"><summary className="cursor-pointer">Historical project-recorded approval (not email-verified acceptance)</summary><p className="mt-2">PQ approved · {new Date(recordedApproval.approvedAt).toLocaleDateString('en-GB')} · {recordedApproval.source}. This records the existing project approval, not a new verified decision.</p></details>}
 <p className="text-xs text-muted-foreground">Decisions record explicit approval, not a qualified electronic signature. An approved, current PQ is required before an opportunity or direct request can create a project.</p>
 </section>;
}