import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import RiskDraftEditor from '@/components/delivery/RiskDraftEditor';
export default function RiskImportReview({ importer }) {
  return <Dialog open={importer.review} onOpenChange={open => { if (!importer.busy) importer.setReview(open); }}>
    <DialogContent className="flex max-h-[90dvh] flex-col sm:max-w-4xl">
      <DialogHeader><DialogTitle>Review ALICE’s risk register draft</DialogTitle></DialogHeader>
      <p className="text-sm text-muted-foreground">{importer.note} Review every included entry; missing fields must be completed before saving. This adds new risks and does not replace existing entries.</p>
      {importer.error && <p role="alert" className="text-sm text-destructive">{importer.error}</p>}
      <div className="min-h-0 space-y-3 overflow-y-auto">{importer.rows.map((row, index) => <RiskDraftEditor key={index} row={row} index={index} onChange={importer.change} disabled={!!importer.busy} />)}</div>
      <DialogFooter><Button type="button" variant="outline" disabled={!!importer.busy} onClick={() => importer.setReview(false)}>Cancel</Button><Button type="button" disabled={!!importer.busy || !importer.rows.some(r => r.selected)} onClick={importer.save}>{importer.busy === 'saving' ? 'Saving…' : `Add ${importer.rows.filter(r => r.selected).length} reviewed risks`}</Button></DialogFooter>
    </DialogContent>
  </Dialog>;
}