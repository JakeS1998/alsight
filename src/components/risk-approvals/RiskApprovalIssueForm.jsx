import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { RISK_APPROVAL_PARTIES } from '@/components/delivery/riskApprovalProgress';
import RiskRecipientPicker from '@/components/risk-approvals/RiskRecipientPicker';
import useRiskApprovalAction from '@/components/risk-approvals/useRiskApprovalAction';
export default function RiskApprovalIssueForm({ project, count, onIssued, packets = [] }) {
  const [party, setParty] = useState('pm');
  const [recipient, setRecipient] = useState(null);
  const action = useRiskApprovalAction(async () => { setRecipient(null); await onIssued(); });
  const active = packets.some(packet => packet.status === 'active' && packet.steps.some(step => step.party === party && step.status === 'waiting'));
  return <form className="space-y-3" onSubmit={event => { event.preventDefault(); action.run({ action: 'issue', project_id: project.id, steps: [{ party, user_id: recipient.id }] }); }}>
    <h5 className="text-sm font-bold">Issue to one person</h5>
    <p className="text-xs text-muted-foreground">Choose any party and one registered recipient. Each invitation has its own locked register and decision; issue to other people whenever you are ready, in any order.</p>
    <label className="block text-sm">Party<select className="mt-1 block w-full rounded-md border bg-background p-2" value={party} disabled={action.busy} onChange={event => { setParty(event.target.value); setRecipient(null); }}>{RISK_APPROVAL_PARTIES.map(row => <option key={row.key} value={row.key}>{row.label}</option>)}</select></label>
    <RiskRecipientPicker key={party} projectId={project.id} value={recipient} disabled={action.busy} onChange={setRecipient} />
    {active && <p className="text-xs text-muted-foreground">This party already has an active invitation. Withdraw it before reissuing to that party.</p>}
    {!count && <p className="text-xs text-muted-foreground">Add risks before issuing.</p>}
    {action.error && <p role="alert" className="text-sm text-destructive">{action.error}</p>}
    <Button type="submit" disabled={!count || !recipient || active || action.busy}>{action.busy ? 'Preparing invitation…' : 'Issue to this person'}</Button>
  </form>;
}