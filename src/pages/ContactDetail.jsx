import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { formatDate } from '@/lib/portal';
import { Button } from '@/components/ui/button';
import ConversationTimeline from '@/components/crm/ConversationTimeline';
import ContactOpportunities from '@/components/crm/ContactOpportunities';
import { INTERNAL_ROLES } from '@/lib/portal';

const FIELDS = [['birthday', 'Birthday', 'date'], ['likes', 'Likes', 'text'], ['dislikes', 'Dislikes', 'text'], ['family_members', 'Family members', 'text'], ['relationship_notes', 'Relationship notes', 'text']];
export default function ContactDetail() {
  const { accountId, contactId } = useParams();
  const { user } = useAuth();
  const canEdit = ['admin','director','bdm','bsm'].includes(user?.role);
  const [contact, setContact] = useState(null);
  const [account, setAccount] = useState(null);
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  useEffect(() => {
    setLoading(true);
    Promise.all([
      base44.entities.Contact.get(contactId),
      accountId ? base44.entities.Account.get(accountId) : Promise.resolve(null),
      base44.entities.ContactProfile.filter({ contact_id: contactId }, { limit: 1 }),
    ]).then(([c, a, profiles]) => { setContact(c); setAccount(a); setProfile(profiles.items[0] || null); setForm(profiles.items[0] || {}); })
      .catch(e => setError(e.message || 'Unable to load contact.')).finally(() => setLoading(false));
  }, [contactId, accountId]);
  useEffect(() => {
    const unsubscribe = base44.entities.ContactProfile.subscribe(event => {
      if (event.data?.contact_id !== contactId || !['create', 'update'].includes(event.type)) return;
      setProfile(event.data);
      setForm(previous => ({ ...previous, relationship_notes: event.data.relationship_notes || '' }));
    });
    return unsubscribe;
  }, [contactId]);
  const save = async e => {
    e.preventDefault(); setSaving(true); setError(''); setSaved(false);
    try {
      const data = Object.fromEntries(FIELDS.filter(([key]) => key !== 'birthday' || form.birthday).map(([key]) => [key, form[key] || '']));
      const updated = profile ? await base44.entities.ContactProfile.update(profile.id, data) : await base44.entities.ContactProfile.create({ contact_id: contactId, ...data });
      setProfile(updated); setSaved(true);
    } catch (e) { setError(e.message || 'Unable to save contact notes.'); }
    finally { setSaving(false); }
  };
  if (loading) return <p className="p-8 text-muted-foreground">Loading contact…</p>;
  if (!contact || (accountId && !account)) return <p>Contact not found.</p>;
  const token = (account?.name?.split(/\s+/)[0] || '').toLowerCase().replace(/[^a-z]/g, '');
  const belongs = !account || (account.company_number && contact.company_number === account.company_number) || (account.company_name && (contact.company_name || '').toLowerCase() === account.company_name.toLowerCase()) || (token.length > 2 && ((contact.email || '').split('@')[1] || '').toLowerCase().startsWith(token));
  if (!belongs) return <p>Contact not linked to this account.</p>;
  return <div className="space-y-6" data-alice-contact-id={contact.id} data-alice-contact-name={contact.full_name}>
    <Link to={account ? `/accounts/${account.id}` : '/contacts'} className="text-sm text-primary hover:underline">← Back to {account ? account.name : 'Contacts'}</Link>
    <div><h1 className="font-heading text-2xl font-semibold">{contact.full_name}</h1><p className="text-sm text-muted-foreground">{contact.job_title} {contact.company_name && `· ${contact.company_name}`}</p><div className="mt-2 flex flex-wrap gap-4 text-sm">{contact.email && <a href={`mailto:${contact.email}`} className="text-primary">{contact.email}</a>}{contact.phone && <span>{contact.phone}</span>}</div></div>
    <section className="rounded-xl border border-border bg-card p-5 space-y-4"><h2 className="font-semibold">Relationship details</h2>
      {canEdit ? <form onSubmit={save} className="space-y-3"><div className="grid gap-3 sm:grid-cols-2">{FIELDS.map(([key, label, type]) => <label key={key} className="space-y-1 text-sm"><span>{label}</span><input type={type} aria-label={label} maxLength={1000} value={form[key] || ''} onChange={e => setForm({ ...form, [key]: e.target.value })} className="w-full rounded-lg border border-input p-2" /></label>)}</div><Button disabled={saving}>{saving ? 'Saving…' : 'Save details'}</Button>{saved && <span className="ml-3 text-sm text-emerald-700">Saved</span>}</form> : <dl className="grid gap-3 sm:grid-cols-2">{FIELDS.map(([key, label]) => <div key={key}><dt className="text-xs text-muted-foreground">{label}</dt><dd className="whitespace-pre-wrap text-sm">{key === 'birthday' ? formatDate(profile?.birthday) : profile?.[key] || '—'}</dd></div>)}</dl>}
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
    </section>
    {INTERNAL_ROLES.includes(user?.role) && (!account || account.account_type === 'client') && <ContactOpportunities contactId={contactId} />}
    {INTERNAL_ROLES.includes(user?.role) && <ConversationTimeline accountId={account?.id} contactId={contactId} user={user} canEdit={canEdit} />}
  </div>;
}