import React from 'react';
import {useInfiniteQuery} from '@tanstack/react-query';
import {useAuth} from '@/lib/AuthContext';
import {Button} from '@/components/ui/button';
import {coCall} from '@/components/contingency/live/useContingencyOperations';
export default function COSourcePicker({data,documents,value,onChange}){
 const {user}=useAuth();
 const q=useInfiniteQuery({queryKey:['co','source-picker',user.id],initialPageParam:null,initialData:{pages:[data],pageParams:[null]},queryFn:({pageParam})=>coCall('status',pageParam?{source_cursor:pageParam}:{}),getNextPageParam:p=>p.dataset_has_more?p.dataset_next_cursor:undefined,staleTime:30000,retry:false});
 const sources=q.data.pages.flatMap(p=>p.datasets).filter(d=>documents?d.kind==='sharepoint':d.kind==='dataverse');
 return <div className="min-w-0 flex-1 space-y-2"><select className="cc-field w-full" aria-label="Contingency source" value={value} onChange={e=>onChange(e.target.value)}><option value="">Choose a source</option>{sources.map(d=><option value={d.id} key={d.id}>{d.label}</option>)}</select>{q.hasNextPage&&<Button variant="outline" disabled={q.isFetching} onClick={()=>q.fetchNextPage()}>{q.isFetchingNextPage?'Loading sources…':'Load more sources'}</Button>}{q.isError&&<p role="alert" className="text-sm text-destructive">{q.error.response?.data?.error||q.error.message}</p>}</div>;
}