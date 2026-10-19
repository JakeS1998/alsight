import React from 'react';
import { Button } from '@/components/ui/button';
import { undoDeletion } from '@/components/deletion/deletionStore';
export default function DeletionUndoBar({ operation }) {
  return <div role="status" className="flex items-center justify-between gap-4 rounded-panel border border-border bg-card px-4 py-3 text-sm shadow-lg">
    <span className="min-w-0 break-words">{operation.label} {operation.committing ? 'Deleting…' : 'Deleted'}</span>
    {operation.committing ? <span className="shrink-0 text-xs text-muted-foreground">Finishing…</span> : <Button type="button" variant="outline" size="sm" onClick={() => undoDeletion(operation.key)} aria-label={`Undo deleting ${operation.label}`}>Undo</Button>}
  </div>;
}