import React from 'react';
import { Link } from 'react-router-dom';
import { Users } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import DashboardPanel from '@/components/dashboard/DashboardPanel';
import organisationQueryPolicy from '@/components/data/organisationQueryPolicy';
import { formatDate } from '@/lib/portal';
export default function TodayContactSuggestions({ user, onFollowup }) {
  const query = useQuery({ queryKey: ['today-contact-suggestions', user.id, user.role], ...organisationQueryPolicy, staleTime: 300000, queryFn: async () => {
    const load = async filters => { const { data } = await base44.functions.invoke('getRelationshipWorkspace', { filters, limit: 3 }); if (data.error) throw new Error(data.error); return data.rows; };
    const attention = await load({ focus: 'attention', status: 'active' });
    return attention.length ? { rows: attention, attention: true } : { rows: await load({ status: 'active' }), attention: false };
  } });
  const reason = row => row.next?.due_at && new Date(row.next.due_at).getTime() < Date.now() ? `Overdue action: ${row.next.title}` : row.last ? `Last recorded interaction: ${formatDate(row.last)}.${row.profile?.key_decision_maker ? ' Key decision-maker.' : ''}` : `No interaction recorded yet.${row.profile?.key_decision_maker ? ' Key decision-maker.' : ''}`;
  return <DashboardPanel title="Consider touching base with" subtitle={query.data?.attention ? 'Prioritising overdue actions and relationships without recent recorded contact.' : 'Suggestions from your active contacts in the People workspace.'}>
    {query.isPending ? <p role="status" className="text-xs text-muted-foreground">Finding contacts to reconnect with…</p> : query.error ? <div role="alert" className="text-xs text-destructive">Unable to load contact suggestions. <button onClick={() => query.refetch()} className="font-semibold underline">Try again</button></div> : !query.data.rows.length ? <p className="text-xs text-muted-foreground">No active contacts available for suggestions.</p> : <ul className="space-y-3">{query.data.rows.map(row => <li key={row.person.id} className="rounded-lg bg-secondary/60 p-3"><div className="flex items-start gap-2"><Users className="mt-0.5 h-4 w-4 shrink-0 text-chart-2" /><div className="min-w-0"><Link to={`/people/${row.person.id}`} className="text-sm font-semibold hover:underline">{row.person.full_name}</Link><p className="mt-1 text-xs text-muted-foreground">{[row.person.job_title || row.person.officer_role, row.organisation?.name || row.person.company_name].filter(Boolean).join(' · ')}</p><p className="mt-1 text-xs text-muted-foreground">{reason(row)}</p><button onClick={() => onFollowup(`Touch base: ${row.person.full_name}`, row.person.id)} className="mt-2 text-xs font-semibold text-chart-2 hover:underline">Plan a follow-up</button></div></div></li>)}</ul>}
  </DashboardPanel>;
}