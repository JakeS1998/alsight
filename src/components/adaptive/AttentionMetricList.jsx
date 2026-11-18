import React from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { attentionSources, loadAttentionSource } from '@/components/adaptive/attentionPages';
import { rankActions, roleContext } from '@/components/adaptive/adaptiveEngine';
import MetricRecordList from '@/components/adaptive/MetricRecordList';
import AttentionSourceGuide from '@/components/adaptive/AttentionSourceGuide';

export default function AttentionMetricList({data,user,onSelect,onComplete}) {
 const query=useInfiniteQuery({
  queryKey:['adaptive-attention-list',user.id,data.refreshedAt],
  initialPageParam:attentionSources(data),
  queryFn:async({pageParam})=>{
   const items=[],next=[],failed=[];
   for(let offset=0;offset<pageParam.length;offset+=4){
    await Promise.all(pageParam.slice(offset,offset+4).map(async entry=>{
     try{
      const result=await loadAttentionSource(entry,data,user);
      items.push(...result.items);
      if(result.nextCursor && result.nextCursor!==entry.cursor)next.push({...entry,cursor:result.nextCursor});
     }catch{failed.push(entry);}
    }));
   }
   return {items,next,failed};
  },
  getNextPageParam:page=>page.next.length ? page.next : undefined,
  staleTime:120000,retry:false,
 });
 const pages=query.data?.pages||[];
 const rows=rankActions([...new Map(pages.flatMap(page=>page.items).map(row=>[row.key,row])).values()],roleContext(user));
 const partial=data.priorityTotal==null || query.isError || (pages.some(page=>page.failed.length) && rows.length!==data.priorityTotal);
 const inaccessible=!query.isPending && !query.hasNextPage && data.priorityTotal!=null && rows.length<data.priorityTotal;
 return <>
  <div className="adaptive-today at-metric-explanation"><AttentionSourceGuide data={data}/></div>
  {query.isPending&&<p role="status">Loading attention items…</p>}
  {(partial||inaccessible)&&<p role="status" className="text-sm text-muted-foreground">Some counted items could not be displayed. Only records available through your access are shown. {partial&&<button type="button" className="underline" disabled={query.isFetching} onClick={()=>query.refetch()}>Try again</button>}</p>}
  <MetricRecordList rows={rows} onSelect={onSelect} onComplete={onComplete}/>
  {!query.isPending&&!partial&&!inaccessible&&!rows.length&&<p>No items require attention.</p>}
  {query.hasNextPage&&<button type="button" className="rounded-lg border border-border p-2 text-sm" disabled={query.isFetching} onClick={()=>query.fetchNextPage()}>{query.isFetchingNextPage?'Loading…':'Load more attention items'}</button>}
 </>;
}