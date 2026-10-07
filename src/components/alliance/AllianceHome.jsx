import React from 'react';
import {useInfiniteQuery,useQueryClient} from '@tanstack/react-query';
import AlliancePulse from '@/components/alliance/AlliancePulse';
import AllianceImpact from '@/components/alliance/AllianceImpact';
import AllianceKnowledge from '@/components/alliance/AllianceKnowledge';
import AllianceStories from '@/components/alliance/AllianceStories';
import allianceRequest,{allianceError,refreshAlliance} from '@/components/alliance/allianceClient';
export default function AllianceHome({user,projectIds}) {
  const cache=useQueryClient();
  const query=useInfiniteQuery({queryKey:['alliance-layer','home',user.id,user.role,projectIds],initialPageParam:null,queryFn:({pageParam})=>allianceRequest('home',{projectIds,cursor:pageParam}),getNextPageParam:page=>page.has_more ? page.next_cursor : undefined,staleTime:60000,refetchOnWindowFocus:false});
  const first=query.data?.pages[0],data=first ? {...first,pulse:query.data.pages.flatMap(page=>page.pulse)} : null;
  return <section className="min-w-0 space-y-4"><header className="px-1 py-3"><p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Projects + People + Purpose</p><h2 className="mt-2 font-heading text-xl font-extrabold md:text-2xl">WHAT’S HAPPENING ACROSS ALLIANCE</h2><p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground">The people making it happen. The difference we’re working towards. The knowledge we build along the way.</p></header>{query.isPending ? <div role="status" className="rounded-panel border border-border bg-card p-6 text-sm text-muted-foreground">Loading Alliance moments and project stories…</div> : query.error ? <div role="alert" className="rounded-panel border border-border bg-card p-6 text-sm text-destructive">{allianceError(query.error)} <button className="underline" onClick={()=>query.refetch()}>Try again</button></div> : <div className="grid min-w-0 items-start gap-4 lg:grid-cols-2 xl:grid-cols-3"><div className="min-w-0 space-y-4 xl:row-span-2"><AlliancePulse data={data} user={user} onRefresh={()=>refreshAlliance(cache)} onMore={()=>query.fetchNextPage()} loadingMore={query.isFetchingNextPage} hasMore={query.hasNextPage}/></div><AllianceImpact compact data={data.impact}/><AllianceStories data={data}/><div className="min-w-0 xl:col-span-2"><AllianceKnowledge lessons={data.lessons}/></div></div>}</section>;
}