import React,{useState,useEffect} from 'react';
import {useQuery,useInfiniteQuery} from '@tanstack/react-query';
import {useAuth} from '@/lib/AuthContext';
import {ieCall} from '@/components/ie/ieClient';
import IEFilters from '@/components/ie/IEFilters';
import IERegisterTable from '@/components/ie/IERegisterTable';
import IEQueryState from '@/components/ie/IEQueryState';
import {Button} from '@/components/ui/button';
export default function IERegister({classifications}){
 const {user}=useAuth(),[filters,setFilters]=useState({}),[applied,setApplied]=useState({});
 useEffect(()=>{const timer=setTimeout(()=>setApplied(filters),250);return()=>clearTimeout(timer);},[filters]);
 const options=useQuery({queryKey:['ie-options',user.id],queryFn:()=>ieCall('options'),staleTime:60000,retry:false});
 const query=useInfiniteQuery({queryKey:['ie-register',user.id,user.role,applied],initialPageParam:'',queryFn:({pageParam})=>ieCall('list',{filters:applied,cursor:pageParam}),getNextPageParam:p=>p.has_more?p.next_cursor:undefined,retry:false});
 return <div className="space-y-4"><IEFilters value={filters} onChange={setFilters} options={options.data} classifications={classifications}/>{options.error&&<p role="alert" className="text-xs text-destructive">Filter options unavailable. {options.error.message}</p>}<IEQueryState query={query}><div className="overflow-hidden rounded-panel border border-border bg-card"><IERegisterTable items={query.data?.pages.flatMap(p=>p.items)||[]}/></div></IEQueryState>{query.hasNextPage&&<div className="flex justify-center"><Button variant="outline" disabled={query.isFetchingNextPage} onClick={()=>query.fetchNextPage()}>{query.isFetchingNextPage?'Loading…':'Load more engagements'}</Button></div>}</div>;
}