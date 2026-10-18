import React from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import projectScope from '@/components/projects/projectScope';
import MetricRecordList from '@/components/adaptive/MetricRecordList';
export default function MetricProjectList({user,contacts,onSelect}) {
 const scope={...projectScope(user,contacts[0]?.aad_id),status:{$ne:'inactive'},live_project:true};
 const query=useInfiniteQuery({queryKey:['adaptive-project-drilldown',user.id,scope],initialPageParam:null,queryFn:({pageParam})=>base44.entities.Project.filter(scope,{sort:'-updated_date',limit:20,fields:['name','client_name','updated_date'],...(pageParam?{cursor:pageParam}:{})}),getNextPageParam:page=>page.has_more?page.next_cursor:undefined,staleTime:120000,retry:false});
 const rows=(query.data?.pages||[]).flatMap(page=>page.items.map(project=>({id:project.id,title:project.name,detail:project.client_name,why:'Included because this is an accessible live project, excluding inactive records. No action is implied.',label:'Open project',to:`/projects/${project.id}`})));
 return <section className="space-y-3">{query.isPending&&<p role="status">Loading live projects…</p>}{query.error&&<p role="alert">Projects could not be loaded. <button className="underline" onClick={()=>query.refetch()}>Try again</button></p>}<MetricRecordList rows={rows} onSelect={onSelect}/>{!query.isPending&&!query.error&&!rows.length&&<p className="text-sm text-muted-foreground">No accessible live projects found.</p>}{query.hasNextPage&&<button className="rounded-lg border border-border p-2 text-sm" disabled={query.isFetchingNextPage} onClick={()=>query.fetchNextPage()}>{query.isFetchingNextPage?'Loading…':'Load more live projects'}</button>}</section>;
}