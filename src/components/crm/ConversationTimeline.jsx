import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { formatDateTime } from '@/lib/portal';
import { Button } from '@/components/ui/button';

export default function ConversationTimeline({ accountId, contactId, defaultContactId, contacts = [], opportunities = [], user, canEdit, opportunityId }) {
  const [items, setItems] = useState([]);
  const [cursor, setCursor] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ contact_id: contactId || defaultContactId || '', occurred_at: new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16), channel: 'call', summary: '', next_step: '', opportunity_id: '' });
  const query = { ...(accountId ? { account_id: accountId } : {}), ...(contactId ? { contact_id: contactId } : {}), ...(opportunityId ? { opportunity_id: opportunityId } : {}) };
  const load = async (next = null) => {
    setLoading(true);
    try {
      const page = await base44.entities.Conversation.filter(query, { sort: '-occurred_at', limit: 50, ...(next ? { cursor: next } : {}) });
      setItems(previous => next ? [...previous, ...page.items] : page.items);
      setCursor(page.next_cursor);
      setHasMore(page.has_more);
    } catch (e) { setError(e.message || 'Unable to load conversations.'); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, [accountId, contactId, opportunityId]);
  const save = async e => {
    e.preventDefault(); setError(''); setSaving(true);
    try {
      await base44.entities.Conversation.create({ account_id: accountId, contact_id: contactId || form.contact_id, ...((opportunityId || form.opportunity_id) ? { opportunity_id: opportunityId || form.opportunity_id } : {}), occurred_at: new Date(form.occurred_at).toISOString(), channel: form.channel, summary: form.summary.trim(), next_step: form.next_step.trim(), author_name: user?.full_name || user?.email || 'Team member', owner_id: user?.id, line_manager_id: user?.data?.line_manager_id || user?.line_manager_id || '' });
      setForm(f => ({ ...f, summary: '', next_step: '' }));
      await load();
    } catch (e) { setError(e.message || 'Unable to save conversation.'); }
    finally { setSaving(false); }
  };
  return <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-5">
    <h3 className="font-semibold text-slate-900">Conversation timeline</h3>
    {canEdit && accountId && <form onSubmit={save} className="space-y-3">
      {!contactId && <select aria-label="Contact" required className="w-full rounded-lg border border-input p-2 text-sm" value={form.contact_id} onChange={e => setForm({ ...form, contact_id: e.target.value })}><option value="">Select contact</option>{contacts.map(c => <option key={c.id} value={c.id}>{c.full_name}</option>)}</select>}
      {!!opportunities.length && <select aria-label="Opportunity" className="w-full rounded-lg border border-input p-2 text-sm" value={form.opportunity_id} onChange={e => setForm({ ...form, opportunity_id: e.target.value })}><option value="">General conversation</option>{opportunities.map(o => <option key={o.id} value={o.id}>{o.title}</option>)}</select>}
      <div className="flex flex-wrap gap-2"><input aria-label="Conversation date and time" required type="datetime-local" className="rounded-lg border border-input p-2 text-sm" value={form.occurred_at} onChange={e => setForm({ ...form, occurred_at: e.target.value })} /><select aria-label="Conversation type" className="rounded-lg border border-input p-2 text-sm" value={form.channel} onChange={e => setForm({ ...form, channel: e.target.value })}>{['call','meeting','email','other'].map(v => <option key={v} value={v}>{v[0].toUpperCase() + v.slice(1)}</option>)}</select></div>
      <textarea required maxLength={5000} placeholder="What was discussed?" className="w-full rounded-lg border border-input p-2 text-sm" value={form.summary} onChange={e => setForm({ ...form, summary: e.target.value })} />
      <input maxLength={500} placeholder="Next step (optional)" className="w-full rounded-lg border border-input p-2 text-sm" value={form.next_step} onChange={e => setForm({ ...form, next_step: e.target.value })} />
      <Button type="submit" disabled={saving}>{saving ? 'Saving…' : 'Log conversation'}</Button>
    </form>}
    {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
    {loading && !items.length ? <p className="text-sm text-muted-foreground">Loading conversations…</p> : !items.length ? <p className="text-sm text-muted-foreground">No conversations logged yet.</p> : <ol className="space-y-3 border-l-2 border-primary/30 pl-4">{items.map(item => <li key={item.id} className="relative rounded-lg bg-secondary p-3 text-sm before:absolute before:-left-[23px] before:top-4 before:h-2 before:w-2 before:rounded-full before:bg-primary"><p className="font-semibold capitalize">{item.channel || 'Conversation'} · {formatDateTime(item.occurred_at)}</p>{!contactId && <p className="text-xs text-muted-foreground">{contacts.find(c => c.id === item.contact_id)?.full_name || 'Contact'}</p>}{item.opportunity_id && <p className="text-xs text-primary">{opportunities.find(o => o.id === item.opportunity_id)?.title || 'Opportunity conversation'}</p>}<p className="mt-1 whitespace-pre-wrap">{item.summary}</p>{item.next_step && <p className="mt-1 text-muted-foreground">Next: {item.next_step}</p>}<p className="mt-1 text-xs text-muted-foreground">{item.author_name}</p></li>)}</ol>}
    {hasMore && <Button variant="outline" disabled={loading} onClick={() => load(cursor)}>{loading ? 'Loading…' : 'Load more'}</Button>}
  </section>;
}