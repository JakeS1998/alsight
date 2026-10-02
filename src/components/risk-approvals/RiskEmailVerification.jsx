import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
export default function RiskEmailVerification({ action, challengeId, onSend, onVerify }) {
  const [code, setCode] = useState('');
  return <section className="space-y-3 rounded-lg border bg-card p-4">
    <h2 className="font-bold">Verify your email for this acceptance</h2>
    <p className="text-sm text-muted-foreground">A six-digit code is sent to your registered email. Verification expires after ten minutes and applies only to your current approval step.</p>
    <Button disabled={action.busy} onClick={onSend}>{action.busy ? 'Please wait…' : challengeId ? 'Send a new code' : 'Send verification code'}</Button>
    {challengeId && <form onSubmit={event => { event.preventDefault(); onVerify(code); }} className="flex flex-wrap gap-2"><Input className="max-w-48" aria-label="Six-digit verification code" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} required value={code} onChange={event => setCode(event.target.value.replace(/\D/g, ''))} placeholder="Six-digit code" /><Button type="submit" disabled={action.busy || code.length !== 6}>Verify and open register</Button></form>}
  </section>;
}