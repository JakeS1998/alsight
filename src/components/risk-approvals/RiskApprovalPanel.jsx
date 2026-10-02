import React from 'react';
import { useQueryClient } from '@tanstack/react-query';
import useRiskRegisterApproval from '@/components/delivery/useRiskRegisterApproval';
import RiskApprovalIssueForm from '@/components/risk-approvals/RiskApprovalIssueForm';
import RiskApprovalPacketCard from '@/components/risk-approvals/RiskApprovalPacketCard';
import RiskApprovalHistory from '@/components/risk-approvals/RiskApprovalHistory';
export default function RiskApprovalPanel({ project }) {
  const client = useQueryClient();
  const review = useRiskRegisterApproval(project.id);
  const refresh = async () => { await Promise.all([review.refresh(), client.invalidateQueries({ queryKey: ['risk-approval-history', project.id] })]); };
  if (review.isPending) return <p role="status">Loading risk register approvals…</p>;
  if (review.error) return <p role="alert" className="text-sm text-destructive">Unable to load risk approvals. <button className="underline" onClick={review.refresh}>Retry</button></p>;
  const { packets = [], can_issue: editable, legacy } = review.data;
  return <section className="space-y-4 rounded-xl border bg-muted/40 p-4">
    <div className="flex flex-wrap justify-between gap-3"><div><h4 className="text-sm font-bold">Risk register acceptance</h4><p className="mt-1 text-xs text-muted-foreground">Independent invitations · One registered recipient at a time · Email verification before each decision.</p></div><span className="text-xs font-bold">{review.progress.percent}% complete</span></div>
    {packets.map(packet => <RiskApprovalPacketCard key={packet.id} project={project} packet={packet} editable={editable} onChanged={refresh} />)}
    {!packets.length && <p className="text-sm text-muted-foreground">No verified invitations yet. {review.progress.detail}.</p>}
    {editable && <RiskApprovalIssueForm project={project} count={review.data.count} onIssued={refresh} packets={packets} />}
    {editable && <RiskApprovalHistory projectId={project.id} />}
    {!!legacy?.length && <details className="text-xs text-muted-foreground"><summary className="cursor-pointer">Historical staff-recorded confirmations (not verified acceptance)</summary><ul className="mt-2 space-y-1">{legacy.map(row => <li key={row.id}>{row.stakeholder.toUpperCase()} · {row.approved ? row.approver_name || 'Name not recorded' : 'Not confirmed'} · {row.recorded_at ? new Date(row.recorded_at).toLocaleString('en-GB') : 'Date not recorded'}</li>)}</ul></details>}
    <p className="text-xs text-muted-foreground">{review.progress.detail}. This records explicit acceptance; it is not a qualified electronic signature.</p>
  </section>;
}