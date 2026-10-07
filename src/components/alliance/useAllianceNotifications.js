import {useEffect} from 'react';
import {useQuery,useInfiniteQuery,useQueryClient} from '@tanstack/react-query';
import {base44} from '@/api/base44Client';
import {INTERNAL_ROLES} from '@/lib/portal';
import allianceRequest from '@/components/alliance/allianceClient';
export default function useAllianceNotifications(user,open) {
  const cache=useQueryClient(),key=['alliance-notifications',user?.id,user?.role],enabled=!!user?.id && INTERNAL_ROLES.includes(user.role);
  const query={user_id:user?.id,dismissed_at:{$exists:false}};
  const count=useQuery({queryKey:[...key,'count'],enabled,staleTime:30000,refetchInterval:60000,queryFn:()=>base44.entities.AllianceNotification.count({...query,read_at:{$exists:false}})});
  const page=useInfiniteQuery({queryKey:[...key,'list'],enabled:enabled && open,initialPageParam:null,staleTime:30000,queryFn:({pageParam})=>base44.entities.AllianceNotification.filter(query,{sort:'-created_date',limit:20,...(pageParam ? {cursor:pageParam} : {})}),getNextPageParam:page=>page.has_more ? page.next_cursor : undefined});
  const refresh=()=>cache.invalidateQueries({queryKey:['alliance-notifications',user?.id]});
  const update=async(row,dismiss=false)=>{await allianceRequest('notificationRead',{id:row.id,dismiss});await refresh();};
  useEffect(()=>{
    if(!enabled) return;
    let timer;
    const unsubscribe=base44.entities.AllianceNotification.subscribe(()=>{clearTimeout(timer);timer=setTimeout(()=>cache.invalidateQueries({queryKey:['alliance-notifications',user.id]}),300);});
    return()=>{clearTimeout(timer);unsubscribe();};
  },[enabled,user?.id,cache]);
  return {enabled,total:count.data || 0,rows:page.data?.pages.flatMap(part=>part.items) || [],loading:enabled && open && page.isPending,error:count.error?.message || page.error?.message,update,hasMore:page.hasNextPage,loadMore:()=>page.fetchNextPage(),loadingMore:page.isFetchingNextPage};
}