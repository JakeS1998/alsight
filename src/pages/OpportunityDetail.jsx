import React, { useEffect, useState } from 'react';
import PageContentSkeleton from '@/components/loading/PageContentSkeleton';
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
import { Tabs, TabsList, TabsContent } from '@/components/ui/tabs';
import TabsTrigger from '@/components/navigation/SlidingTabTrigger';
import SlidingTabHighlight from '@/components/navigation/SlidingTabHighlight';
import OpportunityPeople from '@/components/commercial/OpportunityPeople';
import OpportunityHistory from '@/components/commercial/OpportunityHistory';
import CommercialQuickAction from '@/components/commercial/CommercialQuickAction';
import OpportunityQuestionnaire from '@/components/questionnaire/OpportunityQuestionnaire';
import SubmissionSummary,{submissionRows} from '@/components/forms/SubmissionSummary';

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
  const [quickAction,setQuickAction]=useState(null);
  const savePlan = async patch => {
    setSaving(true); setSaved(false); setPlanError('');
    try {
      const updated = await updateCRMOpportunity(item, patch, user);
      setItem(updated);
      cache.invalidateQueries({queryKey:['opportunity-attention',item.id]});
      setSaved([['Opportunity',updated.title||item.title],...submissionRows(patch),...('contact_id' in patch?[['Contact',contacts.find(person=>person.id===patch.contact_id)?.full_name||'Not assigned']]:[])]);
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
  useEffect(()=>{if(['won','lost'].includes(params.get('outcome')))setOutcome(params.get('outcome'));},[params.get('outcome')]);
  if (!['admin', 'director', 'regional_director', 'bsm', 'finance', 'bdm'].includes(user?.role)) return <p className="p-6 text-muted-foreground">Opportunity not available.</p>;
  if (loading) return <PageContentSkeleton label="Loading opportunity"/>;
  if (error) return <p role="alert" className="p-6 text-destructive">{error}</p>;
  if (!item || !account) return <p className="p-6 text-muted-foreground">Opportunity not found.</p>;
  const canEdit = ['admin', 'director', 'bdm', 'bsm'].includes(user?.role);
  return <div className="min-w-0 space-y-6">
    <Link to="/crm/opportunities" className="text-sm text-primary hover:underline">← All opportunities</Link>
    <OpportunityHeader key={item.id} item={item} account={account} contacts={contacts} canEdit={canEdit} canConvert={['admin','director','bdm'].includes(user?.role)} busy={saving} onSave={savePlan} onStage={changeStage} onOutcome={setOutcome} onConvert={() => setReviewOpen(true)} onActivity={()=>setTab('activity')} onAction={()=>setQuickAction({item,kind:'action'})} />
    {planError && <p role="alert" className="text-sm text-destructive">{planError}</p>}
    {saved && <div role="status"><p className="text-sm text-success">Planning saved.</p><SubmissionSummary rows={saved}/></div>}
    <OpportunityAttention item={item} user={user} canEdit={canEdit} onActivity={()=>setTab('activity')} onReview={()=>document.getElementById('opportunity-context')?.scrollIntoView({block:'start'})}/>
    <Tabs value={['overview','activity','people','history','brief','team','fees','handover','questionnaire'].includes(params.get('tab')) ? params.get('tab') : 'overview'} onValueChange={setTab} className="space-y-4">
      <TabsList className="sliding-tab-list sliding-surface-tabs flex h-auto flex-wrap justify-start gap-1">
        <SlidingTabHighlight/>
        <TabsTrigger value="overview">Overview</TabsTrigger><TabsTrigger value="activity">Activity</TabsTrigger><TabsTrigger value="people">People</TabsTrigger><TabsTrigger value="history">History</TabsTrigger><TabsTrigger value="brief">Opportunity &amp; Scoping</TabsTrigger><TabsTrigger value="team">Design Team</TabsTrigger><TabsTrigger value="fees">Commercial</TabsTrigger><TabsTrigger value="questionnaire">Project Questionnaire</TabsTrigger><TabsTrigger value="handover">Handover</TabsTrigger>
      </TabsList>
      <TabsContent value="overview"><OpportunityOverview item={item} account={account} contacts={contacts} user={user} canEdit={canEdit} onAction={()=>setQuickAction({item,kind:'action'})} /></TabsContent>
      <TabsContent value="activity"><CRMActivityTimeline item={item} user={user} canEdit={canEdit} /></TabsContent>
      <TabsContent value="people"><OpportunityPeople key={item.contact_id || 'none'} item={item} account={account} contacts={contacts} canEdit={canEdit} onSave={savePlan} busy={saving}/></TabsContent>
      <TabsContent value="history"><OpportunityHistory item={item}/></TabsContent>
      <TabsContent value="brief"><OpportunityBrief item={item} onSave={savePlan} canEdit={canEdit} saving={saving} /></TabsContent>
      <TabsContent value="team"><OpportunityTeam item={item} onSave={savePlan} canEdit={canEdit} saving={saving} /></TabsContent>
      <TabsContent value="fees"><OpportunityFee item={item} account={account} onSave={savePlan} canEdit={canEdit} saving={saving} /></TabsContent>
      <TabsContent value="questionnaire"><OpportunityQuestionnaire item={item} account={account}/></TabsContent>
      <TabsContent value="handover"><div className="rounded-xl border border-border bg-card p-5"><h2 className="font-semibold">Project handover</h2><p className="mt-2 text-sm text-muted-foreground">{item.status === 'won' ? 'This opportunity is won. Review the details before creating the project.' : 'Mark the opportunity Won after client confirmation to begin project handover.'}</p>{item.status === 'won' && !item.project_id && ['admin','director','bdm'].includes(user?.role) && <button onClick={() => setReviewOpen(true)} className="mt-3 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">Review &amp; convert</button>}{item.project_id && <Link to={`/projects/${item.project_id}`} className="mt-3 block text-sm text-primary hover:underline">View converted project →</Link>}</div></TabsContent>
    </Tabs>
    {quickAction && <CommercialQuickAction selection={quickAction} user={user} onClose={()=>setQuickAction(null)} onSaved={async()=>{await cache.invalidateQueries({queryKey:['commercial-next-action',item.id]});await cache.invalidateQueries({queryKey:['ase-opportunity-tasks',item.id]});await cache.invalidateQueries({queryKey:['commercial-workspace']});setTab('overview');}}/>}
    {outcome && <OpportunityOutcome type={outcome} onClose={() => setOutcome(null)} onSubmit={submitOutcome} busy={saving} />}
    {reviewOpen && <OpportunityConversionReview open={reviewOpen} onClose={() => setReviewOpen(false)} onConfirm={convert} busy={saving} item={item} account={account} contacts={contacts} onOpenPQ={()=>{setReviewOpen(false);setTab('questionnaire');}} />}
  </div>;
}