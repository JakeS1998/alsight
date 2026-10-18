import React from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { assignedTaskQuery, taskRow } from '@/components/tasks/assignedTaskQueries';
import MetricRecordList from '@/components/adaptive/MetricRecordList';
import workspaceSignal from '@/components/adaptive/workspaceSignal';
import { localDay } from '@/components/adaptive/adaptiveTime';
export default function MetricTaskSource({source,user,contacts,onSelect}) {
 const query=useInfiniteQuery({queryKey:['adaptive-task-drilldown',user.id,source.entity,contacts],initialPageParam:null,queryFn:({pageParam})=>base44.entities[source.entity].filter(assignedTaskQuery(source,user,contacts),{sort:source.due,limit:10,...(pageParam?{cursor:pageParam}:{})}),getNextPageParam:page=>page.has_more?page.next_cursor:undefined,staleTime:120000,retry:false});
 const rows=(query.data?.pages||[]).flatMap(page=>page.items.map(record=>({...taskRow(source,record),...workspaceSignal(taskRow(source,record),localDay()),why:'Included because this open task is assigned to you using the same ownership rules as the homepage total.',label:'Open assigned task',detail:record[source.due]?`Recorded deadline: ${String(record[source.due]).slice(0,10)}`:'No deadline recorded.'})));
 return <section className="space-y-3"><h3 className="font-semibold">{source.label}</h3>{query.isPending&&<p role="status">Loading assigned work…</p>}{query.error&&<p role="alert">This source is unavailable. <button className="underline" onClick={()=>query.refetch()}>Try again</button></p>}<MetricRecordList rows={rows} onSelect={onSelect}/>{!query.isPending&&!query.error&&!rows.length&&<p className="text-sm text-muted-foreground">No open tasks assigned to you in this source.</p>}{query.hasNextPage&&<button className="rounded-lg border border-border p-2 text-sm" disabled={query.isFetchingNextPage} onClick={()=>query.fetchNextPage()}>{query.isFetchingNextPage?'Loading…':'Load more assigned tasks'}</button>}</section>;
}