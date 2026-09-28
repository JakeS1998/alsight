import React from 'react';
import { Link } from 'react-router-dom';
import { formatCurrency } from '@/lib/portal';
import CRMTaskList from '@/components/crm/CRMTaskList';
import CRMActivityTimeline from '@/components/crm/CRMActivityTimeline';
import { chance, weighted, isoToday } from '@/components/crm/crm';
export default function OpportunityOverview({ item, account, contacts, user, canEdit }) {
  const contact = contacts.find(c => c.id === item.contact_id);
  const age = item.created_date ? Math.max(0, Math.floor((Date.now() - new Date(item.created_date).getTime()) / 86400000)) : 0;
  const stageAge = item.stage_entered_at ? Math.max(0, Math.floor((Date.now() - new Date(item.stage_entered_at).getTime()) / 86400000)) : age;
  const reasons = [!item.owner_id && 'No owner assigned', !item.contact_id && 'No primary contact', !item.expected_decision_date && 'No decision date', item.expected_decision_date && item.expected_decision_date < isoToday() && 'Expected decision overdue', stageAge > 45 && 'Long time in current stage'].filter(Boolean);
  const health = reasons.length > 2 ? 'At Risk' : reasons.length ? 'Attention Required' : 'Healthy';
  return <div className="grid gap-5 xl:grid-cols-[minmax(0,7fr)_minmax(280px,3fr)]"><div className="min-w-0 space-y-5">
    <section className="rounded-xl border border-border bg-card p-5"><h2 className="font-semibold">Opportunity snapshot</h2><dl className="mt-3 grid gap-3 text-sm sm:grid-cols-3">{[['Client', account.name], ['Primary contact', contact?.full_name || '—'], ['Location', [item.location, item.site_postcode].filter(Boolean).join(' · ') || '—'], ['Owner', item.owner_name || 'Unassigned'], ['Age', `${age} days`], ['Days in stage', `${stageAge} days`]].map(([k,v]) => <div key={k} className="min-w-0"><dt className="text-xs text-muted-foreground">{k}</dt><dd className="break-words font-medium">{v}</dd></div>)}</dl>{item.project_details && <p className="mt-3 whitespace-pre-wrap break-words text-sm text-muted-foreground">{item.project_details}</p>}</section>
    <section className="rounded-xl border border-border bg-card p-5"><h2 className="font-semibold">Project brief &amp; team</h2><p className="mt-2 break-words text-sm text-muted-foreground">{item.scope_summary || item.client_objectives || 'The project brief has not been started yet.'}</p><p className="mt-2 break-words text-sm">{item.design_team?.length ? `${item.design_team.length} proposed team member(s): ${item.design_team.map(m => m.role).join(', ')}` : 'No design team members recorded.'}</p></section>
    <CRMActivityTimeline item={item} user={user} canEdit={canEdit} compact />
  </div><aside className="min-w-0 space-y-5"><CRMTaskList item={item} user={user} canEdit={canEdit} />
    <section className="rounded-xl border border-border bg-card p-5"><h2 className="font-semibold">Opportunity health</h2><span title={reasons.join('; ') || 'No issues identified'} className="mt-2 inline-block rounded-full bg-muted px-3 py-1 text-sm font-medium">{health}</span><ul className="mt-2 space-y-1 text-sm text-muted-foreground">{reasons.map(reason => <li key={reason}>• {reason}</li>)}</ul></section>
    <section className="rounded-xl border border-border bg-card p-5"><h2 className="font-semibold">Commercial summary</h2><dl className="mt-2 space-y-2 text-sm">{[['Project value', formatCurrency(item.budget)], ['Alliance fee', formatCurrency(item.alliance_fee)], ['Probability', `${chance(item)}%`], ['Weighted project value', formatCurrency(weighted(item))], ['Latest fee proposal', item.fee_status || 'Not started']].map(([k,v]) => <div key={k} className="flex min-w-0 justify-between gap-3"><dt className="min-w-0 break-words text-muted-foreground">{k}</dt><dd className="min-w-0 break-words text-right font-medium">{v}</dd></div>)}</dl></section>
    {contact && <Link to={`/accounts/${account.id}/contacts/${contact.id}`} className="block rounded-xl border border-border bg-card p-5 text-sm text-primary">Contact: {contact.full_name} →</Link>}
  </aside></div>;
}