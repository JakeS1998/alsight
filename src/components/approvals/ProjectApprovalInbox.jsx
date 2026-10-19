import React,{useEffect,useState} from 'react';
import {useInfiniteQuery,useQueryClient} from '@tanstack/react-query';
import {base44} from '@/api/base44Client';
import {useAuth} from '@/lib/AuthContext';
import {Button} from '@/components/ui/button';
import ProjectApprovalCard from '@/components/approvals/ProjectApprovalCard';
import projectApprovalClient from '@/components/approvals/projectApprovalClient';
import SubmissionSummary from '@/components/forms/SubmissionSummary';
export default function ProjectApprovalInbox({view}) {
 const {user}=useAuth(),client=useQueryClient(),[notice,setNotice]=useState(''),[submitted,setSubmitted]=useState(null),[status,setStatus]=useState(['pending','approved'].includes(view) ? view : 'all');
 const query=useInfiniteQuery({queryKey:['project-approvals',user?.id,status],initialPageParam:undefined,retry:false,queryFn:({pageParam})=>projectApprovalClient('list',{view:status,...(pageParam ? {cursor:pageParam} : {})}),getNextPageParam:page=>page.has_more ? page.next_cursor : undefined,refetchInterval:30000});
 useEffect(()=>{const unsubscribe=base44.entities.ProjectApproval.subscribe(()=>client.invalidateQueries({queryKey:['project-approvals']}));return unsubscribe;},[client]);
 const saved=(message,details)=>{if(message){setNotice(message);setSubmitted(details);}client.invalidateQueries({queryKey:['project-approvals']});client.invalidateQueries({queryKey:['project-number-counter']});client.invalidateQueries({queryKey:['approval-summary']});};
 const rows=query.data?.pages.flatMap(page=>page.items) || [];
 return <section className="space-y-3"><h2 className="font-heading text-xl font-semibold">Project approvals{query.data && ` · ${query.data.pages[0].total}`}</h2><div className="flex flex-wrap gap-2">{['pending','approved','rejected','all'].map(value=><Button key={value} variant={status===value ? 'default' : 'outline'} size="sm" onClick={()=>setStatus(value)} aria-pressed={status===value}>{value==='all' ? 'All projects' : value[0].toUpperCase()+value.slice(1)}</Button>)}</div><p className="text-sm text-muted-foreground">The first completed decision closes the request. Approve assigns the next shared project number; Reject requires a reason.</p>{notice && <div role="status"><p className="text-sm text-success">{notice}</p><SubmissionSummary rows={submitted}/></div>}{query.isPending ? <p role="status">Loading project approvals…</p> : query.isError ? <div><p role="alert" className="text-sm text-destructive">{query.error.response?.data?.error || query.error.message}</p><Button variant="outline" onClick={()=>query.refetch()}>Try again</Button></div> : rows.length ? rows.map(request=><ProjectApprovalCard key={request.id} request={request} onSaved={saved}/>) : <p className="text-sm text-muted-foreground">No {status} project approvals.</p>}{query.hasNextPage && <Button variant="outline" disabled={query.isFetchingNextPage} onClick={()=>query.fetchNextPage()}>Load more projects</Button>}</section>;
}