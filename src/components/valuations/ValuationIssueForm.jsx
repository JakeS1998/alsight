import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
export default function ValuationIssueForm({ type, busy, error, onClose, onIssue }) {
  const [contractReference, setContract] = useState('');
  const [authorityClause, setClause] = useState('');
  const [namedAuthorisedParty, setParty] = useState('');
  const [authorityConfirmed, setConfirmed] = useState(false);
  const label = type === 'payment_notice' ? 'Payment Notice' : 'Interim Certificate';
  const submit = e => { e.preventDefault(); onIssue(type, { action: 'issue', contractReference, authorityClause, namedAuthorisedParty, authorityConfirmed }); };
  return <Dialog open={!!type} onOpenChange={open => { if (!open && !busy) onClose(); }}><DialogContent><DialogHeader><DialogTitle>Authorise and issue {label}</DialogTitle></DialogHeader>
    <form onSubmit={submit} className="space-y-4">
      <p className="text-sm text-muted-foreground">Your signed-in identity and the server issue time will be recorded. This creates an archived PDF; it does not serve it on the contractor.</p>
      <label className="block text-sm">Executed contract reference<input required maxLength={300} value={contractReference} onChange={e => setContract(e.target.value)} className="mt-1 w-full rounded-md border border-input bg-background p-2" /></label>
      <label className="block text-sm">Authority clause / appointment reference<textarea required maxLength={500} value={authorityClause} onChange={e => setClause(e.target.value)} className="mt-1 w-full rounded-md border border-input bg-background p-2" /></label>
      <label className="block text-sm">Named party authorised under the contract<input required maxLength={200} value={namedAuthorisedParty} onChange={e => setParty(e.target.value)} className="mt-1 w-full rounded-md border border-input bg-background p-2" /></label>
      <label className="flex items-start gap-2 text-sm"><input type="checkbox" required checked={authorityConfirmed} onChange={e => setConfirmed(e.target.checked)} className="mt-1" /><span>I have checked the executed contract and any applicable appointment or delegation. It authorises the named party to issue this {label.toLowerCase()}, and I am authorised to act for that party.</span></label>
      <p className="text-xs text-muted-foreground">This is your per-issue declaration, not a legal verification by ALSight. Being the Employer or the assigned PM does not itself establish authority.</p>
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      <div className="flex justify-end gap-2"><Button type="button" variant="outline" disabled={!!busy} onClick={onClose}>Cancel</Button><Button disabled={!!busy || !authorityConfirmed || !contractReference.trim() || !authorityClause.trim() || !namedAuthorisedParty.trim()}>{busy ? 'Issuing…' : 'Authorise and issue'}</Button></div>
    </form>
  </DialogContent></Dialog>;
}