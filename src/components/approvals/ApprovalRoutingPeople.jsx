import React, {useState} from 'react';
import {useInfiniteQuery} from '@tanstack/react-query';
import {Link} from 'react-router-dom';
import {Input} from '@/components/ui/input';
import {Button} from '@/components/ui/button';
import approvalClient from '@/components/approvals/approvalClient';
export default function ApprovalRoutingPeople({selected,onChange,disabled}) {
 const [search,setSearch]=useState('');
 const people=useInfiniteQuery({queryKey:['approval-routing-people',search],initialPageParam:undefined,retry:false,queryFn:({pageParam})=>approvalClient('routingPeople',{search,...(pageParam ? {cursor:pageParam} : {})}),getNextPageParam:page=>page.has_more ? page.next_cursor : undefined});
 const rows=people.data?.pages.flatMap(page=>page.items) || [];
 const toggle=email=>onChange(selected.includes(email) ? selected.filter(value=>value!==email) : [...selected,email]);
 return <div className="space-y-3"><h4 className="font-semibold">Named individuals</h4><Input aria-label="Find an approver" placeholder="Search people by name or email…" value={search} onChange={e=>setSearch(e.target.value)} disabled={disabled}/>
  <div className="flex flex-wrap gap-2">{selected.map(email=><Button key={email} type="button" variant="secondary" size="sm" disabled={disabled} onClick={()=>toggle(email)} aria-label={`Remove ${email}`}>{email} ×</Button>)}</div>
  {people.isPending ? <p role="status" className="text-sm text-muted-foreground">Loading people…</p> : people.isError ? <div><p role="alert" className="text-sm text-destructive">Unable to load people.</p><Button type="button" variant="outline" onClick={()=>people.refetch()}>Try again</Button></div> : <div className="max-h-60 space-y-2 overflow-y-auto">{rows.length ? rows.map(person=><label key={person.id} className="flex items-start gap-2 text-sm"><input type="checkbox" className="mt-1 accent-primary" checked={selected.includes(person.email)} disabled={disabled || !person.enabled || (!selected.includes(person.email) && selected.length>=20)} onChange={()=>toggle(person.email)}/><span><span className="block font-medium">{person.full_name}</span><span className="block text-muted-foreground">{person.email}</span>{!person.enabled && <span className="block text-xs text-muted-foreground">Needs approval access and an internal portal account</span>}</span></label>) : <p className="text-sm text-muted-foreground">No matching people.</p>}</div>}
  {people.hasNextPage && <Button type="button" variant="outline" size="sm" disabled={people.isFetchingNextPage} onClick={()=>people.fetchNextPage()}>Load more people</Button>}
  <Link to="/people" className="text-sm underline">Manage people and approval access</Link>
 </div>;
}