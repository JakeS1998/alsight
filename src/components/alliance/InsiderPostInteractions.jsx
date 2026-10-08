import React, { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { ThumbsUp, PartyPopper, Lightbulb, MessageCircle } from 'lucide-react';
import InsiderComments from '@/components/alliance/InsiderComments';
import allianceRequest, { allianceError } from '@/components/alliance/allianceClient';
import pulseEngagementCache from '@/components/alliance/pulseEngagementCache';
const reactions = [{ key: 'like', label: 'Like', Icon: ThumbsUp }, { key: 'celebrate', label: 'Celebrate', Icon: PartyPopper }, { key: 'helpful', label: 'Helpful', Icon: Lightbulb }];
export default function InsiderPostInteractions({ item, user, groupOwnerId }) {
  const cache = useQueryClient(), [engagement, setEngagement] = useState(item.engagement || {}), [open, setOpen] = useState(false), [busy, setBusy] = useState(false), [error, setError] = useState('');
  useEffect(() => { setEngagement(item.engagement || {}); }, [item.engagement]);
  const update = changes => { setEngagement(old => ({ ...old, ...changes })); pulseEngagementCache(cache, item.id, changes); };
  const react = async key => {
    if (busy) return; setBusy(true); setError('');
    try { update(await allianceRequest('postReact', { postId: item.id, reaction: engagement.myReaction === key ? null : key })); }
    catch (e) { setError(allianceError(e)); } finally { setBusy(false); }
  };
  const commentCount = engagement.commentCount || 0;
  return <div className="border-t border-border">
    <div className="flex flex-wrap items-center gap-1 px-4 py-3">{reactions.map(({ key, label, Icon }) => <button key={key} type="button" aria-pressed={engagement.myReaction === key} disabled={busy} onClick={() => react(key)} className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-2 text-xs font-semibold disabled:opacity-50 ${engagement.myReaction === key ? 'border-primary bg-primary/10 text-foreground' : 'border-transparent text-muted-foreground hover:bg-muted'}`}><Icon className="h-4 w-4" /><span>{label}</span><span>{engagement.reactions?.[key] || 0}</span></button>)}<button type="button" aria-expanded={open} onClick={() => setOpen(value => !value)} className="ml-auto inline-flex items-center gap-1.5 rounded-md px-2 py-2 text-xs font-semibold text-muted-foreground hover:bg-muted"><MessageCircle className="h-4 w-4" />{commentCount ? `${commentCount} comment${commentCount === 1 ? '' : 's'}` : 'Comment'}</button></div>
    {busy && <p role="status" className="px-5 pb-3 text-xs text-muted-foreground">Saving reaction…</p>}{error && <p role="alert" className="px-5 pb-3 text-sm text-destructive">{error}</p>}
    {open && <InsiderComments postId={item.id} user={user} groupOwnerId={groupOwnerId} onCount={count => update({ commentCount: count })} />}
  </div>;
}