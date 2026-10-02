import React, { useState } from 'react';
import { ArrowUp, ArrowDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { RISK_APPROVAL_PARTIES } from '@/components/delivery/riskApprovalProgress';
import RiskRecipientPicker from '@/components/risk-approvals/RiskRecipientPicker';
import useRiskApprovalAction from '@/components/risk-approvals/useRiskApprovalAction';
export default function RiskApprovalIssueForm({ project, count, onIssued }) {
  const [steps, setSteps] = useState(RISK_APPROVAL_PARTIES.map(party => ({ ...party, recipient: null })));
  const action = useRiskApprovalAction(onIssued);
  const move = (index, offset) => setSteps(previous => { const next = [...previous]; [next[index], next[index + offset]] = [next[index + offset], next[index]]; return next; });
  const selected = steps.filter(step => step.recipient);
  const ready = count > 0 && !!steps[0].recipient && new Set(selected.map(step => step.recipient.id)).size === selected.length;
  return <form className="space-y-3" onSubmit={event => { event.preventDefault(); action.run({ action: 'issue', project_id: project.id, steps: steps.map(step => ({ party: step.key, user_id: step.recipient?.id || '' })) }); }}>
    <p className="text-xs text-muted-foreground">Select the first recipient to issue now — for example, the PM alone. Other recipients are optional and can be added to this same locked version later. Move parties into the required order; only the current party is invited.</p>
    <ol className="space-y-3">{steps.map((step, index) => <li key={step.key} className="grid gap-2 rounded-lg border bg-card p-3 sm:grid-cols-[9rem_minmax(0,1fr)_auto]">
      <p className="text-sm font-bold">{index + 1}. {step.label}<span className="block text-xs font-normal text-muted-foreground">{index === 0 ? 'Required to issue now' : 'Optional — add later'}</span></p>
      <RiskRecipientPicker projectId={project.id} value={step.recipient} disabled={action.busy} onChange={recipient => setSteps(previous => previous.map(row => row.key === step.key ? { ...row, recipient } : row))} />
      <div className="flex gap-1"><Button type="button" variant="ghost" size="icon" aria-label={`Move ${step.label} earlier`} disabled={action.busy || index === 0} onClick={() => move(index, -1)}><ArrowUp /></Button><Button type="button" variant="ghost" size="icon" aria-label={`Move ${step.label} later`} disabled={action.busy || index === 3} onClick={() => move(index, 1)}><ArrowDown /></Button></div>
    </li>)}</ol>
    {!count && <p className="text-xs text-muted-foreground">Add risks before issuing.</p>}
    {action.error && <p role="alert" className="text-sm text-destructive">{action.error}</p>}
    <Button type="submit" disabled={!ready || action.busy}>{action.busy ? 'Preparing issue…' : 'Issue register for acceptance'}</Button>
  </form>;
}