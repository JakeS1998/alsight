import React, { useEffect, useState } from 'react';
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import InsiderCommentRow from '@/components/alliance/InsiderCommentRow';
import allianceRequest, { allianceError } from '@/components/alliance/allianceClient';
export default function InsiderComments({ postId, user, groupOwnerId, onCount }) {
  const cache = useQueryClient(), [body, setBody] = useState(''), [busy, setBusy] = useState(false), [error, setError] = useState('');
  const key = ['insider-comments', postId, user.id];
  const query = useInfiniteQuery({ queryKey: key, initialPageParam: null, queryFn: ({ pageParam }) => allianceRequest('postComments', { postId, cursor: pageParam }), getNextPageParam: page => page.has_more ? page.next_cursor : undefined });
  useEffect(() => { if (query.data) onCount(query.data.pages[0].total); }, [query.data]);
  const submit = async event => {
    event.preventDefault(); if (!body.trim() || busy) return;
    setBusy(true); setError('');
    try { const data = await allianceRequest('postCommentAdd', { postId, body: body.trim() }); setBody(''); onCount(data.total); await cache.invalidateQueries({ queryKey: key }); }
    catch (e) { setError(allianceError(e)); } finally { setBusy(false); }
  };
  const remove = async commentId => {
    if (busy || !window.confirm('Remove this comment?')) return;
    setBusy(true); setError('');
    try { const data = await allianceRequest('postCommentRemove', { postId, commentId }); onCount(data.total); await cache.invalidateQueries({ queryKey: key }); }
    catch (e) { setError(allianceError(e)); } finally { setBusy(false); }
  };
  const comments = query.data?.pages.flatMap(page => page.items) || [];
  return <section aria-label="Post comments" className="space-y-3 border-t border-border px-5 py-4">
    {query.isPending ? <p role="status" className="text-sm text-muted-foreground">Loading comments…</p> : query.isError ? <p role="alert" className="text-sm text-destructive">{allianceError(query.error)} <button type="button" className="underline" onClick={() => query.refetch()}>Try again</button></p> : !comments.length ? <p className="text-sm text-muted-foreground">No comments yet. Start the conversation.</p> : comments.map(comment => <InsiderCommentRow key={comment.id} comment={comment} user={user} groupOwnerId={groupOwnerId} removing={busy} onRemove={remove} />)}
    {query.hasNextPage && <Button type="button" variant="outline" size="sm" disabled={query.isFetchingNextPage} onClick={() => query.fetchNextPage()}>{query.isFetchingNextPage ? 'Loading…' : 'More comments'}</Button>}
    <form onSubmit={submit} className="space-y-2"><Textarea aria-label="Write a comment" placeholder="Write a comment…" value={body} maxLength={2000} disabled={busy} onChange={event => setBody(event.target.value)} /><div className="flex items-center justify-between gap-3"><span className="text-xs text-muted-foreground">{body.length}/2000</span><Button type="submit" size="sm" disabled={busy || !body.trim()}>{busy ? 'Saving…' : 'Post comment'}</Button></div></form>
    {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
  </section>;
}