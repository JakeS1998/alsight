import React,{useEffect} from 'react';
import useListState from '@/components/navigation/useListState';
import {useQuery} from '@tanstack/react-query';
import {List,LayoutGrid,ArrowRight} from 'lucide-react';
import {useAuth} from '@/lib/AuthContext';
import {ieCall} from '@/components/ie/ieClient';
import IEFilters from '@/components/ie/IEFilters';
import IERegisterTable from '@/components/ie/IERegisterTable';
import IERegisterCards from '@/components/ie/IERegisterCards';
import IEPagination from '@/components/ie/IEPagination';
import IEQueryState from '@/components/ie/IEQueryState';
export default function IERegister({classifications=[],actions,children}){
 const {user}=useAuth(),[filters,setFilters]=useListState('filters',{}),[applied,setApplied]=useListState('applied',{});
 const [view,setView]=useListState('view','list'),[expanded,setExpanded]=useListState('expanded',false),[paging,setPaging]=useListState('paging',{index:0,cursors:['']});
 const size=expanded?30:8,cursor=paging.cursors[paging.index]||'';
 useEffect(()=>{if(JSON.stringify(filters)===JSON.stringify(applied))return;const timer=setTimeout(()=>{setApplied(filters);setPaging({index:0,cursors:['']});},250);return()=>clearTimeout(timer);},[filters]);
 const options=useQuery({queryKey:['ie-options',user.id],queryFn:()=>ieCall('options'),staleTime:60000,retry:false});
 const query=useQuery({queryKey:['ie-register',user.id,user.role,applied,cursor,size],queryFn:()=>ieCall('list',{filters:applied,cursor,page_size:size}),retry:false});
 const next=()=>setPaging(old=>({index:old.index+1,cursors:[...old.cursors.slice(0,old.index+1),query.data.next_cursor]}));
 const changeFilters=values=>{setExpanded(false);setFilters(values);};
 const active=Object.values(applied).some(Boolean),items=query.data?.items||[];
 return <><IEFilters value={filters} onChange={changeFilters} options={options.data} classifications={classifications} actions={<><div className="ie-view-toggle"><span>View</span><button type="button" aria-label="List view" aria-pressed={view==='list'} onClick={()=>setView('list')}><List/></button><button type="button" aria-label="Card view" aria-pressed={view==='cards'} onClick={()=>setView('cards')}><LayoutGrid/></button></div>{actions}</>}/>{options.error&&<p role="alert" className="mb-3 text-xs text-destructive">Filter options unavailable. {options.error.message}</p>}<div className="ie-dashboard-grid"><section id="ie-engagement-register" className="ie-dashboard-panel ie-register-panel scroll-mt-24"><header className="ie-panel-heading"><div><h2>{active?'Engagement results':expanded?'All engagements':'Recent engagements'}</h2><p>Research, consultancy, marketing and stakeholder engagement.</p></div><button type="button" className="ie-text-action" onClick={()=>{setExpanded(!expanded);setPaging({index:0,cursors:['']});}}>{expanded?'Show recent':'View all'} <ArrowRight/></button></header><IEQueryState query={query}>{view==='list'?<IERegisterTable items={items}/>:<IERegisterCards items={items}/>}<IEPagination page={paging.index} size={size} count={items.length} total={query.data?.total} hasMore={query.data?.has_more} loading={query.isFetching} onPrevious={()=>setPaging(old=>({...old,index:old.index-1}))} onNext={next}/></IEQueryState></section>{children?.(changeFilters)}</div></>;
}