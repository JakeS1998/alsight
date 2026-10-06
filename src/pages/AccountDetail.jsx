import React, { useEffect, useRef, useState } from "react";
import { useParams, Link, useSearchParams } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { filterAll } from "@/components/data/loadAll";
import accountContactQuery from '@/components/accounts/accountContactQuery';
import { Button } from '@/components/ui/button';
import { formatDate, formatCurrency } from "@/lib/portal";
import { DocTypeBadge, ExecutedBadge, WarrantyStatusBadge } from "@/components/StatusBadge";
import AccountCRM from '@/components/crm/AccountCRM';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useQueryClient } from '@tanstack/react-query';
import AccountHeader from '@/components/accounts/AccountHeader';
import AccountClassification from '@/components/accounts/AccountClassification';
import AccountOverview from '@/components/accounts/AccountOverview';
import AccountFinancials from '@/components/accounts/AccountFinancials';
import AccountActivity from '@/components/accounts/AccountActivity';
import useAccountsView from '@/components/accounts/useAccountsView';
import '@/components/accounts/accounts.css';
import { Users, FolderKanban, FileText, ShieldCheck, Mail, Gavel } from "lucide-react";

export default function AccountDetail() {
  const { accountId } = useParams();
  const [params,setParams]=useSearchParams();
  const currentAccountId = useRef(accountId);
  currentAccountId.current = accountId;
  const { user } = useAuth();
  const cache = useQueryClient();
  const summary = useAccountsView({ accountId });
  const summaryRow = summary.data?.items.find(row => row.account.id === accountId);
  const signals = summaryRow?.signals;
  const [account, setAccount] = useState(null);
  const [contacts, setContacts] = useState([]);
  const [contactPage, setContactPage] = useState(null);
  const [contactTotal, setContactTotal] = useState(0);
  const [loadingContacts, setLoadingContacts] = useState(false);
  const [projects, setProjects] = useState([]);
  const [docs, setDocs] = useState([]);
  const [warranties, setWarranties] = useState([]);
  const [jcts, setJcts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;
    return base44.entities.Account.subscribe(event => {
      if (event.type !== 'update' || event.id !== accountId || !Object.prototype.hasOwnProperty.call(event.data || {}, 'company_number')) return;
      setAccount(current => current ? { ...current, company_number: event.data.company_number } : current);
      cache.setQueryData(['account-record',user.id,user.role,accountId], current => current ? { ...current, company_number: event.data.company_number } : current);
    });
  }, [accountId,user?.id,user?.role,cache]);

  useEffect(() => {
    let active = true;
    if (!user?.id) return;
    setLoading(true);
    setContacts([]);
    setContactPage(null);
    (async () => {
      try {
        const acc = await cache.fetchQuery({queryKey:['account-record',user.id,user.role,accountId],queryFn:()=>base44.entities.Account.get(accountId)});
        if (!active) return;
        setAccount(acc);
        const dvId = acc.dataverse_id || acc.id;
                 const projectAccountId = dvId || acc.id;

        const contactQuery = accountContactQuery(acc);
        const [contactResults, directProjects, d, w, j] = await cache.fetchQuery({queryKey:['account-related-records','all-organisation-contacts',user.id,user.role,accountId],queryFn:()=>Promise.all([
          Promise.all([base44.entities.Contact.filter(contactQuery, {sort:'full_name',limit:50}), base44.entities.Contact.count(contactQuery)]),
          filterAll(base44.entities.Project, { $or: [{ client_account_id: projectAccountId }, { account_id: projectAccountId }], status: { $ne: "inactive" } }).catch(() => []),
          filterAll(base44.entities.LegalDocument, { $or: [{ account_id: dvId }, { client_account_id: dvId }], status: { $in: ["active", "inactive"] } }).catch(() => []),
          filterAll(base44.entities.Warranty, { $or: [{ account_id: dvId }, { supplier_id: dvId }, { client_account_id: dvId }] }).catch(() => []),
          filterAll(base44.entities.JCT, { $or: [{ account_id: dvId }, { contractor_id: dvId }, { client_account_id: dvId }] }).catch(() => []),
        ])});

        const [contactsPage, totalContacts] = contactResults;

        // Projects: direct account link plus any project referenced by related docs/warranties/JCTs
        const projectIdSet = new Set();
        directProjects.forEach((p) => p.dataverse_id && projectIdSet.add(p.dataverse_id));
        [d, w, j].forEach((arr) => arr.forEach((r) => r.project_id && projectIdSet.add(r.project_id)));
        let projects = directProjects;
        if (projectIdSet.size > directProjects.length) {
          const derived = await filterAll(base44.entities.Project, { dataverse_id: { $in: [...projectIdSet] }, status: { $ne: "inactive" } }).catch(() => []);
          const map = {};
          [...directProjects, ...derived].forEach((p) => { map[p.dataverse_id || p.id] = p; });
          projects = Object.values(map);
        }

        if (!active) return;
        setContacts(contactsPage.items);
        setContactPage(contactsPage);
        setContactTotal(totalContacts);
        setProjects(projects);
        setDocs(d);
        setWarranties(w);
        setJcts(j);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [accountId,user?.id,user?.role,cache]);

  if (loading) {
    return <div className="flex justify-center py-20"><div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-primary" /></div>;
  }

  if (!account) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white py-16 text-center">
        <p className="text-sm text-slate-500">Organisation not found.</p>
        <Link to="/accounts" className="mt-3 inline-block text-sm text-primary hover:underline">Back to Organisations</Link>
      </div>
    );
  }

  const projectByDv = {};
  projects.forEach((p) => { if (p.dataverse_id) projectByDv[p.dataverse_id] = p; });

  return (
    <Tabs value={['overview','contacts','projects','opportunities','financials','activity','documents'].includes(params.get('tab')) ? params.get('tab') : 'overview'} onValueChange={tab=>setParams(current=>{const next=new URLSearchParams(current);next.set('tab',tab);return next;},{replace:true})} className="account-profile space-y-6">
      <div className="account-sticky-header">
        <AccountHeader account={account} owner={summary.isPending ? 'Loading…' : signals?.owner || (account.account_manager_aad_id ? 'Assigned owner' : 'Not assigned')} actions={<AccountClassification account={account} user={user} onSaved={updated => setAccount(current => ({ ...current,...updated }))} />} />
        <TabsList className="account-tabs mt-4" aria-label="Relationship sections">
          {['Overview','Contacts','Projects',...(['admin','director','regional_director','bsm','finance','bdm'].includes(user?.role) ? ['Opportunities'] : []),...(['admin','director','regional_director','bsm','finance','bdm','client'].includes(user?.role) ? ['Financials'] : []),'Activity','Documents'].map(title => <TabsTrigger key={title} value={title.toLowerCase()}>{title==='Contacts' ? 'People' : title}</TabsTrigger>)}
        </TabsList>
      </div>
      <TabsContent value="overview"><AccountOverview account={summaryRow?.account ? {...account,_ase:summaryRow.account._ase} : account} contacts={contacts} projects={projects} signals={signals} user={user} summaryLoading={summary.isPending} summaryError={summary.error} onSummaryRetry={()=>summary.refetch()} onAccountEnriched={updated=>setAccount(current=>({...current,...updated}))} /></TabsContent>
      <TabsContent value="contacts" className="space-y-6">
      {/* Linked Contacts */}
      <Section icon={Users} title="People at this organisation" count={contactTotal}>
        {contacts.length === 0 ? <Empty text="No people linked to this organisation yet" /> : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {contacts.map((c) => (
              <div key={c.id} className="rounded-xl border border-slate-200 bg-white p-4">
                               <Link to={`/accounts/${account.id}/contacts/${c.id}`} className="text-sm font-semibold text-primary hover:underline">{c.full_name}</Link>
                {c.job_title && <p className="text-xs text-slate-500">{c.job_title}</p>}
                {c.email && <p className="mt-1 flex items-center gap-1 text-xs text-slate-500"><Mail className="h-3 w-3" /> {c.email}</p>}
                {c.phone && <p className="text-xs text-slate-500">{c.phone}</p>}
                {c.officer_role && <p className="mt-1 text-xs text-slate-400">Officer: {c.officer_role}</p>}
                {user?.role==='admin' && <Link to={`/accounts/${account.id}/contacts/${c.id}?tab=portal`} className="mt-3 inline-block rounded-full bg-secondary px-2 py-1 text-xs hover:bg-muted">{c.aad_id ? 'Linked portal identity' : 'Review portal access'}</Link>}
              </div>
            ))}
          </div>
        )}
      </Section>
      {contactPage?.has_more && <Button variant="outline" disabled={loadingContacts} onClick={async () => {
        setLoadingContacts(true);
        try {
          const page = await base44.entities.Contact.filter(accountContactQuery(account), {sort:'full_name',limit:50,cursor:contactPage.next_cursor});
          if (currentAccountId.current !== account.id) return;
          setContacts(current => [...current,...page.items]);
          setContactPage(page);
        } finally { setLoadingContacts(false); }
      }}>{loadingContacts ? 'Loading people…' : 'Load more people'}</Button>}

      </TabsContent>
      <TabsContent value="opportunities" className="space-y-6">
        {['admin','director','regional_director','bsm','finance','bdm'].includes(user?.role) ? <AccountCRM account={account} contacts={contacts} user={user} showConversation={false} onChanged={() => { cache.setQueryData(['accounts-revision'],Date.now()); cache.invalidateQueries({ queryKey: ['accounts-view'] }); cache.invalidateQueries({ queryKey: ['account-current-work',account.id] }); cache.invalidateQueries({ queryKey: ['account-recent-activity',account.id] }); cache.invalidateQueries({ queryKey: ['account-activity-opportunities',account.id] }); }} /> : <p className="account-panel text-sm text-muted-foreground">Opportunities are available to your authorised internal organisation team.</p>}
      </TabsContent>
      <TabsContent value="financials"><AccountFinancials account={account} projects={projects} user={user} signals={signals} /></TabsContent>
      <TabsContent value="activity"><AccountActivity account={account} contacts={contacts} user={user} /></TabsContent>
      <TabsContent value="projects" className="space-y-6">
      {/* Related Projects */}
      <Section icon={FolderKanban} title="Related Projects" count={projects.length}>
        {projects.length === 0 ? <Empty text="No projects linked to this account" /> : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((p) => (
              <Link key={p.id} to={`/projects/${p.id}`} className="group rounded-xl border border-slate-200 bg-white p-4 transition-shadow hover:shadow-md">
                <div className="flex items-center gap-2">
                  {p.project_number && <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600">{p.project_number}</span>}
                  <span className={p.live_project ? "rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700" : "rounded-full border border-orange-200 bg-orange-50 px-2 py-0.5 text-[10px] font-medium text-orange-700"}>{p.live_project ? "Live" : "On Hold"}</span>
                </div>
                <p className="mt-1.5 text-sm font-semibold text-slate-900 group-hover:text-primary">{p.name}</p>
                {user?.role !== 'supplier' && <p className="text-xs text-slate-500">{formatCurrency(p.estimated_value)}</p>}
              </Link>
            ))}
          </div>
        )}
      </Section>

      </TabsContent>
      <TabsContent value="documents" className="space-y-6">
      {account.sharepoint_folder && <a className="inline-block text-sm font-semibold underline" href={account.sharepoint_folder} target="_blank" rel="noreferrer">Open SharePoint document folder ↗</a>}
      {/* Legal Documents */}
      <Section icon={FileText} title="Legal Documents" count={docs.length}>
        {docs.length === 0 ? <Empty text="No legal documents for this account" /> : (
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                  <th className="px-4 py-3">Document ID</th>
                  <th className="px-4 py-3">Project</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Executed</th>
                  <th className="hidden px-4 py-3 sm:table-cell">Drafted</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {docs.map((d) => {
                  const proj = projectByDv[d.project_id];
                  return (
                    <tr key={d.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 text-sm font-medium text-slate-900">
                        {proj ? <Link to={`/projects/${proj.id}?tab=${user?.role === 'supplier' ? 'timeline' : 'drafting'}`} className="text-blue-600 hover:underline">{d.document_id}</Link> : d.document_id}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600">
                        {proj ? <Link to={`/projects/${proj.id}?tab=${user?.role === 'supplier' ? 'timeline' : 'drafting'}`} className="text-blue-600 hover:underline">{proj.name}</Link> : "—"}
                      </td>
                      <td className="px-4 py-3"><DocTypeBadge type={d.document_type} /></td>
                      <td className="px-4 py-3"><ExecutedBadge status={d.executed} /></td>
                      <td className="hidden px-4 py-3 text-sm text-slate-600 sm:table-cell">{formatDate(d.drafted_date)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Section>

      {/* Warranties & JCTs */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Section icon={ShieldCheck} title="Warranties" count={warranties.length}>
          {warranties.length === 0 ? <Empty text="No warranties" /> : (
            <div className="space-y-2">
              {warranties.map((w) => {
                const proj = projectByDv[w.project_id];
                const inner = (
                  <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-4 py-3 transition-shadow group-hover:shadow-sm">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-900">{w.warranty_id}</p>
                      <p className="truncate text-xs text-slate-500">{w.services || "—"}</p>
                      {proj && <p className="truncate text-xs text-blue-600">{proj.name}</p>}
                    </div>
                    <WarrantyStatusBadge status={w.warranty_status} dateOfExecution={w.date_of_execution} />
                  </div>
                );
                return proj ? (
                  <Link key={w.id} to={`/projects/${proj.id}?tab=${user?.role === 'supplier' ? 'timeline' : 'warranties'}`} className="group block">{inner}</Link>
                ) : <div key={w.id}>{inner}</div>;
              })}
            </div>
          )}
        </Section>

        <Section icon={Gavel} title="JCT Contracts" count={jcts.length}>
          {jcts.length === 0 ? <Empty text="No JCT contracts" /> : (
            <div className="space-y-2">
              {jcts.map((j) => {
                const proj = projectByDv[j.project_id];
                const inner = (
                  <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-4 py-3 transition-shadow group-hover:shadow-sm">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-900">{j.document_id}</p>
                      <p className="truncate text-xs text-slate-500">{j.form_of_jct || "—"}</p>
                      {proj && <p className="truncate text-xs text-blue-600">{proj.name}</p>}
                    </div>
                    <ExecutedBadge status={j.executed} />
                  </div>
                );
                return proj ? (
                  <Link key={j.id} to={`/projects/${proj.id}?tab=${user?.role === 'supplier' ? 'timeline' : 'drafting'}`} className="group block">{inner}</Link>
                ) : <div key={j.id}>{inner}</div>;
              })}
            </div>
          )}
        </Section>
      </div>
      </TabsContent>
    </Tabs>
  );
}

function Section({ icon: Icon, title, count, children }) {
  return (
    <div>
      <div className="mb-3 flex items-center gap-2">
        <Icon className="h-4 w-4 text-muted-foreground" />
        <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">{count}</span>
      </div>
      {children}
    </div>
  );
}

function Detail({ label, value }) {
  return (
    <div>
      <p className="text-xs text-slate-500">{label}</p>
      <p className="text-sm font-medium text-slate-700">{value || "—"}</p>
    </div>
  );
}

function Empty({ text }) {
  return <div className="rounded-xl border border-dashed border-slate-200 bg-white py-8 text-center text-sm text-slate-400">{text}</div>;
}