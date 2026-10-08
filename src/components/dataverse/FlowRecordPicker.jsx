import React, { useState } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
export default function FlowRecordPicker({ table, selected, onSelect }) {
  const [search, setSearch] = useState(''), entity = table === 'projects' ? 'Project' : 'Contact', field = table === 'projects' ? 'name' : 'full_name';
  const escaped = search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const query = useInfiniteQuery({ queryKey: ['dataverse-records', table, escaped], initialPageParam: undefined, queryFn: ({ pageParam }) => base44.entities[entity].filter({ dataverse_id: { $exists: true, $nin: [null, ''] }, ...(escaped ? { [field]: { $regex: escaped, $options: 'i' } } : {}) }, { sort: field, limit: 50, cursor: pageParam, fields: [field, 'dataverse_id'] }), getNextPageParam: page => page.has_more ? page.next_cursor : undefined });
  const items = query.data?.pages.flatMap(page => page.items) || [];
  return <section className="space-y-3 rounded-panel border border-border bg-card p-5"><Input aria-label="Find an ALSight record" placeholder={`Search ${table}…`} value={search} onChange={e => setSearch(e.target.value)} />
    {query.isPending ? <p role="status" className="text-sm text-muted-foreground">Loading linked records…</p> : query.isError ? <><p role="alert" className="text-sm text-destructive">Unable to load records.</p><Button variant="outline" onClick={() => query.refetch()}>Try again</Button></> : !items.length ? <p className="text-sm text-muted-foreground">No linked records match. Ask an administrator to synchronise this table.</p> : <div className="max-h-80 space-y-1 overflow-y-auto">{items.map(item => <button key={item.id} type="button" onClick={() => onSelect(item.id)} className={`block w-full rounded-md border p-3 text-left text-sm transition-colors ${selected === item.id ? 'border-primary bg-primary/10' : 'border-border hover:bg-muted'}`}>{item[field]}</button>)}</div>}
    {query.hasNextPage && <Button variant="outline" disabled={query.isFetchingNextPage} onClick={() => query.fetchNextPage()}>Load more</Button>}
  </section>;
}