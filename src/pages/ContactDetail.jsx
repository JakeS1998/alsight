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
import {useQueryClient} from '@tanstack/react-query';
import {Button} from '@/components/ui/button';
import loadPersonDetail from '@/components/relationships/loadPersonDetail';
import RecordUpdatedAt from '@/components/RecordUpdatedAt';
import DataverseRecordEdit from '@/components/dataverse/DataverseRecordEdit';

export default function ContactDetail() {
  const { accountId, contactId } = useParams();
  const [params,setParams]=useSearchParams();
  const tabs=['overview','activity','opportunities','projects','portal'];
  const setTab=tab=>setParams(old=>{const next=new URLSearchParams(old);next.set('tab',tab);next.delete('action');return next;},{replace:true});
  const { user } = useAuth();
  const cache=useQueryClient();
  const [signalError,setSignalError]=useState('');
  const refreshPerson=()=>{cache.invalidateQueries({queryKey:['person-detail',user?.id,user?.role,contactId,accountId]});cache.invalidateQueries({queryKey:['person-header-signals',user?.id,user?.role,contactId]});setRevision(r=>r+1);};
  const internal = INTERNAL_ROLES.includes(user?.role);
  const canEdit = ['admin','director','bdm','bsm'].includes(user?.role);
  const [contact, setContact] = useState(null), [account, setAccount] = useState(null), [profile, setProfile] = useState(null), [staff, setStaff] = useState([]), [opportunities, setOpportunities] = useState([]);
  const [last, setLast] = useState(null), [next, setNext] = useState(null), [openCount, setOpenCount] = useState(0), [revision, setRevision] = useState(0);
  const [loading, setLoading] = useState(true), [error, setError] = useState(''), [action, setAction] = useState(params.get('action') || '');
  const [editingSection, setEditingSection] = useState(null);
  useEffect(()=>{setAction(params.get('action') || '');},[params.get('action')]);
  const refreshSignals = async (fresh=false) => {
    if (!internal) return;
    setSignalError('');
    const summary=await cache.fetchQuery({queryKey:['person-header-signals',user?.id,user?.role,contactId],staleTime:fresh ? 0 : 60000,retry:false,queryFn:async()=>{
      const [activities,conversations,tasks,count]=await Promise.all([
        base44.entities.CRMActivity.filter({contact_id:contactId},{sort:'-occurred_at',limit:1}),
        base44.entities.Conversation.filter({contact_id:contactId},{sort:'-occurred_at',limit:1}),
        base44.entities.CRMContactTask.filter({contact_id:contactId,status:'open'},{sort:'due_at',limit:1}),
        base44.entities.Opportunity.count({contact_id:contactId,status:'open'})
      ]);
      return {last:[activities.items[0]?.occurred_at,conversations.items[0]?.occurred_at].filter(Boolean).sort().at(-1) || null,next:tasks.items[0] || null,count};
    }});
    setLast(summary.last);setNext(summary.next);setOpenCount(summary.count);
  };
  useEffect(() => {
    let active = true; setLoading(true); setError('');
    (async () => {
      const data=await loadPersonDetail(cache,{contactId,accountId,internal,user});
      if(!active) return;
      setContact(data.contact);setAccount(data.account || null);setProfile(data.profile || null);setStaff(data.staff || []);setOpportunities(data.opportunities || []);
      if(data.contact && internal) await refreshSignals().catch(e=>{if(active)setSignalError(e.message || 'Relationship summary could not be loaded.');});
    })().catch(e => { if (active) setError(e.message || 'Unable to load contact.'); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [contactId, accountId, internal, revision, cache, user?.id, user?.role]);
  useEffect(() => {
    if (!internal) return;
    return base44.entities.ContactProfile.subscribe(event => { if (event.data?.contact_id === contactId && ['create','update'].includes(event.type)) {setProfile(event.data);cache.setQueryData(['person-detail',user?.id,user?.role,contactId,accountId],old=>old ? {...old,profile:event.data} : old);} });
  }, [contactId, accountId, internal, cache, user?.id, user?.role]);
  useEffect(() => { if (!action) return; requestAnimationFrame(() => document.getElementById(['log','note'].includes(action) ? 'contact-activity' : ['task','followup'].includes(action) ? 'contact-tasks' : 'contact-action-panel')?.scrollIntoView({ block: 'start' })); }, [action]);
  if (loading) return <p className="p-8 text-muted-foreground">Loading person…</p>;
  if (error) return <div role="alert" className="space-y-3 p-8"><p className="text-destructive">{/rate limit|too many requests/i.test(error) ? 'Too many requests. Please wait a minute, then try again.' : error}</p><Button variant="outline" onClick={refreshPerson}>Try again</Button> <Link className="text-sm underline" to="/people">Back to People</Link></div>;
  if (!contact || (accountId && !account)) return <p className="p-8 text-muted-foreground">Person not found.</p>;
  const belongs = !accountId || contactBelongsToAccount(account,contact);
  if (!belongs) return <p>This person is not linked to this organisation.</p>;
  if (!internal) return <div className="rounded-xl border border-border bg-card p-6"><h1 className="font-heading text-2xl font-semibold">{contact.full_name}</h1><p>{contact.job_title} · {contact.company_name}</p>{contact.email && <a className="text-primary" href={`mailto:${contact.email}`}>{contact.email}</a>}<RecordUpdatedAt record={contact} className="mt-3" /></div>;
  const owner = staff.find(s => s.id === profile?.relationship_owner_contact_id)?.full_name;
  const days = last ? Math.max(0, Math.floor((Date.now() - new Date(last).getTime()) / 86400000)) : null;
  const health = signalError ? 'Relationship summary temporarily unavailable' : days == null ? 'No interaction recorded yet' : `${days} days since the last recorded interaction${openCount ? ' · Linked to a live opportunity' : ''}`;
  const editProps = { contact, profile, staff, isAdmin: user?.role === 'admin', onCancel: () => setEditingSection(null), onSaved: async updated => { setProfile(updated); setContact(await base44.entities.Contact.get(contact.id)); cache.invalidateQueries({queryKey:['person-detail',user?.id,user?.role,contactId,accountId]}); setEditingSection(null); } };
  const editCards = { editingSection, onEdit: section => { setAction(''); setEditingSection(section); }, editorProps: editProps, canEdit };
  return <div className="min-w-0 space-y-5" data-alice-contact-id={contact.id} data-alice-contact-name={contact.full_name}>
    <nav className="flex flex-wrap gap-2 text-xs text-muted-foreground" aria-label="Breadcrumb"><Link to="/people" className="hover:text-primary">Relationships / People</Link>{accountId && account && <><span>/</span><Link className="hover:text-primary" to={`/accounts/${account.id}?tab=contacts`}>{account.name}</Link></>}<span>/ {contact.full_name}</span></nav>
    {signalError && <p role="alert" className="rounded-lg border border-border bg-card p-3 text-sm text-destructive">Relationship summary unavailable: {signalError} <button className="underline" onClick={()=>refreshSignals(true).catch(e=>setSignalError(e.message))}>Try again</button></p>}
    <ContactHeader contact={contact} account={account} profile={profile} owner={owner} last={last} next={next} health={health} canEdit={canEdit} onAction={key => { setEditingSection(null);setTab(['log','note'].includes(key) ? 'activity' : 'overview'); setAction(key); }} />
    <DataverseRecordEdit table="contacts" record={contact} onUpdated={setContact} />
    <div id="contact-action-panel">{action === 'opportunity' && account?.account_type === 'client' && <ContactOpportunityForm contact={contact} account={account} user={user} onCancel={() => setAction('')} onSaved={() => { setAction(''); refreshPerson(); }} />}</div>
    <Tabs value={tabs.includes(params.get('tab')) && (params.get('tab')!=='portal' || user?.role==='admin') ? params.get('tab') : 'overview'} onValueChange={setTab} className="space-y-5">
      <TabsList className="flex h-auto flex-wrap justify-start gap-2 border-b border-border bg-transparent p-0 pb-2"><TabsTrigger value="overview">Overview</TabsTrigger><TabsTrigger value="activity">Activity</TabsTrigger><TabsTrigger value="opportunities">Opportunities</TabsTrigger><TabsTrigger value="projects">Projects</TabsTrigger>{user?.role==='admin' && <TabsTrigger value="portal">Portal Account</TabsTrigger>}</TabsList>
      <TabsContent value="overview"><div className="grid gap-5 xl:grid-cols-[minmax(0,7fr)_minmax(290px,3fr)]"><main className="min-w-0 space-y-5"><PersonAllSeeingEye contact={contact} profile={profile} owner={owner} canEdit={canEdit}/><PersonOverviewPanels contact={contact} account={account} profile={profile} owner={owner} last={last} next={next} openCount={openCount} {...editCards}/><details className="rounded-xl border border-border bg-card p-5"><summary className="cursor-pointer text-sm font-semibold">More relationship context</summary><div className="mt-4 space-y-4"><ContactOverviewCards includePrimary={false} contact={contact} profile={profile} owner={owner} health={health} {...editCards}/><ContactOverviewCards includePrimary={false} contact={contact} profile={profile} owner={owner} health={health} column="side" {...editCards}/></div></details></main><aside className="space-y-5"><div id="contact-tasks"><ContactTasks contact={contact} account={account} user={user} canEdit={canEdit} mode={action} onClose={()=>setAction('')} onChanged={()=>refreshSignals(true).catch(e=>setSignalError(e.message))}/></div><PersonColleagues account={account} contactId={contact.id}/><ContactKeyDates contact={contact} user={user} canEdit={canEdit}/><ContactConnections contactId={contact.id} staff={staff} ownerId={profile?.relationship_owner_contact_id} canEdit={canEdit} user={user}/></aside></div></TabsContent>
      <TabsContent value="activity"><div id="contact-activity"><ContactActivity contact={contact} account={account} user={user} canEdit={canEdit} mode={action} onClose={()=>setAction('')} onLogged={()=>refreshSignals(true).catch(e=>setSignalError(e.message))} opportunities={opportunities}/></div></TabsContent>
      <TabsContent value="opportunities"><ContactOpportunities key={revision} contactId={contact.id}/></TabsContent>
      <TabsContent value="projects"><ContactProjects contact={contact}/></TabsContent>
      {user?.role==='admin' && <TabsContent value="portal"><PersonPortalAccount contact={contact}/></TabsContent>}
    </Tabs>
  </div>;
}