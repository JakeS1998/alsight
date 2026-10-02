import React from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
export default function RiskPdfOptionsDialog({ open, onOpenChange, busy, error, onDownload }) {
  return <Dialog open={open} onOpenChange={value => { if (!busy) onOpenChange(value); }}>
    <DialogContent>
      <DialogHeader><DialogTitle>Download risk register PDF</DialogTitle><DialogDescription>Choose whether to include the recorded approvals.</DialogDescription></DialogHeader>
      <div className="space-y-3">
        <div className="rounded-lg border p-4"><h3 className="font-bold">Certified</h3><p className="mb-3 mt-1 text-sm text-muted-foreground">Includes approval records, recipients, decisions, verification details and issued-version references. Outstanding or outdated approvals are clearly identified; this option does not create an approval.</p><Button disabled={busy} onClick={() => onDownload(true)}>{busy ? 'Preparing…' : 'Download certified PDF'}</Button></div>
        <div className="rounded-lg border p-4"><h3 className="font-bold">Non-certified</h3><p className="mb-3 mt-1 text-sm text-muted-foreground">Downloads the risk register without approval records.</p><Button variant="outline" disabled={busy} onClick={() => onDownload(false)}>{busy ? 'Preparing…' : 'Download non-certified PDF'}</Button></div>
      </div>
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      <DialogFooter><Button variant="ghost" disabled={busy} onClick={() => onOpenChange(false)}>Cancel</Button></DialogFooter>
    </DialogContent>
  </Dialog>;
}