import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import HandoverDocuments from '@/components/handover/HandoverDocuments';

export default function HandoverItem({ item, editable, busy, onAction }) {
  const [status, setStatus] = useState(item.review_status), [notes, setNotes] = useState(item.notes), [link, setLink] = useState(item.link);
  useEffect(() => { setStatus(item.review_status); setNotes(item.notes); setLink(item.link); }, [item.reviewed_at, item.notes, item.link, item.review_status]);
  return <details className="rounded-lg border border-border bg-card">
    <summary className="cursor-pointer p-4"><span className="font-medium">{item.label}</span><span className={`ml-3 text-xs uppercase ${item.status === 'complete' ? 'text-foreground' : 'text-destructive'}`}>{item.status}</span>{item.gap && <span className="mt-1 block text-xs text-muted-foreground">{item.gap}</span>}</summary>
    <div className="space-y-3 border-t border-border p-4">
      <p className="text-xs text-muted-foreground">Source status: {item.sourceStatus}. {item.documentRequired ? 'Complete requires document evidence or a secure reference, plus a completion review.' : item.key === 'defects' ? 'Record defects with owners/actions, or explicitly state no outstanding defects.' : 'A recorded open, agreed or closed account is a complete status dataset; it does not mean the account is settled.'}</p>
      {editable ? <>
        <label className="block text-xs">Review status<select aria-label={`${item.label} review status`} value={status} onChange={event => setStatus(event.target.value)} className="mt-1 block rounded border border-input bg-background p-2 text-sm"><option value="automatic">Use close-out data</option><option value="outstanding">Outstanding</option><option value="partial">Partial</option><option value="complete">Complete</option></select></label>
        <label className="block text-xs">Notes / outstanding actions<textarea value={notes} maxLength={3000} onChange={event => setNotes(event.target.value)} rows={3} className="mt-1 block w-full rounded border border-input bg-background p-2 text-sm" /></label>
        <label className="block text-xs">Secure document link (optional)<input type="url" placeholder="https://…" value={link} maxLength={1000} onChange={event => setLink(event.target.value)} className="mt-1 block w-full rounded border border-input bg-background p-2 text-sm" /></label>
        <Button size="sm" variant="outline" disabled={busy} onClick={() => onAction('review', { key: item.key, status, notes, link }).catch(() => {})}>Save review</Button>
      </> : <p className="whitespace-pre-wrap text-sm">{item.notes || 'No review notes recorded.'}</p>}
      {item.reviewed_at && <p className="text-xs text-muted-foreground">Reviewed by {item.reviewed_by} · {new Date(item.reviewed_at).toLocaleString('en-GB')}</p>}
      <HandoverDocuments item={item} editable={editable} busy={busy} onAction={onAction} />
    </div>
  </details>;
}