import React from 'react';
import {useInfiniteQuery} from '@tanstack/react-query';
import {Button} from '@/components/ui/button';
import {coCall} from '@/components/contingency/live/useContingencyOperations';
export default function COProjects({data}){
 const q=useInfiniteQuery({queryKey:['co','projects',data.incident?.id],queryFn:({pageParam})=>coCall('projects',{cursor:pageParam}),initialPageParam:null,getNextPageParam:p=>p.has_more?p.next_cursor:undefined,retry:false});
 return <section className="cc-panel"><h2>Projects and statuses</h2><p className="my-3 text-sm text-muted-foreground">All Hub-held projects, including inactive projects. These saved statuses remain available without Microsoft; they are not a live Microsoft feed.</p>
 {q.isPending?<p role="status">Loading projects…</p>:q.error?<div role="alert"><p className="text-destructive">{q.error.response?.data?.error||q.error.message}</p><Button variant="outline" onClick={()=>q.refetch()}>Retry</Button></div>:<>
 <div className="overflow-x-auto"><table className="cc-table"><thead><tr><th>Project</th><th>Client</th><th>Project status</th><th>Live project</th><th>Legal status</th><th>Approval status</th></tr></thead><tbody>{q.data.pages.flatMap(p=>p.items).map(p=><tr key={p.id}><td><strong>{p.name}</strong><p className="text-xs text-muted-foreground">{p.project_number||'No project number'}</p></td><td>{p.client_name||'Not recorded'}</td><td className="capitalize">{p.status||'Not recorded'}</td><td>{p.live_project===true?'Yes':p.live_project===false?'No':'Not recorded'}</td><td>{p.legal_status||'Not recorded'}</td><td>{p.approval_status||'Not recorded'}</td></tr>)}</tbody></table></div>
 {!q.data.pages[0].items.length&&<p className="py-4">No projects have been saved in the Hub.</p>}{q.hasNextPage&&<Button className="mt-4" variant="outline" disabled={q.isFetchingNextPage} onClick={()=>q.fetchNextPage()}>{q.isFetchingNextPage?'Loading…':'Load more projects'}</Button>}</>}
 </section>;
}