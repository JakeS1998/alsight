import React,{useState,useEffect} from 'react';
import {useInfiniteQuery} from '@tanstack/react-query';
import {ieCall} from '@/components/ie/ieClient';
import {Popover,PopoverTrigger,PopoverContent} from '@/components/ui/popover';
import {Input} from '@/components/ui/input';
import {Button} from '@/components/ui/button';
import useAliceLookup from '@/components/forms/useAliceLookup';
import resolveIEFormRecord from '@/components/forms/resolveIEFormRecord';
export default function IERelationshipPicker({kind,value,label,onChange,clientId,disabled=false}){
 const [open,setOpen]=useState(false),[search,setSearch]=useState(''),[term,setTerm]=useState('');
 const aliceRef=useAliceLookup({value:value||'',options:[],onChange,label:kind,resolve:name=>resolveIEFormRecord({kind,name,clientId})});
 useEffect(()=>{const timer=setTimeout(()=>setTerm(search),250);return()=>clearTimeout(timer);},[search]);
 const query=useInfiniteQuery({queryKey:['ie-lookup',kind,clientId,term],enabled:open&&!disabled,initialPageParam:'',retry:false,queryFn:({pageParam})=>ieCall('lookup',{kind,client_id:clientId,search:term,cursor:pageParam}),getNextPageParam:p=>p.has_more?p.next_cursor:undefined});
 return <Popover open={open} onOpenChange={setOpen}><PopoverTrigger asChild><Button ref={aliceRef} data-alice-lookup type="button" variant="outline" disabled={disabled} className="w-full justify-start truncate">{label||`Select ${kind}`}</Button></PopoverTrigger><PopoverContent align="start" className="w-80 space-y-2"><Input aria-label={`Search ${kind}`} value={search} placeholder={`Search ${kind}…`} onChange={e=>setSearch(e.target.value)}/><div className="max-h-60 space-y-1 overflow-y-auto"><button type="button" className="w-full rounded p-2 text-left text-xs text-muted-foreground hover:bg-muted" onClick={()=>{onChange(null);setOpen(false);}}>Clear selection</button>{query.isPending&&<p role="status" className="p-2 text-sm">Loading…</p>}{query.error&&<p role="alert" className="text-sm text-destructive">{query.error.message}</p>}{query.data?.pages.flatMap(p=>p.items).map(item=><button type="button" key={item.id} className="block w-full rounded p-2 text-left text-sm hover:bg-muted" onClick={()=>{onChange(item);setOpen(false);}}>{item.name}{item.project_number&&<span className="ml-2 text-xs text-muted-foreground">{item.project_number}</span>}</button>)}{query.data&&!query.data.pages[0].items.length&&<p className="p-2 text-xs text-muted-foreground">No accessible matches. Private opportunities require existing access.</p>}{query.hasNextPage&&<Button type="button" variant="ghost" size="sm" disabled={query.isFetchingNextPage} onClick={()=>query.fetchNextPage()}>Load more</Button>}</div></PopoverContent></Popover>;
}