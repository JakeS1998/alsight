import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
export default function RiskAcceptanceDecision({ reference, busy, onDecision }) {
  const [confirmed, setConfirmed] = useState(false);
  const [comment, setComment] = useState('');
  return <section className="space-y-3 rounded-lg border bg-card p-4">
    <h2 className="font-bold">Record your decision</h2>
    <label className="flex items-start gap-2 text-sm"><input type="checkbox" checked={confirmed} onChange={event => setConfirmed(event.target.checked)} disabled={busy} className="mt-1" /><span>I have reviewed the full issued register {reference} and accept this version in my named stakeholder capacity.</span></label>
    <label className="block text-sm">Comments (required when declining)<Textarea value={comment} onChange={event => setComment(event.target.value)} maxLength={2000} disabled={busy} className="mt-1" /></label>
    <div className="flex flex-wrap gap-2"><Button disabled={busy || !confirmed} onClick={() => onDecision('accept', { confirmed, comment })}>{busy ? 'Recording…' : 'Accept issued register'}</Button><Button variant="outline" disabled={busy || !comment.trim()} onClick={() => { if (window.confirm('Decline this register and stop this approval issue?')) onDecision('reject', { comment }); }}>Decline and return to BDM</Button></div>
    <p className="text-xs text-muted-foreground">Your identity, email verification, decision and timestamp are recorded against this locked version. Acceptance invites the next party. Declining stops the sequence; the BDM must resolve the issue and reissue.</p>
  </section>;
}