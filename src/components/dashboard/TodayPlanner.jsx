import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQueryClient } from '@tanstack/react-query';
import usePlannerReminders from '@/components/dashboard/usePlannerReminders';
import HomeAgenda from '@/components/dashboard/HomeAgenda';
import HomePlannerFollowups from '@/components/dashboard/HomePlannerFollowups';
import HomeFollowupForm from '@/components/dashboard/HomeFollowupForm';
import useTodayOutlookAgenda from '@/components/dashboard/useTodayOutlookAgenda';
import useRoleAgenda from '@/components/dashboard/useRoleAgenda';
import SubmissionSummary from '@/components/forms/SubmissionSummary';
export default function TodayPlanner({ user, tasks }) {
  const client = useQueryClient();
  const reminders = usePlannerReminders(user);
  const calendar = useTodayOutlookAgenda(user);
  const roleAgenda = useRoleAgenda(user);
  const [draft, setDraft] = useState(null), [busy, setBusy] = useState(''), [error, setError] = useState(''), [notice, setNotice] = useState('');
  const schedule = (subject, contactId = null) => { setDraft({ subject, contactId }); setNotice(''); setError(''); };
  const done = async id => {
    setBusy(id); setError(''); setNotice('');
    try { await base44.entities.CRMReminder.update(id, { dismissed_at: new Date().toISOString() }); await reminders.refresh(); setNotice('Follow-up completed.'); }
    catch (err) { setError(err.message || 'Could not complete your follow-up.'); }
    finally { setBusy(''); }
  };
  const completeTask = async row => {
    if (busy) return;
    setBusy(row.key); setError(''); setNotice('');
    try {
      await base44.functions.invoke('completeAssignedTask', { entity: row.taskEntity, id: row.id });
      await Promise.all([client.invalidateQueries({ queryKey: ['assigned-tasks'] }), client.invalidateQueries({ queryKey: ['commercial-workspace'] }), client.invalidateQueries({ queryKey: ['commercial-next-action'] }), reminders.refresh()]);
      setNotice('Task completed.');
    } catch (err) { setError(err.response?.data?.error || err.message || 'Could not complete your task.'); }
    finally { setBusy(''); }
  };
  const saved = async details => { await reminders.refresh(); setNotice(details); };
  return <section aria-label="Your day planner" className="space-y-3">
    {notice && <div role="status" className="rounded-lg border border-border bg-card p-3 text-sm"><p className="text-success">{typeof notice==='string'?notice:'Follow-up saved in ALS Hub.'}</p>{typeof notice!=='string'&&<SubmissionSummary rows={[[ 'Follow-up',notice.subject],['Remind me at',new Date(notice.remind_at).toLocaleString('en-GB')]]}/>}</div>}
    {error && <p role="alert" className="rounded-lg border border-border bg-card p-3 text-sm text-destructive">{error}</p>}
    <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)]"><HomeAgenda tasks={tasks} reminders={reminders} calendar={calendar} roleAgenda={roleAgenda} role={user.role} onFollowup={schedule} onDone={done} onTaskDone={completeTask} busy={busy} /><HomePlannerFollowups user={user} reminders={reminders} onFollowup={schedule} onDone={done} busy={busy} /></div>
    {draft !== null && <HomeFollowupForm key={`${draft.contactId || ''}:${draft.subject}`} user={user} initial={draft.subject} contactId={draft.contactId} onClose={() => setDraft(null)} onSaved={saved} />}
  </section>;
}