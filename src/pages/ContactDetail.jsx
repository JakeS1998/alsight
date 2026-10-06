import React, { useEffect, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import {Tabs,TabsList,TabsTrigger,TabsContent} from '@/components/ui/tabs';
import PersonColleagues from '@/components/relationships/PersonColleagues';
import PersonPortalAccount from '@/components/relationships/PersonPortalAccount';
import PersonOverviewPanels from '@/components/relationships/PersonOverviewPanels';
import PersonAllSeeingEye from '@/components/intelligence/PersonAllSeeingEye';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { INTERNAL_ROLES } from '@/lib/portal';
import ContactHeader from '@/components/crm/contact360/ContactHeader';
import ContactOverviewCards from '@/components/crm/contact360/ContactOverviewCards';
import ContactActivity from '@/components/crm/contact360/ContactActivity';
import ContactTasks from '@/components/crm/contact360/ContactTasks';
import ContactProjects from '@/components/crm/contact360/ContactProjects';
import ContactConnections from '@/components/crm/contact360/ContactConnections';
import ContactKeyDates from '@/components/crm/contact360/ContactKeyDates';
import ContactOpportunityForm from '@/components/crm/contact360/ContactOpportunityForm';
import ContactOpportunities from '@/components/crm/ContactOpportunities';
import { contactBelongsToAccount } from '@/components/accounts/accountContactQuery';

export default function ContactDetail() {
  const { accountId, contactId } = useParams();
  const [params,setParams]=useSearchParams();
  const tabs=['overview','activity','opportunities','projects','portal'];
  const setTab=tab=>setParams(old=>{const next=new URLSearchParams(old);next.set('tab',tab);next.delete('action');return next;},{replace:true});
  const { user } = useAuth();
  const internal = INTERNAL_ROLES.includes(user?.role);
  const canEdit = ['admin','director','bdm','bsm'].includes(user?.role);
  const [contact, setContact] = useState(null), [account, setAccount] = useState(null), [profile, setProfile] = useState(null), [staff, setStaff] = useState([]), [opportunities, setOpportunities] = useState([]);
  const [last, setLast] = useState(null), [next, setNext] = useState(null), [openCount, setOpenCount] = useState(0), [revision, setRevision] = useState(0);
  const [loading, setLoading] = useState(true), [error, setError] = useState(''), [action, setAction] = useState(params.get('action') || '');
  const [editingSection, setEditingSection] = useState(null);
  useEffect(()=>{setAction(params.get('action') || '');},[params.get('action')]);
  const refreshSignals = async () => {
    if (!internal) return;
    const [activities, conversations, tasks, count] = await Promise.all([
      base44.entities.CRMActivity.filter({ contact_id: contactId }, { sort: '-occurred_at', limit: 1 }),
      base44.entities.Conversation.filter({ contact_id: contactId }, { sort: '-occurred_at', limit: 1 }),
      base44.entities.CRMContactTask.filter({ contact_id: contactId, status: 'open' }, { sort: 'due_at', limit: 1 }),
      base44.entities.Opportunity.count({ contact_id: contactId, status: 'open' }),
    ]);
    setLast([activities.items[0]?.occurred_at, conversations.items[0]?.occurred_at].filter(Boolean).sort().at(-1) || null);
    setNext(tasks.items[0] || null); setOpenCount(count);
  };
  useEffect(() => {
    let active = true; setLoading(true); setError('');
    (async () => {
      const c = await base44.entities.Contact.get(contactId);
      if (!c || !active) { if (active) setContact(null); return; }
      const matches = [c.company_number && { company_number: c.company_number }, c.company_name && { company_name: c.company_name }, c.company_name && {name:c.company_name}].filter(Boolean);
      const [a, p, s, o] = await Promise.all([
        accountId ? base44.entities.Account.get(accountId) : matches.length ? base44.entities.Account.filter({ $or: matches }, { limit: 1 }).then(page => page.items[0] || null) : Promise.resolve(null),
        internal ? base44.entities.ContactProfile.filter({ contact_id: contactId }, { limit: 1 }) : Promise.resolve({ items: [] }),
        internal ? base44.entities.Contact.filter({ portal_role: { $in: ['admin','director','regional_director','bsm','finance','bdm'] } }, { sort: 'full_name', limit: 100, fields: ['full_name','portal_role'] }) : Promise.resolve({ items: [] }),
        internal ? base44.entities.Opportunity.filter({ contact_id: contactId }, { sort: '-created_date', limit: 50, fields: ['title','stage','status','account_id'] }) : Promise.resolve({ items: [] }),
      ]);
      const linkedAccount = a || (!accountId && o.items[0]?.account_id ? await base44.entities.Account.get(o.items[0].account_id) : null);
      if (active) { setContact(c); setAccount(linkedAccount); setProfile(p.items[0] || null); setStaff(s.items); setOpportunities(o.items); }
      if (internal) await refreshSignals();
    })().catch(e => { if (active) setError(e.message || 'Unable to load contact.'); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [contactId, accountId, internal, revision]);
  useEffect(() => {
    if (!internal) return;
    return base44.entities.ContactProfile.subscribe(event => { if (event.data?.contact_id === contactId && ['create','update'].includes(event.type)) setProfile(event.data); });
  }, [contactId, internal]);
  useEffect(() => { if (!action) return; requestAnimationFrame(() => document.getElementById(['log','note'].includes(action) ? 'contact-activity' : ['task','followup'].includes(action) ? 'contact-tasks' : 'contact-action-panel')?.scrollIntoView({ block: 'start' })); }, [action]);
  if (loading) return <p className="p-8 text-muted-foreground">Loading person…</p>;
  if (error) return <p role="alert" className="p-8 text-destructive">{error}</p>;
  if (!contact || (accountId && !account)) return <p className="p-8 text-muted-foreground">Person not found.</p>;
  const belongs = !accountId || contactBelongsToAccount(account,contact);
  if (!belongs) return <p>This person is not linked to this organisation.</p>;
  if (!internal) return <div className="rounded-xl border border-border bg-card p-6"><h1 className="font-heading text-2xl font-semibold">{contact.full_name}</h1><p>{contact.job_title} · {contact.company_name}</p>{contact.email && <a className="text-primary" href={`mailto:${contact.email}`}>{contact.email}</a>}</div>;
  const owner = staff.find(s => s.id === profile?.relationship_owner_contact_id)?.full_name;
  const days = last ? Math.max(0, Math.floor((Date.now() - new Date(last).getTime()) / 86400000)) : null;
  const health = days == null ? 'No interaction recorded yet' : `${days} days since the last recorded interaction${openCount ? ' · Linked to a live opportunity' : ''}`;
  const editProps = { contact, profile, staff, isAdmin: user?.role === 'admin', onCancel: () => setEditingSection(null), onSaved: async updated => { setProfile(updated); setContact(await base44.entities.Contact.get(contact.id)); setEditingSection(null); } };
  const editCards = { editingSection, onEdit: section => { setAction(''); setEditingSection(section); }, editorProps: editProps, canEdit };
  return <div className="min-w-0 space-y-5" data-alice-contact-id={contact.id} data-alice-contact-name={contact.full_name}>
    <nav className="flex flex-wrap gap-2 text-xs text-muted-foreground" aria-label="Breadcrumb"><Link to="/people" className="hover:text-primary">Relationships / People</Link>{accountId && account && <><span>/</span><Link className="hover:text-primary" to={`/accounts/${account.id}?tab=contacts`}>{account.name}</Link></>}<span>/ {contact.full_name}</span></nav>
    <ContactHeader contact={contact} account={account} profile={profile} owner={owner} last={last} next={next} health={health} canEdit={canEdit} onAction={key => { setEditingSection(null);setTab(['log','note'].includes(key) ? 'activity' : 'overview'); setAction(key); }} />
    <div id="contact-action-panel">{action === 'opportunity' && account?.account_type === 'client' && <ContactOpportunityForm contact={contact} account={account} user={user} onCancel={() => setAction('')} onSaved={() => { setAction(''); setRevision(r => r + 1); }} />}</div>
    <Tabs value={tabs.includes(params.get('tab')) && (params.get('tab')!=='portal' || user?.role==='admin') ? params.get('tab') : 'overview'} onValueChange={setTab} className="space-y-5">
      <TabsList className="flex h-auto flex-wrap justify-start gap-2 border-b border-border bg-transparent p-0 pb-2"><TabsTrigger value="overview">Overview</TabsTrigger><TabsTrigger value="activity">Activity</TabsTrigger><TabsTrigger value="opportunities">Opportunities</TabsTrigger><TabsTrigger value="projects">Projects</TabsTrigger>{user?.role==='admin' && <TabsTrigger value="portal">Portal Account</TabsTrigger>}</TabsList>
      <TabsContent value="overview"><div className="grid gap-5 xl:grid-cols-[minmax(0,7fr)_minmax(290px,3fr)]"><main className="min-w-0 space-y-5"><PersonAllSeeingEye contact={contact} profile={profile} owner={owner} canEdit={canEdit}/><PersonOverviewPanels contact={contact} account={account} profile={profile} owner={owner} last={last} next={next} openCount={openCount} {...editCards}/><details className="rounded-xl border border-border bg-card p-5"><summary className="cursor-pointer text-sm font-semibold">More relationship context</summary><div className="mt-4 space-y-4"><ContactOverviewCards includePrimary={false} contact={contact} profile={profile} owner={owner} health={health} {...editCards}/><ContactOverviewCards includePrimary={false} contact={contact} profile={profile} owner={owner} health={health} column="side" {...editCards}/></div></details></main><aside className="space-y-5"><div id="contact-tasks"><ContactTasks contact={contact} account={account} user={user} canEdit={canEdit} mode={action} onClose={()=>setAction('')} onChanged={()=>refreshSignals().catch(e=>setError(e.message))}/></div><PersonColleagues account={account} contactId={contact.id}/><ContactKeyDates contact={contact} user={user} canEdit={canEdit}/><ContactConnections contactId={contact.id} staff={staff} ownerId={profile?.relationship_owner_contact_id} canEdit={canEdit} user={user}/></aside></div></TabsContent>
      <TabsContent value="activity"><div id="contact-activity"><ContactActivity contact={contact} account={account} user={user} canEdit={canEdit} mode={action} onClose={()=>setAction('')} onLogged={()=>{refreshSignals().catch(e=>setError(e.message));setRevision(r=>r+1);}} opportunities={opportunities}/></div></TabsContent>
      <TabsContent value="opportunities"><ContactOpportunities key={revision} contactId={contact.id}/></TabsContent>
      <TabsContent value="projects"><ContactProjects contact={contact}/></TabsContent>
      {user?.role==='admin' && <TabsContent value="portal"><PersonPortalAccount contact={contact}/></TabsContent>}
    </Tabs>
  </div>;
}