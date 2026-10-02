import React from 'react';
import { RISK_APPROVAL_PARTIES } from '@/components/delivery/riskApprovalProgress';
export default function RiskApprovalTimeline({ packet }) {
  return <ol className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{packet.steps.map((step, index) => <li key={step.party} className="rounded-lg border bg-card p-3 text-sm">
    <p className="font-bold">{index + 1}. {RISK_APPROVAL_PARTIES.find(party => party.key === step.party)?.label}</p>
    <p className="mt-1 break-words">{step.name}</p><p className="break-words text-xs text-muted-foreground">{step.email}</p>
    <p className={`mt-2 font-medium ${step.status === 'accepted' ? 'text-success' : step.status === 'rejected' ? 'text-destructive' : 'text-foreground'}`}>{step.status === 'accepted' ? 'Accepted — email verified' : step.status === 'rejected' ? 'Declined — email verified' : packet.status === 'active' && index === packet.current_index ? 'Awaiting acceptance' : 'Not yet invited'}</p>
    {step.decided_at && <p className="mt-1 text-xs text-muted-foreground">{new Date(step.decided_at).toLocaleString('en-GB')} · {step.verification_method}</p>}
    {step.comment && <p className="mt-2 whitespace-pre-wrap break-words text-xs">{step.comment}</p>}
  </li>)}</ol>;
}