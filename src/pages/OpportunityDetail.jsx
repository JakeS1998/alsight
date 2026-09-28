import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import OpportunityCard from '@/components/crm/OpportunityCard';
import ConversationTimeline from '@/components/crm/ConversationTimeline';
import OpportunityBrief from '@/components/crm/OpportunityBrief';
import OpportunityTeam from '@/components/crm/OpportunityTeam';
import OpportunityFee from '@/components/crm/OpportunityFee';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

export default function OpportunityDetail() {
  const { opportunityId } = useParams();
  const { user } = useAuth();
  const [item, setItem] = useState(null);
  const [account, setAccount] = useState(null);
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [planError, setPlanError] = useState('');
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const savePlan = async patch => {
    setSaving(true); setSaved(false); setPlanError('');
    try {
      const updated = await base44.entities.Opportunity.update(opportunityId, patch);
      setItem(updated);
      setSaved(true);
    } catch (e) { setPlanError(e.message || 'Unable to save opportunity planning.'); }
    finally { setSaving(false); }
  };
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
    {planError && <p role="alert" className="text-sm text-destructive">{planError}</p>}
    {saved && <p role="status" className="text-sm text-emerald-700">Planning saved.</p>}
    <Tabs defaultValue="overview" className="space-y-4">
      <TabsList className="flex h-auto flex-wrap justify-start gap-1">
        <TabsTrigger value="overview">Overview</TabsTrigger><TabsTrigger value="conversations">Conversations</TabsTrigger><TabsTrigger value="brief">Project design brief</TabsTrigger><TabsTrigger value="team">Design team</TabsTrigger><TabsTrigger value="fees">Fee proposal</TabsTrigger>
      </TabsList>
      <TabsContent value="overview"><OpportunityCard item={item} account={account} contacts={contacts} canEdit={canEdit} canConvert={['admin', 'director', 'bdm'].includes(user?.role)} onUpdated={load} showRecordLink={false} /></TabsContent>
      <TabsContent value="conversations"><ConversationTimeline key={item.contact_id || 'unlinked'} accountId={account.id} opportunityId={item.id} defaultContactId={item.contact_id} contacts={contacts} user={user} canEdit={canEdit} /></TabsContent>
      <TabsContent value="brief"><OpportunityBrief item={item} onSave={savePlan} canEdit={canEdit} saving={saving} /></TabsContent>
      <TabsContent value="team"><OpportunityTeam item={item} onSave={savePlan} canEdit={canEdit} saving={saving} /></TabsContent>
      <TabsContent value="fees"><OpportunityFee item={item} onSave={savePlan} canEdit={canEdit} saving={saving} /></TabsContent>
    </Tabs>
  </div>;
}