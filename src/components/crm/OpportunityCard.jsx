import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/portal';

export default function OpportunityCard({ item, account, contacts, canEdit, canConvert, onUpdated }) {
  const [reason, setReason] = useState('');
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState({ title: item.title, contact_id: item.contact_id || '', budget: item.budget ?? '', project_details: item.project_details || '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const saveChanges = async e => {
    e.preventDefault(); setBusy(true); setError('');
    try { await base44.entities.Opportunity.update(item.id, { title: draft.title.trim(), contact_id: draft.contact_id, project_details: draft.project_details.trim(), ...(draft.budget !== '' ? { budget: Number(draft.budget) } : {}) }); setEditing(false); onUpdated(); }
    catch (e) { setError(e.message || 'Unable to save opportunity.'); }
    finally { setBusy(false); }
  };
  const saveLost = async () => {
    if (!reason.trim()) return;
    setBusy(true); setError('');
    try { await base44.entities.Opportunity.update(item.id, { status: 'lost', lost_reason: reason.trim() }); onUpdated(); }
    catch (e) { setError(e.message || 'Unable to update opportunity.'); }
    finally { setBusy(false); }
  };
  const convert = async () => {
    if (!window.confirm(`Create a live project for “${item.title}”?`)) return;
    setBusy(true); setError('');
    try {
      const project = item.project_id ? { id: item.project_id } : await base44.entities.Project.create({ name: item.title, description: item.project_details || '', client_account_id: account.dataverse_id || account.id, client_name: account.name, ...(item.budget != null ? { estimated_value: item.budget } : {}), live_project: true, status: 'active' });
      await base44.entities.Opportunity.update(item.id, { project_id: project.id, status: 'won' });
      onUpdated();
    } catch (e) { setError(e.message || 'Unable to create project.'); }
    finally { setBusy(false); }
  };
  const contact = contacts.find(c => c.id === item.contact_id);
  return <article className="rounded-xl border border-border bg-card p-4 space-y-2 text-sm">
    <div className="flex flex-wrap items-center justify-between gap-2"><h4 className="font-semibold">{item.title}</h4><span className="rounded-full bg-secondary px-2 py-0.5 text-xs capitalize">{item.status === 'won' ? 'Live project' : item.status}</span></div>
    {contact && <Link className="text-primary hover:underline" to={`/accounts/${account.id}/contacts/${contact.id}`}>{contact.full_name}</Link>}
    {item.budget != null && <p>Budget: {formatCurrency(item.budget)}</p>}
    {item.project_details && <p className="whitespace-pre-wrap text-muted-foreground">{item.project_details}</p>}
    {item.lost_reason && <p className="text-muted-foreground">Lost: {item.lost_reason}</p>}
    {item.project_id && <Link className="text-primary hover:underline" to={`/projects/${item.project_id}`}>View live project</Link>}
    {item.status === 'open' && canEdit && <Button type="button" variant="outline" onClick={() => setEditing(v => !v)}>{editing ? 'Cancel editing' : 'Edit opportunity'}</Button>}
    {editing && <form onSubmit={saveChanges} className="space-y-2 rounded-lg bg-secondary p-3"><input required aria-label="Opportunity name" maxLength={200} className="w-full rounded-lg border border-input p-2" value={draft.title} onChange={e => setDraft({ ...draft, title: e.target.value })} /><select aria-label="Linked contact" className="w-full rounded-lg border border-input p-2" value={draft.contact_id} onChange={e => setDraft({ ...draft, contact_id: e.target.value })}><option value="">Select contact (optional)</option>{contacts.map(c => <option key={c.id} value={c.id}>{c.full_name}</option>)}</select><input aria-label="Estimated budget in pounds" type="number" min="0" step="0.01" placeholder="Budget (£)" className="w-full rounded-lg border border-input p-2" value={draft.budget} onChange={e => setDraft({ ...draft, budget: e.target.value })} /><textarea aria-label="Project details" maxLength={5000} className="w-full rounded-lg border border-input p-2" value={draft.project_details} onChange={e => setDraft({ ...draft, project_details: e.target.value })} /><Button disabled={busy || !draft.title.trim()}>Save changes</Button></form>}
    {item.status === 'open' && canEdit && <div className="flex flex-wrap gap-2 pt-2"><input aria-label="Reason lost" maxLength={500} placeholder="Reason lost" value={reason} onChange={e => setReason(e.target.value)} className="min-w-0 flex-1 rounded-lg border border-input p-2 text-sm" /><Button variant="outline" disabled={busy || !reason.trim()} onClick={saveLost}>Mark lost</Button>{canConvert && account.account_type === 'client' && <Button disabled={busy} onClick={convert}>Create live project</Button>}</div>}
    {error && <p role="alert" className="text-destructive">{error}</p>}
  </article>;
}