import React,{useState} from 'react';
import {useParams} from 'react-router-dom';
import {useQuery} from '@tanstack/react-query';
import {base44} from '@/api/base44Client';
import {Button} from '@/components/ui/button';
import PQApprovalTrail from '@/components/questionnaire/PQApprovalTrail';
import PQIssuedQuestionnaire from '@/components/questionnaire/PQIssuedQuestionnaire';
import PQApprovalDecision from '@/components/questionnaire/PQApprovalDecision';
export default function PQApprovalReview() {
 const {roundId}=useParams(),[warning,setWarning]=useState('');
 const query=useQuery({queryKey:['pq-approval-review',roundId],retry:false,queryFn:async()=>(await base44.functions.invoke('manageProjectQuestionnaire',{action:'review',roundId})).data});
 if(query.isPending)return <main className="p-6" role="status">Loading issued questionnaire…</main>;
 if(query.error)return <main className="space-y-4 p-6"><p role="alert" className="text-destructive">{query.error.response?.data?.error||query.error.message}</p><Button variant="outline" onClick={()=>query.refetch()}>Try again</Button></main>;
 const {round,snapshot,snapshotHash,canDecide}=query.data;
 return <main className="mx-auto max-w-5xl space-y-6 p-4 sm:p-6"><header className="space-y-2"><p className="text-sm text-muted-foreground">Project questionnaire approval</p><h1 className="text-2xl font-semibold">{round.project_name}</h1><p className="text-sm text-muted-foreground">{round.project_number} · {round.reference}</p><Button variant="outline" size="sm" disabled={query.isFetching} onClick={()=>query.refetch()}>Refresh approval status</Button></header>
 {warning&&<p role="status" className="rounded-md border border-border bg-card p-3 text-sm">{warning}</p>}
 <PQApprovalTrail round={round} showLink={false}/><PQIssuedQuestionnaire snapshot={snapshot}/>
 {canDecide?<PQApprovalDecision key={`${round.id}-${round.current_index}`} round={round} snapshotHash={snapshotHash} onDecided={async message=>{setWarning(message);await query.refetch();}}/>:<p className="rounded-md border border-border bg-card p-4 text-sm">{round.status==='active'?'This issue is awaiting the current approver. Only that person can record the next decision.':`This approval sequence is ${round.status}. No further decisions can be recorded.`}</p>}
 </main>;
}