import React,{useState} from 'react';
import {useInfiniteQuery} from '@tanstack/react-query';
import {Button} from '@/components/ui/button';
import {coCall} from '@/components/contingency/live/useContingencyOperations';
import COSharePointFailureRows from '@/components/contingency/live/COSharePointFailureRows';
import downloadSharePointFailures from '@/components/contingency/live/downloadSharePointFailures';
export default function COSharePointFailures(){
 const [downloading,setDownloading]=useState(false),[error,setError]=useState('');
 const q=useInfiniteQuery({queryKey:['co','sharepoint-failures'],initialPageParam:null,queryFn:({pageParam})=>coCall('sharepoint_failures',pageParam?{cursor:pageParam}:{}),getNextPageParam:p=>p.has_more?p.next_cursor:undefined,staleTime:30000,retry:false});
 const first=q.data?.pages[0],items=q.data?.pages.flatMap(p=>p.items)||[];
 async function download(){setDownloading(true);setError('');try{await downloadSharePointFailures();}catch(e){setError(e.response?.data?.error||e.message||'Unable to download the failed-link list.');}finally{setDownloading(false);}}
 return <div className="mt-4 border-t pt-4"><div className="flex flex-wrap items-center justify-between gap-3"><h3 className="font-semibold">Failed SharePoint links{first?` (${first.total})`:''}</h3><div className="flex flex-wrap gap-2"><Button variant="outline" disabled={q.isFetching} onClick={()=>q.refetch()}>Refresh failed links</Button><Button disabled={downloading||q.isPending||first?.total===0} onClick={download}>{downloading?'Preparing list…':'Download failed links (CSV)'}</Button></div></div>
 <p className="mt-2 text-sm text-muted-foreground">Recorded folder-discovery failures and enabled SharePoint sources reporting a backup error. These links need review; affected documents are not confirmed backed up. Older failures show the current project link where the original was not recorded.</p>
 {first?.discovery_in_progress&&<p className="mt-2 text-sm text-contingency-dark">Folder discovery is still running; this list contains failures recorded so far.</p>}{first?.history_limited&&<p className="mt-2 text-sm text-muted-foreground">Folder-discovery history retains the latest 100 failures.</p>}
 {error&&<p className="mt-3 text-sm text-destructive" role="alert">{error}</p>}
 {q.isPending?<p className="mt-3 text-sm" role="status">Loading failed links…</p>:q.isError?<p className="mt-3 text-sm text-destructive" role="alert">{q.error?.response?.data?.error||q.error?.message||'Unable to load failed links.'}</p>:items.length?<details className="mt-3 text-sm"><summary className="cursor-pointer">View failed links and reasons</summary><COSharePointFailureRows items={items}/>{q.hasNextPage&&<Button className="mt-3" variant="outline" disabled={q.isFetching} onClick={()=>q.fetchNextPage()}>{q.isFetchingNextPage?'Loading…':'Load more'}</Button>}</details>:<p className="mt-3 text-sm">No SharePoint link failures are currently recorded.</p>}
 </div>;
}