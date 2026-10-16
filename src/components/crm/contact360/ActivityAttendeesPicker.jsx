import React,{useEffect,useState} from 'react';
import {useInfiniteQuery} from '@tanstack/react-query';
import {base44} from '@/api/base44Client';
import {useAuth} from '@/lib/AuthContext';
import {Button} from '@/components/ui/button';
import {Popover,PopoverTrigger,PopoverContent} from '@/components/ui/popover';
import {Command,CommandInput,CommandList,CommandItem,CommandGroup} from '@/components/ui/command';
import {Check,ChevronsUpDown,X} from 'lucide-react';
export default function ActivityAttendeesPicker({value,onChange,disabled}) {
 const {user}=useAuth();
 const [open,setOpen]=useState(false),[search,setSearch]=useState(''),[term,setTerm]=useState('');
 useEffect(()=>{const timer=setTimeout(()=>setTerm(search.trim()),250);return()=>clearTimeout(timer);},[search]);
 const query=useInfiniteQuery({queryKey:['activity-attendee-people',user?.id,user?.role,term],enabled:open&&!disabled,initialPageParam:null,retry:false,queryFn:({pageParam})=>{
  const pattern=term.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
  return base44.entities.Contact.filter({status:{$ne:'inactive'},...(term?{$or:[{full_name:{$regex:pattern,$options:'i'}},{email:{$regex:pattern,$options:'i'}}]}:{})},{sort:'full_name',limit:20,fields:['full_name','email','company_name'],...(pageParam?{cursor:pageParam}:{})});
 },getNextPageParam:page=>page.has_more?page.next_cursor:undefined});
 const toggle=person=>onChange(value.some(item=>item.id===person.id)?value.filter(item=>item.id!==person.id):[...value,{id:person.id,name:person.full_name}]);
 return <div className="space-y-1 text-sm"><span id="activity-attendees-label">Attendees</span>
  <Popover open={open} onOpenChange={setOpen}><PopoverTrigger asChild><Button type="button" variant="outline" role="combobox" aria-expanded={open} aria-labelledby="activity-attendees-label" disabled={disabled} className="w-full justify-between bg-background font-normal"><span>{value.length?`${value.length} selected`:'Select people…'}</span><ChevronsUpDown className="h-4 w-4"/></Button></PopoverTrigger>
   <PopoverContent align="start" className="w-[var(--radix-popover-trigger-width)] p-0"><Command shouldFilter={false}><CommandInput aria-label="Search attendees" placeholder="Search people by name or email…" value={search} onValueChange={setSearch}/><CommandList>
    {(query.isPending||search.trim()!==term)&&<p role="status" className="p-3 text-sm text-muted-foreground">Searching people…</p>}
    {query.error&&<div className="p-3"><p role="alert" className="text-sm text-destructive">{query.error.message}</p><Button type="button" variant="ghost" size="sm" onClick={()=>query.refetch()}>Try again</Button></div>}
    {search.trim()===term&&<CommandGroup>{query.data?.pages.flatMap(page=>page.items).map(person=>{const selected=value.some(item=>item.id===person.id);return <CommandItem key={person.id} value={person.id} disabled={!selected&&value.length>=50} onSelect={()=>toggle(person)}><Check className={selected?'opacity-100':'opacity-0'}/><span>{person.full_name}<span className="block text-xs text-muted-foreground">{[person.company_name,person.email].filter(Boolean).join(' · ')}</span></span></CommandItem>;})}</CommandGroup>}
    {query.data&&!query.data.pages[0].items.length&&!query.isFetching&&<p className="p-3 text-sm text-muted-foreground">No people found.</p>}
    {query.hasNextPage&&<Button type="button" variant="ghost" className="w-full" disabled={query.isFetching} onClick={()=>query.fetchNextPage()}>{query.isFetchingNextPage?'Loading…':'Load more people'}</Button>}
   </CommandList></Command></PopoverContent>
  </Popover>
  {value.length>0&&<ul className="flex flex-wrap gap-1">{value.map(person=><li key={person.id} className="flex items-center gap-1 rounded-md border border-border bg-card px-2 py-1 text-xs"><span>{person.name}</span><button type="button" disabled={disabled} aria-label={`Remove ${person.name}`} className="rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50" onClick={()=>onChange(value.filter(item=>item.id!==person.id))}><X className="h-3 w-3"/></button></li>)}</ul>}
 </div>;
}