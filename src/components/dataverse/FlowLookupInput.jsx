import React, {useEffect, useState} from 'react';
import {useQuery} from '@tanstack/react-query';
import {Check, ChevronsUpDown} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {Popover, PopoverContent, PopoverTrigger} from '@/components/ui/popover';
import {Command, CommandInput, CommandList, CommandGroup, CommandItem} from '@/components/ui/command';
import flowRequest from '@/components/dataverse/flowClient';
export default function FlowLookupInput({id, field, table, recordId, value, onChange, disabled, label}) {
 const [open,setOpen]=useState(false),[search,setSearch]=useState(''),[term,setTerm]=useState('');
 useEffect(()=>{const timer=setTimeout(()=>setTerm(search),300);return()=>clearTimeout(timer);},[search]);
 const result=useQuery({queryKey:['flow-lookup',table,recordId,field.local,term,value],enabled:Boolean(table&&recordId),retry:false,staleTime:30000,queryFn:()=>flowRequest('lookup',{table,recordId,field:field.local,search:term,selectedId:value||''})});
 const selected=result.data?.selected;
 const choose=option=>{onChange(option.id);setOpen(false);setSearch('');};
 return <div className="space-y-1"><Popover open={open} onOpenChange={setOpen}><PopoverTrigger asChild><Button id={id} type="button" variant="outline" role="combobox" aria-expanded={open} aria-label={label} disabled={disabled} className="w-full justify-between font-normal"><span className="truncate">{value ? selected?.name || (result.isFetching?'Loading current assignment…':'Current assignment unavailable') : 'Select a person…'}</span><ChevronsUpDown/></Button></PopoverTrigger>
  <PopoverContent align="start" className="p-0" style={{width:'var(--radix-popover-trigger-width)'}}><Command shouldFilter={false}><CommandInput aria-label={`Search ${label}`} placeholder="Search by name…" value={search} onValueChange={setSearch} maxLength={100}/><CommandList>
   <CommandGroup><CommandItem value="clear-assignment" onSelect={()=>choose({id:''})}><Check className={value?'opacity-0':'opacity-100'}/>Not recorded</CommandItem></CommandGroup>
   {result.isFetching ? <p role="status" className="p-3 text-sm text-muted-foreground">Searching people…</p> : result.isError ? <div role="alert" className="p-3 text-sm text-destructive">{result.error.message}<Button type="button" variant="link" size="sm" onClick={()=>result.refetch()}>Retry</Button></div> : <CommandGroup>{result.data?.options.map(option=><CommandItem key={option.id} value={option.id} onSelect={()=>choose(option)}><Check className={value===option.id?'opacity-100':'opacity-0'}/>{option.name}</CommandItem>)}</CommandGroup>}
   {!result.isFetching&&!result.isError&&!result.data?.options.length&&<p className="p-3 text-sm text-muted-foreground">No matching people found.</p>}
  </CommandList></Command>{result.data?.has_more&&<p className="border-t p-2 text-xs text-muted-foreground">Refine your search to find more people.</p>}</PopoverContent></Popover><p className="text-xs text-muted-foreground">Search and select by name, or choose Not recorded to clear the assignment.</p></div>;
}