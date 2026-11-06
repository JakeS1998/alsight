import React, { useState } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
export default function AliceConversationHistory({ userId, conversationId, disabled, onSelect }) {
  const [open, setOpen] = useState(false);
  const history = useInfiniteQuery({ queryKey: ['alice-conversations', userId, conversationId], enabled: open, initialPageParam: 0, staleTime: 0, queryFn: ({ pageParam }) => base44.agents.listConversations({ q: { agent_name: 'alice' }, sort: '-created_date', limit: 20, skip: pageParam }), getNextPageParam: (page, pages) => page.length === 20 ? pages.length * 20 : undefined });
  return <div className="shrink-0 border-b border-border px-3 py-2 text-xs"><button type="button" className="font-semibold underline" aria-expanded={open} disabled={disabled} onClick={() => setOpen(value => !value)}>Saved chats</button><span className="ml-2 text-muted-foreground">Continue with chat history, or start a new chat.</span>{open && <div className="mt-2 max-h-36 space-y-1 overflow-y-auto">
    {history.isPending && <p role="status">Loading saved chats…</p>}{history.error && <p role="alert">Unable to load chats. <button type="button" className="underline" onClick={() => history.refetch()}>Retry</button></p>}
    {history.data?.pages.flat().map(chat => <button type="button" key={chat.id} disabled={disabled} onClick={async () => { if (await onSelect(chat.id)) setOpen(false); }} className="block w-full rounded-md border border-border p-2 text-left hover:bg-muted disabled:opacity-50"><span className="block truncate font-medium">{chat.metadata?.name || 'ALICE conversation'}</span><span className="text-muted-foreground">{chat.created_date ? new Date(chat.created_date).toLocaleString('en-GB') : 'Saved conversation'}{conversationId === chat.id ? ' · Current' : ''}</span></button>)}
    {history.isSuccess && !history.data.pages[0].length && <p>No saved chats yet.</p>}{history.hasNextPage && <button type="button" className="underline" disabled={history.isFetchingNextPage} onClick={() => history.fetchNextPage()}>Load more chats</button>}
  </div>}</div>;
}