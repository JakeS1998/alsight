import React, {useEffect} from 'react';
import {Link} from 'react-router-dom';
import {useQuery,useQueryClient} from '@tanstack/react-query';
import {base44} from '@/api/base44Client';
import useApprovalAccess from '@/components/approvals/useApprovalAccess';
import useApprovalSummary from '@/components/approvals/useApprovalSummary';
import {plannerDayEnd} from '@/components/dashboard/plannerDates';
import {ListChecks,ClipboardCheck,Users,ArrowUpRight} from 'lucide-react';
export default function HomePersonalAttention({user,tasks}) {
  const access=useApprovalAccess(),approvals=useApprovalSummary(),cache=useQueryClient();
  const reminders=useQuery({queryKey:['today-personal-followup-count',user.id,plannerDayEnd()],queryFn:()=>base44.entities.CRMReminder.count({user_id:user.id,dismissed_at:{$exists:false},remind_at:{$lte:plannerDayEnd()}}),staleTime:30000});
  useEffect(()=>base44.entities.CRMReminder.subscribe(()=>cache.invalidateQueries({queryKey:['today-personal-followup-count',user.id]})),[user.id,cache]);
  const approvalReady=!access.loading && (!access.enabled || approvals.isSuccess),ready=!tasks.loading && !tasks.error && reminders.isSuccess && approvalReady;
  const rows=[['Assigned actions',tasks.error ? '—' : tasks.loading ? '…' : tasks.total,ListChecks,'Due today or overdue','#today-agenda'],...(access.enabled ? [['Approvals',approvals.isSuccess ? approvals.data.pending : approvals.error ? '—' : '…',ClipboardCheck,'Waiting for your decision','/approvals']] : []),['Follow-ups',reminders.isSuccess ? reminders.data : reminders.error ? '—' : '…',Users,'Your saved reminders','#today-followups']];
  const total=ready ? tasks.total+reminders.data+(access.enabled ? approvals.data.pending : 0) : null;
  return <section className="mt-5 border-t border-border pt-5" aria-label="Your personal attention queue"><h2 className="text-xl font-semibold">{total===null ? 'Your attention queue' : total===0 ? 'You’re up to date with your attention queue' : `${total} ${total===1 ? 'thing needs' : 'things need'} your attention`}</h2><p className="mt-1 text-xs text-muted-foreground">Your assigned actions, approvals and saved follow-ups. Project risks and dates remain in their connected records.</p>
    <div className="mt-4 grid gap-3 sm:grid-cols-3">{rows.map(([label,value,Icon,detail,to])=>{const body=<><Icon className="h-4 w-4 text-muted-foreground"/><div className="min-w-0 flex-1"><strong className="text-2xl font-semibold">{value}</strong><p className="text-sm font-medium">{label}</p><p className="mt-1 text-xs text-muted-foreground">{detail}</p></div><ArrowUpRight className="h-4 w-4 text-muted-foreground"/></>;return to.startsWith('#') ? <a key={label} href={to} className="flex gap-3 rounded-xl border border-border p-4 hover:bg-muted">{body}</a> : <Link key={label} to={to} className="flex gap-3 rounded-xl border border-border p-4 hover:bg-muted">{body}</Link>;})}</div>
    {(tasks.error || reminders.error || approvals.error) && <p role="alert" className="mt-3 text-xs text-destructive">Some attention information is unavailable; missing counts are not treated as zero.</p>}
  </section>;
}