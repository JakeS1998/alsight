import React from 'react';
import fullName from '@/components/data/fullName';
import {useInfiniteQuery} from '@tanstack/react-query';
import {base44} from '@/api/base44Client';
import {Button} from '@/components/ui/button';
import {formatDateTime} from '@/lib/portal';
import ReviewQueryState from '@/components/projects/workspace/ReviewQueryState';
export default function ProjectActivityHistory({project,user}) {
 const query=useInfiniteQuery({queryKey:['project-meeting-history',project.id,user.id,user.role],initialPageParam:null,queryFn:({pageParam})=>base44.entities.CRMActivity.filter({project_id:project.id},{sort:'-occurred_at',limit:20,...(pageParam ? {cursor:pageParam} : {})}),getNextPageParam:p=>p.has_more ? p.next_cursor : undefined});
 return <ReviewQueryState query={query}><section className="space-y-3"><h3 className="text-sm font-semibold">Recent project notes / activity</h3>{query.data?.pages.flatMap(p=>p.items).map(a=><article key={a.id} className="rounded-lg border border-border p-3"><p className="text-sm font-medium">{a.subject}</p><p className="mt-1 text-xs text-muted-foreground">{fullName(a.author_name,a.author_id)} · {formatDateTime(a.occurred_at)}</p><p className="mt-2 whitespace-pre-wrap text-sm">{a.description}</p></article>)}{!query.data?.pages[0].items.length && <p className="text-sm text-muted-foreground">No accessible project activity recorded.</p>}{query.hasNextPage && <Button size="sm" variant="outline" disabled={query.isFetchingNextPage} onClick={()=>query.fetchNextPage()}>Load more activity</Button>}</section></ReviewQueryState>;
}