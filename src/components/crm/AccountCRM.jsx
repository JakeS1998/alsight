import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import SearchableSelect from '@/components/forms/SearchableSelect';
import OpportunityCard from '@/components/crm/OpportunityCard';
import ConversationTimeline from '@/components/crm/ConversationTimeline';
import { createCRMOpportunity, STAGES } from '@/components/crm/crm';

export default function AccountCRM({ account, contacts, user }) {
  const canEdit = ['admin','director','bdm','bsm'].includes(user?.role);
  const canConvert = ['admin','director','bdm'].includes(user?.role);
  const [opportunities, setOpportunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cursor, setCursor] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ title: '', contact_id: '', budget: '', project_details: '', location: '', stage: 'lead', expected_decision_date: '' });
  const load = async (next = null) => {
    setLoading(true);
    try {
      const page = await base44.entities.Opportunity.filter({ account_id: account.id }, { sort: '-created_date', limit: 50, ...(next ? { cursor: next } : {}) });
      setOpportunities(old => next ? [...old, ...page.items] : page.items);
      setCursor(page.next_cursor); setHasMore(page.has_more);
    } catch (e) { setError(e.message || 'Unable to load opportunities.'); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, [account.id]);
  const save = async e => {
    e.preventDefault(); setSaving(true); setError('');
    try {
      await createCRMOpportunity({ account_id: account.id, title: form.title, contact_id: form.contact_id, ...(form.budget !== '' ? { budget: Number(form.budget) } : {}), project_details: form.project_details.trim(), location: form.location, stage: form.stage, expected_decision_date: form.expected_decision_date }, user);
      setForm({ title: '', contact_id: '', budget: '', project_details: '', location: '', stage: 'lead', expected_decision_date: '' });
      await load();
    } catch (e) { setError(e.message || 'Unable to save opportunity.'); }
    finally { setSaving(false); }
  };
  return <section id="crm" className="space-y-5"><h2 className="font-heading text-lg font-semibold">CRM · Opportunities</h2>
    {canEdit && <form onSubmit={save} className="space-y-3 rounded-xl border border-border bg-card p-5">
      <h3 className="font-semibold">New opportunity</h3>
      <input required maxLength={200} placeholder="Opportunity / project name" aria-label="Opportunity name" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="w-full rounded-lg border border-input p-2 text-sm" />
      <div className="grid gap-3 sm:grid-cols-2"><SearchableSelect aria-label="Linked contact" value={form.contact_id} onChange={e => setForm({ ...form, contact_id: e.target.value })} className="rounded-lg border border-input p-2 text-sm"><option value="">Select contact (optional)</option>{contacts.map(c => <option key={c.id} value={c.id}>{c.full_name}</option>)}</SearchableSelect><input aria-label="Estimated budget in pounds" type="number" min="0" step="0.01" placeholder="Estimated budget (£)" value={form.budget} onChange={e => setForm({ ...form, budget: e.target.value })} className="rounded-lg border border-input p-2 text-sm" /></div>
      <div className="grid gap-3 sm:grid-cols-3"><input aria-label="Location" placeholder="Location" value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} className="rounded-lg border border-input p-2 text-sm" /><SearchableSelect aria-label="Stage" value={form.stage} onChange={e => setForm({ ...form, stage: e.target.value })} className="rounded-lg border border-input p-2 text-sm">{STAGES.slice(0,8).map(s => <option key={s.value} value={s.value}>{s.label}</option>)}</SearchableSelect><input type="date" aria-label="Expected decision date" value={form.expected_decision_date} onChange={e => setForm({ ...form, expected_decision_date: e.target.value })} className="rounded-lg border border-input p-2 text-sm" /></div>
      <textarea placeholder="Project details (optional)" aria-label="Project details" maxLength={5000} value={form.project_details} onChange={e => setForm({ ...form, project_details: e.target.value })} className="w-full rounded-lg border border-input p-2 text-sm" />
      <Button disabled={saving || !form.title.trim()}>{saving ? 'Saving…' : 'Add opportunity'}</Button>
    </form>}
    {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
    {loading && !opportunities.length ? <p className="text-sm text-muted-foreground">Loading opportunities…</p> : opportunities.length ? <div className="grid gap-3 sm:grid-cols-2">{opportunities.map(item => <OpportunityCard key={item.id} item={item} account={account} contacts={contacts} canEdit={canEdit} canConvert={canConvert} user={user} onUpdated={() => load()} />)}</div> : <p className="text-sm text-muted-foreground">No opportunities yet.</p>}
    {hasMore && <Button variant="outline" disabled={loading} onClick={() => load(cursor)}>{loading ? 'Loading…' : 'Load more opportunities'}</Button>}
    <ConversationTimeline accountId={account.id} contacts={contacts} opportunities={opportunities} user={user} canEdit={canEdit} />
  </section>;
}