import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import OpportunityCard from '@/components/crm/OpportunityCard';
import ConversationTimeline from '@/components/crm/ConversationTimeline';

export default function OpportunityDetail() {
  const { opportunityId } = useParams();
  const { user } = useAuth();
  const [item, setItem] = useState(null);
  const [account, setAccount] = useState(null);
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const load = async () => {
    setLoading(true); setError('');
    try {
      const opportunity = await base44.entities.Opportunity.get(opportunityId);
      if (!opportunity) { setItem(null); return; }
      const client = await base44.entities.Account.get(opportunity.account_id);
      if (!client || client.account_type !== 'client') { setItem(null); return; }
      const conditions = [client.company_number && { company_number: client.company_number }, client.company_name && { company_name: client.company_name }].filter(Boolean);
      const [page, linked] = await Promise.all([
        conditions.length ? base44.entities.Contact.filter({ $or: conditions }, { limit: 50 }) : Promise.resolve({ items: [] }),
        opportunity.contact_id ? base44.entities.Contact.get(opportunity.contact_id) : Promise.resolve(null),
      ]);
      const people = page.items || [];
      if (linked && !people.some(c => c.id === linked.id)) people.unshift(linked);
      setItem(opportunity); setAccount(client); setContacts(people);
    } catch (e) { setError(e.message || 'Unable to load opportunity.'); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, [opportunityId]);
  if (!['admin', 'director', 'regional_director', 'bsm', 'finance', 'bdm'].includes(user?.role)) return <p className="p-6 text-muted-foreground">Opportunity not available.</p>;
  if (loading) return <p className="p-6 text-muted-foreground">Loading opportunity…</p>;
  if (error) return <p role="alert" className="p-6 text-destructive">{error}</p>;
  if (!item || !account) return <p className="p-6 text-muted-foreground">Opportunity not found.</p>;
  const canEdit = ['admin', 'director', 'bdm', 'bsm'].includes(user?.role);
  return <div className="space-y-6">
    <Link to={`/accounts/${account.id}#crm`} className="text-sm text-primary hover:underline">← Back to {account.name}</Link>
    <div><p className="text-sm text-muted-foreground">Client opportunity · {account.name}</p><h1 className="font-heading text-2xl font-semibold">{item.title}</h1></div>
    <section className="space-y-3"><h2 className="font-heading text-lg font-semibold">Opportunity details</h2><OpportunityCard item={item} account={account} contacts={contacts} canEdit={canEdit} canConvert={['admin', 'director', 'bdm'].includes(user?.role)} onUpdated={load} showRecordLink={false} /></section>
    <ConversationTimeline key={item.contact_id || 'unlinked'} accountId={account.id} opportunityId={item.id} defaultContactId={item.contact_id} contacts={contacts} user={user} canEdit={canEdit} />
  </div>;
}