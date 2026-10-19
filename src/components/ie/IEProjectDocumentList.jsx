import React from 'react';
import {useInfiniteQuery} from '@tanstack/react-query';
import {ExternalLink} from 'lucide-react';
import {ieCall} from '@/components/ie/ieClient';
import {Button} from '@/components/ui/button';
import {ExecutedBadge} from '@/components/StatusBadge';
import {ProgressTracker,getLegalDocSteps,getDMASteps,getJCTSteps} from '@/components/documents/ProgressTracker';
import IEPanel from '@/components/ie/IEPanel';
import IEQueryState from '@/components/ie/IEQueryState';
import {DOCUMENT_TYPE,formatDate} from '@/lib/portal';
export default function IEProjectDocumentList({engagementId,kind,title}){
 const query=useInfiniteQuery({queryKey:['ie-project-documents',engagementId,kind],initialPageParam:'',queryFn:({pageParam})=>ieCall('projectDocuments',{engagement_id:engagementId,kind,cursor:pageParam}),getNextPageParam:p=>p.has_more?p.next_cursor:undefined,retry:false});
 const items=query.data?.pages.flatMap(p=>p.items)||[];
 return <IEPanel title={title}><IEQueryState query={query}>
  {!items.length&&<p className="py-5 text-sm text-muted-foreground">No {title.toLowerCase()} recorded.</p>}
  <div className="divide-y divide-border">{items.map(doc=><article key={doc.id} className="space-y-3 py-4">
   <div className="flex flex-wrap items-center justify-between gap-3"><h3 className="text-sm font-semibold">{doc.document_type?(DOCUMENT_TYPE[doc.document_type]?.label||doc.document_type):title} · {doc.document_id}</h3><ExecutedBadge status={doc.executed}/></div>
   <ProgressTracker steps={(kind==='dma'?getDMASteps:kind==='jct'?getJCTSteps:getLegalDocSteps)(doc)}/>
   <p className="text-xs text-muted-foreground">Drafted: {formatDate(doc.drafted_date)||'Not recorded'} · Drafting due: {formatDate(doc.drafting_due_date)||'Not recorded'} · Executed: {formatDate(doc.date_of_execution)||'Not recorded'}{doc.approval_status?` · ${doc.approval_status}`:''}</p>
   <p className="text-xs text-muted-foreground">Approval date: {formatDate(doc.approval_date)||'Not recorded'} · Sent for signing: {formatDate(doc.sent_to_client||doc.sent_for_signing)||'Not recorded'} · Signing target: {formatDate(doc.signing_target_date)||'Not recorded'}</p>
   {doc.approvers_name&&<p className="text-xs">Approver: {doc.approvers_name}</p>}
   {doc.approval_comments&&<p className="whitespace-pre-wrap text-sm">Approval comments: {doc.approval_comments}</p>}
   {doc.comments&&<p className="whitespace-pre-wrap text-sm">{doc.comments}</p>}
   {/^https:\/\//i.test(doc.link_to_file||'')?<a href={doc.link_to_file} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-sm font-semibold hover:underline"><ExternalLink className="h-4 w-4"/>Open document</a>:<p className="text-xs text-muted-foreground">File link not recorded.</p>}
  </article>)}</div>
  {query.hasNextPage&&<Button variant="outline" disabled={query.isFetchingNextPage} onClick={()=>query.fetchNextPage()}>{query.isFetchingNextPage?'Loading…':'Load more'}</Button>}
 </IEQueryState></IEPanel>;
}