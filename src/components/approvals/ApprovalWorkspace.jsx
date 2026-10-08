import React,{useEffect,useState} from 'react';
import {useQuery} from '@tanstack/react-query';
import {useSearchParams} from 'react-router-dom';
import {Button} from '@/components/ui/button';
import {useAuth} from '@/lib/AuthContext';
import useApprovalInbox from '@/components/approvals/useApprovalInbox';
import approvalClient from '@/components/approvals/approvalClient';
import ApprovalFilters from '@/components/approvals/ApprovalFilters.jsx';
import ApprovalListRow from '@/components/approvals/ApprovalListRow.jsx';
import ApprovalDetailPanel from '@/components/approvals/ApprovalDetailPanel.jsx';
export default function ApprovalWorkspace({view}) {
 const {user}=useAuth(),[params,setParams]=useSearchParams(),selected=params.get('approval');
 const [filters,setFilters]=useState({search:'',sort:'oldest'}),[debounced,setDebounced]=useState(filters);
 useEffect(()=>{const timer=setTimeout(()=>setDebounced(filters),300);return ()=>clearTimeout(timer);},[filters]);
 const options=useQuery({queryKey:['approval-options',user?.id],queryFn:()=>approvalClient('options'),retry:false});
 const inbox=useApprovalInbox(view,true,debounced),items=inbox.data?.pages.flatMap(page=>page.items) || [];
 const select=id=>{const next=new URLSearchParams(params);if(id)next.set('approval',id);else next.delete('approval');setParams(next,{replace:true});};
 return <div className="space-y-4"><ApprovalFilters filters={filters} onChange={setFilters} options={options.data}/><div className={`grid gap-4 ${selected ? 'xl:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]' : ''}`}><section className={selected ? 'hidden xl:block' : ''}><div className="mb-3 flex items-center justify-between"><h2 className="text-sm font-semibold">{view==='pending' ? 'My Approvals' : view==='approved' ? 'Approved by me' : 'All approvals'}</h2><Button size="sm" variant="outline" disabled={inbox.isFetching} onClick={()=>inbox.refetch()}>Refresh</Button></div>{inbox.isPending ? <p role="status" className="text-sm">Loading approvals…</p> : inbox.error ? <p role="alert" className="text-sm text-destructive">{inbox.error.response?.data?.error || inbox.error.message}</p> : items.length ? <div className="space-y-3">{items.map(request=><ApprovalListRow key={request.id} request={request} selected={selected===request.id} onSelect={()=>select(request.id)}/>)}</div> : <div className="rounded-lg border border-border bg-card p-8 text-center"><h3 className="font-semibold">{filters.search || filters.projectName || filters.type || filters.requester ? 'No matching approvals' : view==='pending' ? 'You’re all caught up' : 'No approvals in this view'}</h3><p className="mt-2 text-sm text-muted-foreground">{view==='pending' ? 'There are no approvals currently requiring your decision.' : 'Your authorised document approvals will appear here.'}</p></div>}{inbox.hasNextPage && <Button className="mt-4" variant="outline" disabled={inbox.isFetchingNextPage} onClick={()=>inbox.fetchNextPage()}>{inbox.isFetchingNextPage ? 'Loading…' : 'Load more approvals'}</Button>}</section>{selected && <div className="min-w-0 xl:sticky xl:top-24 xl:self-start"><ApprovalDetailPanel key={selected} id={selected} onClose={()=>select(null)}/></div>}</div></div>;
}