import React, { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import useRiskApprovalAction from '@/components/risk-approvals/useRiskApprovalAction';
export default function RiskRowCommentDialog({ row, packetId, challengeId, session, onClose }) {
  const [comment, setComment] = useState('');
  const client = useQueryClient();
  const action = useRiskApprovalAction(async () => { await client.invalidateQueries({ queryKey: ['risk-row-comments', packetId] }); onClose(); });
  const save = event => { event.preventDefault(); action.run({ action: 'comment', packet_id: packetId, risk_id: row.id, challenge_id: challengeId, verification_session: session, comment }); };
  return <Dialog open onOpenChange={open => { if (!open && !action.busy) onClose(); }}><DialogContent>
    <DialogHeader><DialogTitle>Comment on risk {row.reference || ''}</DialogTitle></DialogHeader>
    <p className="text-sm font-medium">{row.title}</p>
    <p className="text-xs text-muted-foreground">Sent to the BDM for this issued version. This does not change the locked register or record an acceptance or decline.</p>
    <form onSubmit={save} className="space-y-4">
      <label className="block space-y-2 text-sm"><span>Comment</span><Textarea required maxLength={2000} rows={5} value={comment} onChange={event => setComment(event.target.value)} disabled={action.busy} /></label>
      {action.error && <p role="alert" className="text-sm text-destructive">{action.error}</p>}
      <DialogFooter><Button type="button" variant="outline" disabled={action.busy} onClick={onClose}>Cancel</Button><Button type="submit" disabled={action.busy || !comment.trim()}>{action.busy ? 'Sending…' : 'Send to BDM'}</Button></DialogFooter>
    </form>
  </DialogContent></Dialog>;
}