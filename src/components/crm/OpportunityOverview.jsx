import React from 'react';
import fullName from '@/components/data/fullName';
import { Link } from 'react-router-dom';
import { formatCurrency } from '@/lib/portal';
import CRMTaskList from '@/components/crm/CRMTaskList';
import OpportunityAllSeeingEye from '@/components/intelligence/OpportunityAllSeeingEye';
import CRMActivityTimeline from '@/components/crm/CRMActivityTimeline';
import { chance, weighted } from '@/components/crm/crm';
export default function OpportunityOverview({ item, account, contacts, user, canEdit, onAction }) {
  const contact = contacts.find(c => c.id === item.contact_id);
  const age = item.created_date ? Math.max(0, Math.floor((Date.now() - new Date(item.created_date).getTime()) / 86400000)) : 0;
  const stageAge = item.stage_entered_at ? Math.max(0, Math.floor((Date.now() - new Date(item.stage_entered_at).getTime()) / 86400000)) : age;

  return <div className="grid gap-5 xl:grid-cols-[minmax(0,7fr)_minmax(280px,3fr)]"><div className="min-w-0 space-y-5">
    <OpportunityAllSeeingEye item={item} user={user} canEdit={canEdit} onAction={onAction}/>
    <section className="rounded-xl border border-border bg-card p-5"><h2 className="font-semibold">Opportunity snapshot</h2><dl className="mt-3 grid gap-3 text-sm sm:grid-cols-3">{[['Organisation', account.name], ['Primary person', contact?.full_name || '—'], ['Location', [item.location, item.site_postcode].filter(Boolean).join(' · ') || '—'], ['Owner', item.owner_id ? fullName(item.owner_name,item.owner_id) : 'Unassigned'], ['Age', `${age} days`], ['Days in stage', `${stageAge} days`]].map(([k,v]) => <div key={k} className="min-w-0"><dt className="text-xs text-muted-foreground">{k}</dt><dd className="break-words font-medium">{v}</dd></div>)}</dl>{item.project_details && <p className="mt-3 whitespace-pre-wrap break-words text-sm text-muted-foreground">{item.project_details}</p>}</section>
    <section className="rounded-xl border border-border bg-card p-5"><h2 className="font-semibold">Project brief &amp; team</h2><p className="mt-2 break-words text-sm text-muted-foreground">{item.scope_summary || item.client_objectives || 'The project brief has not been started yet.'}</p><p className="mt-2 break-words text-sm">{item.design_team?.length ? `${item.design_team.length} proposed team member(s): ${item.design_team.map(m => m.role).join(', ')}` : 'No design team members recorded.'}</p></section>
    <CRMActivityTimeline item={item} user={user} canEdit={canEdit} compact />
  </div><aside className="min-w-0 space-y-5"><div id="opportunity-actions"><CRMTaskList item={item} user={user} canEdit={canEdit} /></div>

    <section className="rounded-xl border border-border bg-card p-5"><h2 className="font-semibold">Commercial summary</h2><dl className="mt-2 space-y-2 text-sm">{[['Project value', formatCurrency(item.budget)], ['Probability', `${chance(item)}%`], ['Weighted project value', formatCurrency(weighted(item))], ['Latest fee proposal', item.fee_status || 'Not started']].map(([k,v]) => <div key={k} className="flex min-w-0 justify-between gap-3"><dt className="min-w-0 break-words text-muted-foreground">{k}</dt><dd className="min-w-0 break-words text-right font-medium">{v}</dd></div>)}</dl></section>
    {contact && <Link to={`/accounts/${account.id}/contacts/${contact.id}`} className="block rounded-xl border border-border bg-card p-5 text-sm text-primary">Person: {contact.full_name} →</Link>}
  </aside></div>;
}