import { useEffect } from 'react';
import { useQuery, useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { plannerDay } from '@/components/dashboard/plannerDates';
import { roleAgendaSources, loadRoleAgendaPage } from '@/components/dashboard/roleAgendaQueries';
import assignedRoles from '@/components/data/assignedRoles';
export default function useRoleAgenda(user) {
 const client=useQueryClient(),roles=assignedRoles(user).filter(role=>['bsm','bdm'].includes(role)),roleKey=roles.sort().join(','),enabled=!!user?.id && roles.length>0,day=plannerDay();
 const identity=useQuery({queryKey:['role-agenda-identity',user?.id,user?.email],enabled:enabled && !!user.email,staleTime:300000,queryFn:async()=>{
  const email=user.email.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
  const page=await base44.entities.Contact.filter({email:{$regex:`^${email}$`,$options:'i'}},{limit:1,fields:['aad_id']});return page.items[0]?.aad_id;
 }});
 const ids=[...new Set([user?.id,user?.staff_aad_id,user?.data?.staff_aad_id,user?.dataverse_systemuser_id,user?.data?.dataverse_systemuser_id,user?.delegate_of,user?.data?.delegate_of,identity.data].filter(Boolean))].sort();
 const query=useInfiniteQuery({queryKey:['role-agenda',user?.id,user?.role,roleKey,ids,day],enabled:enabled && (!user.email || identity.isSuccess),initialPageParam:{},staleTime:60000,refetchInterval:60000,queryFn:({pageParam})=>loadRoleAgendaPage(roleAgendaSources(user,ids,day),pageParam,day),getNextPageParam:page=>page.more ? page.next : undefined});
 useEffect(()=>{
  if(!enabled)return;
  let timer;const refresh=()=>{clearTimeout(timer);timer=setTimeout(()=>client.invalidateQueries({queryKey:['role-agenda']}),500);};
  const stops=(roles.includes('bsm') ? ['LegalDocument','DMA','JCT','Project'] : ['Project']).map(entity=>base44.entities[entity].subscribe(refresh));
  return ()=>{clearTimeout(timer);stops.forEach(stop=>stop());};
 },[enabled,roleKey,client]);
 return {enabled,roles,rows:(query.data?.pages.flatMap(page=>page.rows) || []).sort((a,b)=>a.sort.localeCompare(b.sort)),loading:enabled && (identity.isFetching || query.isPending) && !identity.error,error:identity.error || query.error,more:query.hasNextPage,loadingMore:query.isFetchingNextPage,loadMore:query.fetchNextPage,refresh:()=>identity.error ? identity.refetch() : query.refetch()};
}