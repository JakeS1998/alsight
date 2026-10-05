import React, { useEffect, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import {useQueryClient} from '@tanstack/react-query';
import OpportunityAttention from '@/components/crm/OpportunityAttention';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import OpportunityHeader from '@/components/crm/OpportunityHeader';
import OpportunityOverview from '@/components/crm/OpportunityOverview';
import CRMActivityTimeline from '@/components/crm/CRMActivityTimeline';
import OpportunityOutcome from '@/components/crm/OpportunityOutcome';
import OpportunityConversionReview from '@/components/crm/OpportunityConversionReview';
import { updateCRMOpportunity } from '@/components/crm/crm';
import { convertOpportunity } from '@/components/crm/convertOpportunity';
import OpportunityBrief from '@/components/crm/OpportunityBrief';
import OpportunityTeam from '@/components/crm/OpportunityTeam';
import OpportunityFee from '@/components/crm/OpportunityFee';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

export default function OpportunityDetail() {
  const { opportunityId } = useParams();
  const [params,setParams]=useSearchParams(),cache=useQueryClient();
  const setTab=tab=>setParams(current=>{const next=new URLSearchParams(current);next.set('tab',tab);return next;},{replace:true});
  const { user } = useAuth();
  const [item, setItem] = useState(null);
  const [account, setAccount] = useState(null);
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [planError, setPlanError] = useState('');
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [outcome, setOutcome] = useState(null);
  const [reviewOpen, setReviewOpen] = useState(false);
  const savePlan = async patch => {
    setSaving(true); setSaved(false); setPlanError('');
    try {
      const updated = await updateCRMOpportunity(item, patch, user);
      setItem(updated);
      cache.invalidateQueries({queryKey:['opportunity-attention',item.id]});
      setSaved(true);
      return true;
    } catch (e) { setPlanError(e.message || 'Unable to save opportunity planning.'); return false; }
    finally { setSaving(false); }
  };
  const changeStage = value => {
    if (value === 'won' || value === 'lost') { setOutcome(value); return; }
    savePlan({ stage: value });
  };
  const submitOutcome = async patch => { if (await savePlan(patch)) setOutcome(null); };
  const convert = async () => {
    setSaving(true); setPlanError('');
    try { await convertOpportunity(item, account); setReviewOpen(false); await load(); }
    catch (e) { setPlanError(e.message || 'Unable to create project.'); }
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
  return <div className="min-w-0 space-y-6">
    <Link to="/crm/opportunities" className="text-sm text-primary hover:underline">← All opportunities</Link>
    <OpportunityHeader key={item.id} item={item} account={account} contacts={contacts} canEdit={canEdit} canConvert={['admin','director','bdm'].includes(user?.role)} busy={saving} onSave={savePlan} onStage={changeStage} onOutcome={setOutcome} onConvert={() => setReviewOpen(true)} onActivity={()=>setTab('activity')} />
    {planError && <p role="alert" className="text-sm text-destructive">{planError}</p>}
    {saved && <p role="status" className="text-sm text-emerald-700">Planning saved.</p>}
    <OpportunityAttention item={item} user={user} canEdit={canEdit} onActivity={()=>setTab('activity')} onReview={()=>document.getElementById('opportunity-context')?.scrollIntoView({block:'start'})}/>
    <Tabs value={['overview','activity','brief','team','fees','handover'].includes(params.get('tab')) ? params.get('tab') : 'overview'} onValueChange={setTab} className="space-y-4">
      <TabsList className="flex h-auto flex-wrap justify-start gap-1">
        <TabsTrigger value="overview">Overview</TabsTrigger><TabsTrigger value="activity">Activity</TabsTrigger><TabsTrigger value="brief">Opportunity &amp; Scoping</TabsTrigger><TabsTrigger value="team">Design Team</TabsTrigger><TabsTrigger value="fees">Fee Proposal</TabsTrigger><TabsTrigger value="handover">Handover</TabsTrigger>
      </TabsList>
      <TabsContent value="overview"><OpportunityOverview item={item} account={account} contacts={contacts} user={user} canEdit={canEdit} /></TabsContent>
      <TabsContent value="activity"><CRMActivityTimeline item={item} user={user} canEdit={canEdit} /></TabsContent>
      <TabsContent value="brief"><OpportunityBrief item={item} onSave={savePlan} canEdit={canEdit} saving={saving} /></TabsContent>
      <TabsContent value="team"><OpportunityTeam item={item} onSave={savePlan} canEdit={canEdit} saving={saving} /></TabsContent>
      <TabsContent value="fees"><OpportunityFee item={item} account={account} onSave={savePlan} canEdit={canEdit} saving={saving} /></TabsContent>
      <TabsContent value="handover"><div className="rounded-xl border border-border bg-card p-5"><h2 className="font-semibold">Project handover</h2><p className="mt-2 text-sm text-muted-foreground">{item.status === 'won' ? 'This opportunity is won. Review the details before creating the project.' : 'Mark the opportunity Won after client confirmation to begin project handover.'}</p>{item.status === 'won' && !item.project_id && ['admin','director','bdm'].includes(user?.role) && <button onClick={() => setReviewOpen(true)} className="mt-3 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">Review &amp; convert</button>}{item.project_id && <Link to={`/projects/${item.project_id}`} className="mt-3 block text-sm text-primary hover:underline">View converted project →</Link>}</div></TabsContent>
    </Tabs>
    {outcome && <OpportunityOutcome type={outcome} onClose={() => setOutcome(null)} onSubmit={submitOutcome} busy={saving} />}
    {reviewOpen && <OpportunityConversionReview open={reviewOpen} onClose={() => setReviewOpen(false)} onConfirm={convert} busy={saving} item={item} account={account} contacts={contacts} />}
  </div>;
}