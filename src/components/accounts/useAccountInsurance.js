import {useEffect} from 'react';
import {useInfiniteQuery,useQuery,useQueryClient} from '@tanstack/react-query';
import {base44} from '@/api/base44Client';
import {useAuth} from '@/lib/AuthContext';
import {insuranceWindow,insuranceFilters} from '@/components/accounts/insuranceDates';
import {liveInsuranceQuery,uncoveredOverdueQuery} from '@/components/accounts/insuranceCoverage';
export default function useAccountInsurance(account,filter,search) {
 const {user}=useAuth(),cache=useQueryClient(),window=insuranceWindow(),filters=insuranceFilters(window);
 const ids=[...new Set([account.id,account.dataverse_id?.toLowerCase()].filter(Boolean))],base={account_id:{$in:ids}};
 const pattern=search.trim().replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
 const query={...base,...filters[filter],...(pattern ? {$and:[...(filters[filter].$or ? [{$or:filters[filter].$or}] : []),{$or:['name','policy_number','policy_type','insurer'].map(field=>({[field]:{$regex:pattern,$options:'i'}}))}]} : {})};
 if(pattern && query.$or)delete query.$or;
 const key=['account-insurance',user?.id,user?.role,account.id,'renewal'];
 const coverageOptions={queryKey:[...key,'live-types',window.today],queryFn:async()=>{const page=await base44.entities.SupplierInsurance.filter(liveInsuranceQuery(base,window),{distinct:'policy_type',limit:1000});return page.items;},staleTime:60000,retry:false};
 const coverage=useQuery(coverageOptions);
 const policies=useInfiniteQuery({queryKey:[...key,'policies',filter,pattern,window.today],initialPageParam:undefined,queryFn:async({pageParam})=>{const covered=await cache.fetchQuery(coverageOptions);return base44.entities.SupplierInsurance.filter(filter==='expired' ? uncoveredOverdueQuery(query,{},covered) : query,{sort:'-renewal_date',limit:25,cursor:pageParam});},getNextPageParam:page=>page.has_more ? page.next_cursor : undefined,retry:false});
 const metrics=useQuery({queryKey:[...key,'metrics',window.today],queryFn:async()=>{const covered=await cache.fetchQuery(coverageOptions),counts={};await Promise.all(['all','expired','expiring','missing'].map(async status=>{counts[status]=await base44.entities.SupplierInsurance.count(status==='expired' ? uncoveredOverdueQuery(base,filters.expired,covered) : {...base,...filters[status]});}));return counts;},retry:false});
 useEffect(()=>base44.entities.SupplierInsurance.subscribe(event=>{if(event.type==='delete' || ids.includes(event.data?.account_id))cache.invalidateQueries({queryKey:key});}),[cache,user?.id,user?.role,account.id,account.dataverse_id]);
 return {policies,metrics,window,coveredTypes:coverage.data || [],refresh:()=>cache.invalidateQueries({queryKey:key})};
}