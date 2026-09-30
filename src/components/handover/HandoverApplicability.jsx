import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';

export default function HandoverApplicability({ itemKey, decision, authorised, busy, onAction, title = 'Requirement applicability' }) {
  const [value, setValue] = useState(decision?.value || 'not_assessed');
  const [reason, setReason] = useState(decision?.reason || '');
  useEffect(() => { setValue(decision?.value || 'not_assessed'); setReason(decision?.reason || ''); }, [decision?.value, decision?.reason, decision?.decided_at]);
  return <div className="space-y-2 rounded-lg border border-border bg-muted/30 p-3">
    <p className="text-sm font-medium">{title}</p>
    <p className="text-xs text-muted-foreground">An administrator or director must assess the work scope, applicable regime and transitional provisions. Not applicable is an evidenced scope decision, never permission to waive a legal duty.</p>
    {authorised ? <>
      <select aria-label={`${title} status`} value={value} disabled={busy} onChange={e => setValue(e.target.value)} className="rounded border border-input bg-background p-2 text-sm"><option value="not_assessed">Not assessed</option><option value="applies">Applies</option><option value="does_not_apply">Does not apply</option></select>
      <textarea aria-label={`${title} reason`} value={reason} disabled={busy} onChange={e => setReason(e.target.value)} maxLength={2000} rows={2} placeholder="Record the work scope and legal / contractual basis (at least 10 characters)" className="block w-full rounded border border-input bg-background p-2 text-sm" />
      <Button size="sm" variant="outline" disabled={busy || reason.trim().length < 10} onClick={() => onAction('applicability', { key: itemKey, value, reason }).catch(() => {})}>Save authorised assessment</Button>
    </> : <p className="text-sm">{(decision?.value || 'not_assessed').replaceAll('_', ' ')}{decision?.reason && ` · ${decision.reason}`}</p>}
    {decision?.decided_at && <p className="text-xs text-muted-foreground">Assessed by {decision.decided_by} · {new Date(decision.decided_at).toLocaleString('en-GB')}. {decision.reason}</p>}
  </div>;
}