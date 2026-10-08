import React from 'react';
export default function FlowAutomaticSyncStatus({ state }) {
  return <div className="space-y-1 rounded-md border border-border bg-muted p-3 text-sm">
    <p className="font-medium">Automatic Dataverse checks every 15 minutes</p>
    <p className="text-muted-foreground">The first pass checks all mapped records; later checks fetch changes only, in batches of up to 50 with pauses between batches. Unlinked records still require administrator review.</p>
    <p className="text-muted-foreground">{state?.status === 'running' ? 'A sync pass is running. ' : ''}Last completed pass: {state?.last_completed_at ? new Date(state.last_completed_at).toLocaleString() : 'Not yet completed'}</p>
    {state?.error && <p role="alert" className="text-destructive">{state.error}</p>}
  </div>;
}