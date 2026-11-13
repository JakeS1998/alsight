import React,{useState} from 'react';
import {useInfiniteQuery} from '@tanstack/react-query';
import {Button} from '@/components/ui/button';
import {coCall} from '@/components/contingency/live/useContingencyOperations';
import COFileExceptionRows from '@/components/contingency/live/COFileExceptionRows';
export default function COFileExceptions(){
 const [status,setStatus]=useState('open');
 const q=useInfiniteQuery({queryKey:['co','file-exceptions',status],initialPageParam:null,queryFn:({pageParam})=>coCall('file_exceptions',{status,...(pageParam?{cursor:pageParam}:{})}),getNextPageParam:p=>p.has_more?p.next_cursor:undefined,staleTime:30000,retry:false});
 const first=q.data?.pages[0],items=q.data?.pages.flatMap(p=>p.items)||[],excluded=status==='excluded';
 return <div className="cc-panel"><div className="flex flex-wrap items-center justify-between gap-3"><h2 className="font-heading text-xl font-bold">{excluded?'Acknowledged file exclusions':'Files too large to back up'}{first?` (${first.total})`:''}</h2><Button variant="outline" disabled={q.isFetching} onClick={()=>q.refetch()}>Refresh exceptions</Button></div>
 <p className="my-3 text-sm text-muted-foreground">Files over 10 MB are skipped so other files can continue. Reduce their size or acknowledge and exclude them from future backups. Acknowledged files no longer block readiness, but are not confirmed backed up and remain excluded even if they change.</p>
 <div className="mb-4 flex flex-wrap gap-2"><Button variant={excluded?'outline':'secondary'} aria-pressed={!excluded} onClick={()=>setStatus('open')}>Open exceptions</Button><Button variant={excluded?'secondary':'outline'} aria-pressed={excluded} onClick={()=>setStatus('excluded')}>Acknowledged / excluded</Button></div>
 {first?.discovery_in_progress&&<p className="mb-3 text-sm text-contingency-dark">Initial folder discovery is still in progress; this is not a complete file inventory.</p>}
 {q.isPending?<p role="status">Loading file exceptions…</p>:q.isError?<div role="alert"><p className="text-destructive">{q.error?.response?.data?.error||q.error?.message||'Unable to load file exceptions.'}</p><Button className="mt-3" variant="outline" onClick={()=>q.refetch()}>Retry</Button></div>:items.length?<COFileExceptionRows items={items}/>:<p className="py-4 text-sm">{excluded?'No files have been acknowledged and excluded.':'No open oversized-file exceptions. Unscanned folders may still contain oversized files.'}</p>}
 {q.hasNextPage&&<Button className="mt-4" variant="outline" disabled={q.isFetching} onClick={()=>q.fetchNextPage()}>{q.isFetchingNextPage?'Loading…':'Load more'}</Button>}</div>;
}