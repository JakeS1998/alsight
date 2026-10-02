import React, { useState } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
export default function RiskFeedbackList({ packetId }) {
  const [open, setOpen] = useState(false);
  const query = useInfiniteQuery({ queryKey: ['risk-row-comments', packetId], enabled: open, initialPageParam: undefined, refetchInterval: open ? 30000 : false, queryFn: async ({ pageParam }) => (await base44.functions.invoke('manageRiskApprovals', { action: 'comments', packet_id: packetId, ...(pageParam ? { cursor: pageParam } : {}) })).data, getNextPageParam: page => page.has_more ? page.next_cursor : undefined });
  return <section className="space-y-3">
    <Button size="sm" variant="outline" onClick={() => setOpen(value => !value)}>{open ? 'Hide' : 'View'} row comments sent to BDM</Button>
    {open && <>
      {query.isPending && <p role="status" className="text-sm">Loading row comments…</p>}
      {query.error && <p role="alert" className="text-sm text-destructive">Unable to load comments. <button className="underline" onClick={() => query.refetch()}>Retry</button></p>}
      {query.data?.pages.flatMap(page => page.items).map(comment => <article key={comment.id} className="space-y-2 rounded-lg border bg-card p-3 text-sm">
        <h3 className="font-bold">{comment.risk_reference || 'Unreferenced risk'} · {comment.risk_title}</h3>
        <p className="text-xs text-muted-foreground">{comment.author_name} · {new Date(comment.created_date).toLocaleString('en-GB')}</p>
        <p className="whitespace-pre-wrap break-words">{comment.comment}</p>
      </article>)}
      {query.data && !query.data.pages[0].items.length && <p className="text-sm text-muted-foreground">No row comments sent for this issue.</p>}
      {query.hasNextPage && <Button size="sm" variant="outline" disabled={query.isFetchingNextPage} onClick={() => query.fetchNextPage()}>{query.isFetchingNextPage ? 'Loading…' : 'Load more comments'}</Button>}
    </>}
  </section>;
}