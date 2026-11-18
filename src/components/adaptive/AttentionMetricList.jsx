import React from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { attentionSources, loadAttentionSource } from '@/components/adaptive/attentionPages';
import { rankActions, roleContext } from '@/components/adaptive/adaptiveEngine';
import MetricRecordList from '@/components/adaptive/MetricRecordList';
import AttentionSourceGuide from '@/components/adaptive/AttentionSourceGuide';

import AttentionDeadlineFilter from '@/components/adaptive/AttentionDeadlineFilter';
import {attentionRows,attentionWindow} from '@/components/adaptive/attentionDeadlines';

export default function AttentionMetricList({data,user,onSelect,onComplete,deadlineFilter,onDeadlineFilter,now}) {
 const window=attentionWindow(now), filtered=deadlineFilter!=='all';
 const query=useInfiniteQuery({
  queryKey:['adaptive-attention-list',user.id,data.refreshedAt,deadlineFilter,window.today],
  initialPageParam:attentionSources(data,deadlineFilter),
  queryFn:async({pageParam})=>{
   const items=[],next=[],failed=[];
   for(let offset=0;offset<pageParam.length;offset+=4){
    await Promise.all(pageParam.slice(offset,offset+4).map(async entry=>{
     try{
      const result=await loadAttentionSource(entry,data,user,deadlineFilter,window);
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
 const rows=attentionRows(rankActions([...new Map(pages.flatMap(page=>page.items).map(row=>[row.key,row])).values()],roleContext(user)),deadlineFilter,window);
 const partial=data.priorityTotal==null || query.isError || pages.some(page=>page.failed.length);
 const inaccessible=!filtered && !query.isPending && !query.hasNextPage && data.priorityTotal!=null && rows.length<data.priorityTotal;
 return <>
  <AttentionDeadlineFilter value={deadlineFilter} onChange={onDeadlineFilter}/>
  <div className="adaptive-today at-metric-explanation"><AttentionSourceGuide data={data}/></div>
  {query.isPending&&<p role="status">Loading attention items…</p>}
  {(partial||inaccessible)&&<p role="status" className="text-sm text-muted-foreground">Some counted items could not be displayed. Only records available through your access are shown. {partial&&<button type="button" className="underline" disabled={query.isFetching} onClick={()=>query.refetch()}>Try again</button>}</p>}
  <MetricRecordList rows={rows} onSelect={onSelect} onComplete={onComplete}/>
  {!query.isPending&&!partial&&!inaccessible&&!rows.length&&<p>{query.hasNextPage?'No matches loaded yet. Load more to continue.':filtered?'No items match this deadline filter.':'No items require attention.'}</p>}
  {query.hasNextPage&&<button type="button" className="rounded-lg border border-border p-2 text-sm" disabled={query.isFetching} onClick={()=>query.fetchNextPage()}>{query.isFetchingNextPage?'Loading…':'Load more attention items'}</button>}
 </>;
}