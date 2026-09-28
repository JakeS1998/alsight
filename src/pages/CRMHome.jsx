import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { formatCurrency } from '@/lib/portal';
import { STAGES, isoToday } from '@/components/crm/crm';
export default function CRMHome() {
  const { user } = useAuth();
  const [data, setData] = useState(null), [error, setError] = useState('');
  useEffect(() => { if (!user?.id) return; (async () => { try {
    const now = isoToday(), future = new Date(Date.now() + 90 * 86400000).toISOString().slice(0,10);
    const [mine, totals, expected, overdue, proposals, won, stages, tasks, recent] = await Promise.all([
      base44.entities.Opportunity.count({ owner_id: user.id, status: 'open' }),
      base44.entities.Opportunity.aggregate({ query: { status: 'open', stage: { $ne: 'on_hold' } }, sum: ['budget','weighted_value'] }),
      base44.entities.Opportunity.count({ status: 'open', expected_decision_date: { $gte: now, $lte: future } }),
      base44.entities.CRMTask.count({ owner_id: user.id, due_date: { $lt: now }, status: { $in: ['open','in_progress'] } }),
      base44.entities.Opportunity.count({ status: 'open', stage: { $in: ['proposal_submitted','negotiation'] } }),
      base44.entities.Opportunity.count({ status: 'won', won_date: { $gte: `${new Date().getFullYear() - (new Date().getMonth() < 3 ? 1 : 0)}-04-01` } }),
      base44.entities.Opportunity.aggregate({ query: { owner_id: user.id, status: 'open' }, groupBy: 'stage', sum: ['budget'] }),
      base44.entities.CRMTask.filter({ owner_id: user.id, status: { $in: ['open','in_progress'] } }, { sort: 'due_date', limit: 5 }),
      base44.entities.CRMActivity.filter({ author_id: user.id }, { sort: '-occurred_at', limit: 5 }),
    ]);
    setData({ mine, totals: totals.rows?.[0] || {}, expected, overdue, proposals, won, stages: stages.rows || [], tasks: tasks.items, recent: recent.items });
  } catch (e) { setError(e.message); } })(); }, [user?.id]);
  if (error) return <p role="alert" className="text-destructive">{error}</p>;
  if (!data) return <p className="text-muted-foreground">Loading CRM dashboard…</p>;
  const cards = [['My open opportunities', data.mine], ['Open pipeline value', formatCurrency(data.totals.sum_budget)], ['Weighted pipeline', formatCurrency(data.totals.sum_weighted_value)], ['Expected awards · 90 days', data.expected], ['Overdue actions', data.overdue], ['Proposals awaiting decision', data.proposals], ['Won this financial year', data.won]];
  return <div className="space-y-6"><div className="flex flex-wrap items-center justify-between gap-2"><div><h1 className="font-heading text-2xl font-semibold">Pipeline Home</h1><p className="text-sm text-muted-foreground">Your business development workspace</p></div><Link to="/crm/opportunities" className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">View opportunities</Link></div>
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{cards.map(([label, value]) => <div key={label} className="rounded-xl border border-border bg-card p-4"><p className="text-xs text-muted-foreground">{label}</p><p className="mt-2 text-xl font-semibold">{value ?? 0}</p></div>)}</div>
    <div className="grid gap-5 lg:grid-cols-2"><section className="rounded-xl border border-border bg-card p-5"><h2 className="font-semibold">My pipeline</h2>{data.stages.length ? <div className="mt-3 space-y-2">{data.stages.map(row => <div key={row.stage || 'lead'} className="flex justify-between text-sm"><span>{STAGES.find(s => s.value === (row.stage || 'lead'))?.label || row.stage}</span><span>{row.count} · {formatCurrency(row.sum_budget)}</span></div>)}</div> : <p className="mt-3 text-sm text-muted-foreground">No open opportunities assigned to you.</p>}</section>
    <section className="rounded-xl border border-border bg-card p-5"><h2 className="font-semibold">My next actions</h2>{data.tasks.length ? <ul className="mt-3 space-y-2">{data.tasks.map(task => <li key={task.id} className="flex justify-between gap-2 text-sm"><Link className="text-primary hover:underline" to={`/opportunities/${task.opportunity_id}`}>{task.title}</Link><span className={task.due_date < isoToday() ? 'text-destructive' : 'text-muted-foreground'}>{task.due_date || 'No date'}</span></li>)}</ul> : <p className="mt-3 text-sm text-muted-foreground">No upcoming actions.</p>}</section>
    <section className="rounded-xl border border-border bg-card p-5 lg:col-span-2"><h2 className="font-semibold">My recent activity</h2>{data.recent.length ? <ul className="mt-3 space-y-2">{data.recent.map(event => <li key={event.id} className="text-sm"><Link className="text-primary hover:underline" to={`/opportunities/${event.opportunity_id}`}>{event.subject}</Link><span className="ml-2 text-muted-foreground">{new Date(event.occurred_at).toLocaleDateString('en-GB')}</span></li>)}</ul> : <p className="mt-3 text-sm text-muted-foreground">No recent activity.</p>}</section></div>
  </div>;
}