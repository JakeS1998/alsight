import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { logCRMActivity } from '@/components/crm/crm';
import ReminderSetter from '@/components/crm/ReminderSetter';
const TYPES = ['call','email','meeting','teams_meeting','client_visit','internal_meeting','note','document_sent','proposal_sent','decision'];
export default function CRMActivityTimeline({ item, user, canEdit, compact = false }) {
  const [rows, setRows] = useState([]), [loading, setLoading] = useState(true), [busy, setBusy] = useState(false), [error, setError] = useState('');
  const [form, setForm] = useState({ type: 'call', subject: '', description: '', remind_at: '' });
  const load = async () => { setLoading(true); try {
    const [activity, conversations] = await Promise.all([
      base44.entities.CRMActivity.filter({ opportunity_id: item.id }, { sort: '-occurred_at', limit: 50 }),
      base44.entities.Conversation.filter({ opportunity_id: item.id }, { sort: '-occurred_at', limit: 50 }),
    ]);
    setRows([...activity.items, ...conversations.items.map(c => ({ ...c, type: c.channel || 'note', subject: 'Conversation', description: c.summary, author_name: c.author_name }))].sort((a,b) => new Date(b.occurred_at) - new Date(a.occurred_at)).slice(0, compact ? 5 : 50));
  } catch (e) { setError(e.message); } finally { setLoading(false); } };
  useEffect(() => { load(); }, [item.id, compact]);
  const save = async e => { e.preventDefault(); setBusy(true); setError(''); try { const activity = await logCRMActivity(item, user, form.type, form.subject.trim(), form.description.trim()); setForm({ type: 'call', subject: '', description: '', remind_at: '' }); await load(); if (form.remind_at) { try { await base44.entities.CRMReminder.create({ user_id: user.id, opportunity_id: item.id, activity_id: activity.id, subject: activity.subject, remind_at: new Date(form.remind_at).toISOString() }); } catch (err) { setError(`Activity logged, but reminder could not be saved: ${err.message}`); } } } catch (e) { setError(e.message); } finally { setBusy(false); } };
  return <section className="space-y-3 rounded-xl border border-border bg-card p-5"><h2 className="font-semibold">{compact ? 'Recent activity' : 'Activity timeline'}</h2>
    {!compact && canEdit && <form onSubmit={save} className="space-y-2"><div className="flex flex-wrap gap-2"><select aria-label="Activity type" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} className="rounded-lg border border-input p-2 text-sm">{TYPES.map(type => <option key={type} value={type}>{type.replaceAll('_',' ')}</option>)}</select><input required maxLength={200} aria-label="Subject" placeholder="Subject" value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} className="min-w-0 flex-1 rounded-lg border border-input p-2 text-sm" /></div><textarea maxLength={5000} placeholder="What happened?" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="w-full rounded-lg border border-input p-2 text-sm" /><label className="block text-sm">Remind me (optional)<input type="datetime-local" value={form.remind_at} onChange={e => setForm({ ...form, remind_at: e.target.value })} className="mt-1 block rounded-lg border border-input bg-background p-2 text-sm" /></label><Button disabled={busy}>{busy ? 'Logging…' : 'Log activity'}</Button></form>}
    {loading ? <p className="text-sm text-muted-foreground">Loading activity…</p> : !rows.length ? <p className="text-sm text-muted-foreground">No activity logged yet.</p> : <ol className="space-y-3">{rows.map(row => <li key={row.id} className="border-l-2 border-primary/40 pl-3 text-sm"><p className="break-words font-medium">{row.subject}</p><p className="text-xs capitalize text-muted-foreground">{row.type?.replaceAll('_',' ')} · {new Date(row.occurred_at).toLocaleString('en-GB')} · {row.author_name}</p>{row.description && <p className="mt-1 whitespace-pre-wrap break-words text-muted-foreground">{row.description}</p>}{canEdit && <ReminderSetter activity={row} opportunityId={item.id} user={user} />}</li>)}</ol>}
    {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
  </section>;
}