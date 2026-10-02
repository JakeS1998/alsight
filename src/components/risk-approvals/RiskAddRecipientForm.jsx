import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { RISK_APPROVAL_PARTIES } from '@/components/delivery/riskApprovalProgress';
import RiskRecipientPicker from '@/components/risk-approvals/RiskRecipientPicker';
import useRiskApprovalAction from '@/components/risk-approvals/useRiskApprovalAction';
export default function RiskAddRecipientForm({ project, packet, onAdded }) {
  const [party, setParty] = useState('');
  const [recipient, setRecipient] = useState(null);
  const missing = packet.steps.filter(step => !step.user_id && step.status === 'waiting');
  const selected = missing.find(step => step.party === party) || missing[0];
  const action = useRiskApprovalAction(async () => { setRecipient(null); await onAdded(); });
  if (!selected) return null;
  const duplicate = recipient && packet.steps.some(step => step.user_id === recipient.id);
  return <form className="space-y-3 rounded-lg border bg-card p-4" onSubmit={event => { event.preventDefault(); action.run({ action: 'add_recipient', packet_id: packet.id, party: selected.party, user_id: recipient.id }); }}>
    <h5 className="text-sm font-bold">Add another recipient to this issue</h5>
    <p className="text-xs text-muted-foreground">Keep the same locked register and existing acceptances. The new recipient is invited when their turn is reached; if it is already their turn, the invitation is prepared now.</p>
    <label className="block text-sm">Party<select className="mt-1 block w-full rounded-md border bg-background p-2" value={selected.party} disabled={action.busy} onChange={event => { setParty(event.target.value); setRecipient(null); }}>{missing.map(step => <option key={step.party} value={step.party}>{RISK_APPROVAL_PARTIES.find(row => row.key === step.party)?.label}</option>)}</select></label>
    <RiskRecipientPicker key={selected.party} projectId={project.id} value={recipient} onChange={setRecipient} disabled={action.busy} />
    {duplicate && <p className="text-xs text-destructive">This recipient is already assigned to another party.</p>}
    {action.error && <p role="alert" className="text-sm text-destructive">{action.error}</p>}
    <Button type="submit" disabled={action.busy || !recipient || duplicate}>{action.busy ? 'Adding recipient…' : 'Add recipient'}</Button>
  </form>;
}