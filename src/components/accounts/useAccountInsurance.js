import {useEffect} from 'react';
import {useInfiniteQuery,useQuery,useQueryClient} from '@tanstack/react-query';
import {base44} from '@/api/base44Client';
import {useAuth} from '@/lib/AuthContext';
import {insuranceWindow,insuranceFilters} from '@/components/accounts/insuranceDates';
export default function useAccountInsurance(account,filter,search) {
 const {user}=useAuth(),cache=useQueryClient(),window=insuranceWindow(),filters=insuranceFilters(window);
 const ids=[...new Set([account.id,account.dataverse_id?.toLowerCase()].filter(Boolean))],base={account_id:{$in:ids}};
 const pattern=search.trim().replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
 const query={...base,...filters[filter],...(pattern ? {$and:[...(filters[filter].$or ? [{$or:filters[filter].$or}] : []),{$or:['name','policy_number','policy_type','insurer'].map(field=>({[field]:{$regex:pattern,$options:'i'}}))}]} : {})};
 if(pattern && query.$or)delete query.$or;
 const key=['account-insurance',user?.id,user?.role,account.id,'renewal'];
 const policies=useInfiniteQuery({queryKey:[...key,'policies',filter,pattern,window.today],initialPageParam:undefined,queryFn:({pageParam})=>base44.entities.SupplierInsurance.filter(query,{sort:'renewal_date',limit:25,cursor:pageParam}),getNextPageParam:page=>page.has_more ? page.next_cursor : undefined,retry:false});
 const metrics=useQuery({queryKey:[...key,'metrics',window.today],queryFn:async()=>{const counts={};for(const status of ['all','expired','expiring','missing'])counts[status]=await base44.entities.SupplierInsurance.count({...base,...filters[status]});return counts;},retry:false});
 useEffect(()=>base44.entities.SupplierInsurance.subscribe(event=>{if(event.type==='delete' || ids.includes(event.data?.account_id))cache.invalidateQueries({queryKey:key});}),[cache,user?.id,user?.role,account.id,account.dataverse_id]);
 return {policies,metrics,window,refresh:()=>{policies.refetch();metrics.refetch();}};
}