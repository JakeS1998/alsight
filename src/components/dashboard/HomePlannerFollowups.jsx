import React from 'react';
import { Plus, Users } from 'lucide-react';
import DashboardPanel from '@/components/dashboard/DashboardPanel';
import { Button } from '@/components/ui/button';
import { touchbasePreview, plannerTime } from '@/components/dashboard/plannerDates';
import { formatDate } from '@/lib/portal';
export default function HomePlannerFollowups({ reminders, onFollowup, onDone, busy }) {
  return <div className="space-y-4">
    <DashboardPanel title="Consider touching base with" subtitle="Illustrative suggestions for now, not based on your contact history.">
      <ul className="space-y-3">{touchbasePreview.map(row => <li key={row.title} className="rounded-lg bg-secondary/60 p-3"><div className="flex items-start gap-2"><Users className="mt-0.5 h-4 w-4 shrink-0 text-chart-2" /><div><p className="text-sm font-semibold">{row.title}</p><p className="mt-1 text-xs text-muted-foreground">{row.reason}</p><button onClick={() => onFollowup(`Touch base: ${row.title}`)} className="mt-2 text-xs font-semibold text-chart-2 hover:underline">Plan a follow-up</button></div></div></li>)}</ul>
    </DashboardPanel>
    <DashboardPanel title="Scheduled follow-ups" subtitle="Personal ALSight reminders after today. Due and overdue reminders appear in your agenda.">
      <Button size="sm" variant="outline" onClick={() => onFollowup('')}><Plus className="mr-2 h-4 w-4" />Schedule follow-up</Button>
      {reminders.loading ? <p role="status" className="mt-3 text-xs text-muted-foreground">Loading follow-ups…</p> : reminders.error ? <p role="alert" className="mt-3 text-xs text-destructive">Unable to load your follow-ups.</p> : <><ul className="mt-3 space-y-3">{reminders.future.map(row => <li key={row.id} className="flex items-start justify-between gap-3 border-t border-border pt-3"><div><p className="text-sm font-semibold">{row.subject}</p><p className="mt-1 text-xs text-muted-foreground">{formatDate(row.remind_at)} · {plannerTime(row.remind_at)} London time</p></div><button disabled={busy === row.id} onClick={() => onDone(row.id)} className="text-xs font-semibold text-chart-2 disabled:opacity-50">{busy === row.id ? 'Saving…' : 'Done'}</button></li>)}</ul>{!reminders.future.length && <p className="mt-3 text-xs text-muted-foreground">No upcoming follow-ups scheduled.</p>}</>}
      {reminders.more && <button disabled={reminders.loadingMore} onClick={() => reminders.loadMore()} className="mt-3 text-xs font-semibold text-chart-2 disabled:opacity-50">{reminders.loadingMore ? 'Loading…' : 'Load more reminders'}</button>}
    </DashboardPanel>
  </div>;
}