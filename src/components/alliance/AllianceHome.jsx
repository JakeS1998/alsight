import React from 'react';
import {useInfiniteQuery,useQueryClient} from '@tanstack/react-query';
import {useSearchParams} from 'react-router-dom';
import AlliancePulse from '@/components/alliance/AlliancePulse';
import AllianceImpact from '@/components/alliance/AllianceImpact';
import AllianceKnowledge from '@/components/alliance/AllianceKnowledge';
import AllianceStories from '@/components/alliance/AllianceStories';
import PulseGroupNav from '@/components/alliance/PulseGroupNav';
import LookoutSidebar from '@/components/lookout/LookoutSidebar';
import allianceRequest,{allianceError,refreshAlliance} from '@/components/alliance/allianceClient';
export default function AllianceHome({user,projectIds}) {
  const cache=useQueryClient(),[params,setParams]=useSearchParams(),hashtag=params.get('hashtag') || '',groupId=params.get('group') || '',postId=params.get('post') || '';
  const clearHashtag=()=>setParams(current=>{const next=new URLSearchParams(current);next.delete('hashtag');return next;});
  const selectGroup=id=>setParams(current=>{const next=new URLSearchParams(current);next.delete('hashtag');next.delete('post');if(id) next.set('group',id);else next.delete('group');return next;});
  const refresh=()=>refreshAlliance(cache);
  const query=useInfiniteQuery({queryKey:['alliance-layer','home',user.id,user.role,projectIds,groupId,hashtag,postId],initialPageParam:null,queryFn:({pageParam})=>allianceRequest('home',{projectIds,cursor:pageParam,hashtag,groupId,postId}),getNextPageParam:page=>page.has_more ? page.next_cursor : undefined,staleTime:30000,refetchOnWindowFocus:true});
  const first=query.data?.pages[0],data=first ? {...first,pulse:query.data.pages.flatMap(page=>page.pulse)} : null;
  return <section className="w-full min-w-0">
    <div className={groupId ? 'grid min-w-0 items-start gap-5 lg:grid-cols-[240px_minmax(0,1fr)]' : 'grid min-w-0 items-start gap-5 lg:grid-cols-[220px_minmax(0,1fr)] xl:grid-cols-[220px_minmax(0,1fr)_340px]'}>
      <div className="min-w-0 space-y-4"><PulseGroupNav user={user} groupId={groupId} onSelect={selectGroup}/><LookoutSidebar/></div>
      <div className="min-w-0 space-y-4">
        {query.isPending ? <div role="status" className="rounded-panel border border-border bg-card p-6 text-sm text-muted-foreground">Loading Alliance updates…</div> : query.error ? <div role="alert" className="rounded-panel border border-border bg-card p-6 text-sm text-destructive">{allianceError(query.error)} <button type="button" className="underline" onClick={()=>query.refetch()}>Try again</button>{groupId && <button type="button" className="ml-3 underline" onClick={()=>selectGroup('')}>Back to All Alliance</button>}</div> : <>
          <AlliancePulse onLeftGroup={()=>{selectGroup('');refresh();}} postId={postId} key={groupId || 'all-alliance'} data={hashtag ? {...data,milestones:[],lessons:[]} : data} user={user} group={first.group} hashtag={hashtag} onClearHashtag={clearHashtag} onRefresh={refresh} onMore={()=>query.fetchNextPage()} loadingMore={query.isFetchingNextPage} hasMore={query.hasNextPage}/>
        </>}
      </div>
      {!groupId && data?.impact && <aside aria-label="Alliance impact, stories and learning" className="min-w-0 space-y-5 lg:col-start-2 xl:col-start-auto"><AllianceImpact compact data={data.impact}/><AllianceStories data={data}/><AllianceKnowledge lessons={data.lessons}/></aside>}
    </div>
  </section>;
}