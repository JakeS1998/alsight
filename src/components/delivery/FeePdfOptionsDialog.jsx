import React from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';

export default function FeePdfOptionsDialog({ kind, onClose, onDownload }) {
  return <Dialog open={kind != null} onOpenChange={open => { if (!open) onClose(); }}>
    <DialogContent className="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>Include RIBA 5–7?</DialogTitle>
        <DialogDescription>Choose whether to include RIBA 5–7 fees and their OHP in the {kind === 'internal' ? 'internal' : 'client'} PDF; the exported totals will reflect your choice.</DialogDescription>
      </DialogHeader>
      <DialogFooter className="gap-2 sm:flex-wrap">
        <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
        <Button type="button" variant="outline" onClick={() => onDownload(false)}>Exclude RIBA 5–7</Button>
        <Button type="button" onClick={() => onDownload(true)}>Include RIBA 5–7</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>;
}