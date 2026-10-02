import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { Button } from '@/components/ui/button';
import RiskApprovalTimeline from '@/components/risk-approvals/RiskApprovalTimeline';
import RiskAddRecipientForm from '@/components/risk-approvals/RiskAddRecipientForm';
import useRiskApprovalAction from '@/components/risk-approvals/useRiskApprovalAction';
import RiskFeedbackList from '@/components/risk-approvals/RiskFeedbackList';
export default function RiskApprovalPacketCard({ project, packet, editable, onChanged }) {
  const { user } = useAuth();
  const action = useRiskApprovalAction(onChanged);
  const active = packet.status === 'active';
  const assigned = !!packet.steps[packet.current_index]?.user_id;
  return <div className="space-y-3 rounded-lg border bg-card p-3">
    <p className="text-sm font-bold">{packet.reference} · {packet.status}</p>
    <p className="text-xs text-muted-foreground">Issued by {packet.issued_by_name} on {new Date(packet.issued_at).toLocaleString('en-GB')}</p>
    <RiskApprovalTimeline packet={packet} />
    {editable && <RiskFeedbackList packetId={packet.id} />}
    {packet.stale && <p role="alert" className="text-sm text-destructive">The live register has changed. This decision applies to the issued version; reissue for current approval.</p>}
    {active && <p className="text-xs text-muted-foreground">{assigned ? `Invitation: ${packet.notification_status}${packet.notification_status === 'failed' ? ' — retry below.' : ''}` : 'Waiting for the next recipient on this earlier sequential issue.'}</p>}
    <div className="flex flex-wrap gap-2">
      {packet.steps.some(step => step.user_id === user?.id) && <Button asChild size="sm" variant="outline"><Link to={`/risk-approvals/${packet.id}`}>Open acceptance page</Link></Button>}
      {editable && active && <Button size="sm" variant="outline" disabled={action.busy} onClick={() => { if (window.confirm('Withdraw this invitation? Its decisions remain in history; other independent invitations are unaffected.')) action.run({ action: 'withdraw', packet_id: packet.id }); }}>Withdraw invitation</Button>}
      {editable && active && packet.notification_status === 'failed' && <Button size="sm" disabled={action.busy} onClick={() => action.run({ action: 'retry', packet_id: packet.id })}>Retry invitation</Button>}
    </div>
    {action.error && <p role="alert" className="text-sm text-destructive">{action.error}</p>}
    {editable && active && !packet.stale && packet.steps.length > 1 && <RiskAddRecipientForm project={project} packet={packet} onAdded={onChanged} />}
  </div>;
}