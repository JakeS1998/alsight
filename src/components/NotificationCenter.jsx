import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bell } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import useAssignedTasks from '@/components/tasks/useAssignedTasks';
import AssignedTaskRows from '@/components/tasks/AssignedTaskRows';
import useReminderNotifications from '@/components/tasks/useReminderNotifications';
import useAllianceNotifications from '@/components/alliance/useAllianceNotifications';
import AllianceNotificationRows from '@/components/alliance/AllianceNotificationRows';
import useApprovalSummary from '@/components/approvals/useApprovalSummary';
import ApprovalActionNotice from '@/components/approvals/ApprovalActionNotice.jsx';

export default function NotificationCenter({ user }) {
  const [open, setOpen] = useState(false), [dismissError, setDismissError] = useState('');
  const root = useRef(null);
  const tasks = useAssignedTasks(user, true, open);
  const { rows, due, loading, error: reminderError, refresh } = useReminderNotifications(user, open);
  const error = dismissError || reminderError;
  const insider = useAllianceNotifications(user, open);
  const approvals = useApprovalSummary();
  const notificationCount = due + tasks.total + insider.total + (approvals.data?.pending || 0);
  useEffect(() => { if (!open) return; const close = e => { if (!root.current?.contains(e.target)) setOpen(false); }; document.addEventListener('pointerdown', close); return () => document.removeEventListener('pointerdown', close); }, [open]);
  const dismiss = async row => {
    try { await base44.entities.CRMReminder.update(row.id, { dismissed_at: new Date().toISOString() }); setDismissError(''); await refresh(); }
    catch (e) { setDismissError(e.message || 'Unable to dismiss reminder.'); }
  };
  return <div ref={root} className="relative shrink-0">
    <button type="button" aria-label={`Notifications${notificationCount ? `, ${notificationCount} due` : ''}`} aria-expanded={open} onClick={() => setOpen(v => !v)} className="portal-icon-button relative"><Bell className="h-5 w-5" />{notificationCount > 0 && <span className="absolute -right-1 -top-1 min-w-4 rounded-full bg-primary px-1 text-center text-[10px] font-bold text-primary-foreground">{notificationCount > 99 ? '99+' : notificationCount}</span>}</button>
    {open && <div className="absolute right-0 top-full z-50 mt-3 w-80 max-w-[calc(100vw-2rem)] rounded-xl border border-border bg-card p-4 text-card-foreground shadow-xl"><h2 className="font-semibold">Notification Centre</h2><ApprovalActionNotice onNavigate={() => setOpen(false)} /><AllianceNotificationRows notifications={insider} onNavigate={() => setOpen(false)} /><div className="max-h-64 overflow-y-auto"><h3 className="mt-3 text-sm font-medium">Tasks due within 48 hours or overdue</h3><AssignedTaskRows tasks={tasks} onNavigate={() => setOpen(false)} />{!tasks.loading && !tasks.error && !tasks.total && <p className="text-xs text-muted-foreground">No tasks due soon.</p>}</div>{error && <p role="alert" className="mt-2 text-xs text-destructive">{error}</p>}{loading ? <p className="mt-3 text-sm text-muted-foreground">Loading reminders…</p> : !rows.length ? <p className="mt-3 text-sm text-muted-foreground">No reminders set.</p> : <ul className="mt-3 max-h-80 divide-y divide-border overflow-y-auto">{rows.map(row => <li key={row.id} className="py-3 text-sm"><Link onClick={() => setOpen(false)} to={row.contact_id ? `/crm/contacts/${row.contact_id}` : `/opportunities/${row.opportunity_id}`} className="block break-words font-medium text-primary hover:underline">{row.subject}</Link><p className="text-xs text-muted-foreground">{new Date(row.remind_at).toLocaleString('en-GB')} · {row.remind_at <= new Date().toISOString() ? 'Due' : 'Upcoming'}</p><button type="button" onClick={() => dismiss(row)} className="mt-1 text-xs text-muted-foreground underline hover:text-foreground">Dismiss</button></li>)}</ul>}</div>}
  </div>;
}