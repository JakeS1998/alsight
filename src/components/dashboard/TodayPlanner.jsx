import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import usePlannerReminders from '@/components/dashboard/usePlannerReminders';
import HomeAgenda from '@/components/dashboard/HomeAgenda';
import HomePlannerFollowups from '@/components/dashboard/HomePlannerFollowups';
import HomeFollowupForm from '@/components/dashboard/HomeFollowupForm';
import useTodayOutlookAgenda from '@/components/dashboard/useTodayOutlookAgenda';
export default function TodayPlanner({ user, tasks }) {
  const reminders = usePlannerReminders(user);
  const calendar = useTodayOutlookAgenda(user);
  const [draft, setDraft] = useState(null), [busy, setBusy] = useState(''), [error, setError] = useState(''), [notice, setNotice] = useState('');
  const schedule = (subject, contactId = null) => { setDraft({ subject, contactId }); setNotice(''); setError(''); };
  const done = async id => {
    setBusy(id); setError(''); setNotice('');
    try { await base44.entities.CRMReminder.update(id, { dismissed_at: new Date().toISOString() }); await reminders.refresh(); setNotice('Follow-up completed.'); }
    catch (err) { setError(err.message || 'Could not complete your follow-up.'); }
    finally { setBusy(''); }
  };
  const saved = async () => { await reminders.refresh(); setNotice('Follow-up saved in ALSight.'); };
  return <section aria-label="Your day planner" className="space-y-3">
    {notice && <p role="status" className="rounded-lg border border-border bg-card p-3 text-sm text-success">{notice}</p>}
    {error && <p role="alert" className="rounded-lg border border-border bg-card p-3 text-sm text-destructive">{error}</p>}
    <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)]"><HomeAgenda tasks={tasks} reminders={reminders} calendar={calendar} onFollowup={schedule} onDone={done} busy={busy} /><HomePlannerFollowups user={user} reminders={reminders} onFollowup={schedule} onDone={done} busy={busy} /></div>
    {draft !== null && <HomeFollowupForm key={`${draft.contactId || ''}:${draft.subject}`} user={user} initial={draft.subject} contactId={draft.contactId} onClose={() => setDraft(null)} onSaved={saved} />}
  </section>;
}