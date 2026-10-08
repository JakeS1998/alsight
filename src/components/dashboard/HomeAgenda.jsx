import React from 'react';
import DashboardPanel from '@/components/dashboard/DashboardPanel';
import HomeAgendaRow from '@/components/dashboard/HomeAgendaRow';
import { plannerDay, plannerTime } from '@/components/dashboard/plannerDates';
import { Link } from 'react-router-dom';
import { formatDate } from '@/lib/portal';
export default function HomeAgenda({ tasks, reminders, calendar, onFollowup, onDone, busy }) {
  const today = plannerDay();
  const taskRows = tasks.rows.map(task => {
    const day = task.due?.slice(0, 10), overdue = day < today;
    return { ...task, kind: 'task', time: overdue ? 'Overdue' : task.due?.length === 10 ? 'All day' : plannerTime(task.due), sort: overdue ? '00:00' : task.due?.length === 10 ? '00:01' : plannerTime(task.due), detail: `${task.source} · Due ${formatDate(task.due)}` };
  });
  const reminderRows = [...reminders.due, ...reminders.future].map(row => ({ key: row.id, id: row.id, title: row.subject, kind: 'reminder', busy: busy === row.id, time: plannerDay(row.remind_at) < today ? 'Overdue' : plannerTime(row.remind_at), sort: `${plannerDay(row.remind_at)}T${plannerTime(row.remind_at)}`, detail: `${plannerDay(row.remind_at) > today ? 'Scheduled follow-up' : 'Personal follow-up'} · ${formatDate(row.remind_at)}`, to: row.contact_id ? `/people/${row.contact_id}` : row.opportunity_id ? `/opportunities/${row.opportunity_id}` : null }));
  const rows = [...taskRows.map(row => ({ ...row, sort: `${row.time === 'Overdue' ? '0000-00-00' : today}T${row.sort}` })), ...reminderRows, ...calendar.rows].sort((a, b) => a.sort.localeCompare(b.sort));
  return <DashboardPanel className="flex max-h-[520px] flex-col [&>header]:shrink-0" title="Today’s agenda" subtitle={`${new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/London', weekday: 'long', day: 'numeric', month: 'long' }).format(new Date())} · London time`}>
    <div className="min-h-0 overflow-y-auto overscroll-contain pr-2" tabIndex={0} role="region" aria-label="Agenda tasks and scheduled follow-ups">
    {calendar.loading && <p role="status" className="mb-3 text-xs text-muted-foreground">Loading today’s Outlook events…</p>}
    {calendar.error && <p role="alert" className="mb-3 text-xs text-destructive">{calendar.error.message} {calendar.error.code === 'OUTLOOK_NOT_CONNECTED' ? <Link to="/account-settings" className="underline">Reconnect Outlook</Link> : <button onClick={() => calendar.refresh()} className="underline">Try again</button>}</p>}
    {!calendar.loading && !calendar.error && !calendar.rows.length && <p className="mb-3 text-xs text-muted-foreground">No Outlook events scheduled today.</p>}
    {(tasks.loading || reminders.loading) && <p role="status" className="mb-3 text-xs text-muted-foreground">Loading your ALSight agenda…</p>}
    {(tasks.error || reminders.error) && <p role="alert" className="mb-3 text-xs text-destructive">Some ALSight tasks or follow-ups could not be loaded.</p>}
    {!tasks.loading && !tasks.error && !tasks.total && !reminders.loading && !reminders.error && !reminders.due.length && <p className="mb-3 text-xs text-muted-foreground">No outstanding ALSight tasks or follow-ups due today.</p>}
    <ul className="space-y-2">{rows.map(row => <HomeAgendaRow key={row.key} row={row} onFollowup={onFollowup} onDone={onDone} />)}</ul>
    {calendar.more && <button disabled={calendar.loadingMore} onClick={() => calendar.loadMore()} className="mt-3 block text-xs font-semibold text-chart-2 disabled:opacity-50">{calendar.loadingMore ? 'Loading…' : 'Load more Outlook events'}</button>}
    {tasks.more && <button disabled={tasks.loadingMore} onClick={() => tasks.loadMore()} className="mt-3 text-xs font-semibold text-chart-2 disabled:opacity-50">{tasks.loadingMore ? 'Loading…' : 'Load more assigned tasks'}</button>}
    {reminders.more && <button disabled={reminders.loadingMore} onClick={() => reminders.loadMore()} className="mt-3 block text-xs font-semibold text-chart-2 disabled:opacity-50">{reminders.loadingMore ? 'Loading…' : 'Load more follow-ups'}</button>}
    </div>
  </DashboardPanel>;
}