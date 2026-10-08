import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import useFlowOperation from '@/components/dataverse/useFlowOperation';
import FlowTableMapping from '@/components/dataverse/FlowTableMapping';
import FlowAutomaticSyncStatus from '@/components/dataverse/FlowAutomaticSyncStatus';
export default function DataverseFlowAdmin() {
  const { run, busy, error, notice } = useFlowOperation(), [data, setData] = useState(null);
  const reload = async () => { const result = await run('status'); if (result) setData(result); };
  useEffect(() => { reload(); }, []);
  const confirm = async () => { const result = await run('confirmJake'); if (result) { const state = await run('status'); if (state) setData(state); } };
  return <div className="space-y-5">
    <section className="space-y-4 rounded-panel border border-border bg-card p-5">
      <header><h2 className="font-heading text-xl font-semibold">Shared Dataverse reads</h2><p className="mt-1 text-sm text-muted-foreground">Jake’s account reads live data. Administrators review placeholder matches and synchronise approved fields; separate write-back still uses the person making the change.</p></header>
      {data?.config ? <div className="space-y-1 text-sm"><p>{data.config.source_email || 'Shared account not confirmed'} · Configuration is restricted to administrators</p><p className="text-muted-foreground">{data.config.environment_url}</p><p className="text-muted-foreground">Last access check: {data.config.last_checked_at ? new Date(data.config.last_checked_at).toLocaleString() : 'Not checked'}</p></div> : <p className="text-sm text-muted-foreground">Confirm Jake’s connected work account to begin.</p>}
      <div className="flex flex-wrap gap-2"><Button variant="outline" disabled={Boolean(busy)} onClick={reload}>Reload workspace</Button><Button disabled={Boolean(busy)} onClick={confirm}>Confirm Jake’s connected account</Button>{data?.configured && <Button variant="outline" disabled={Boolean(busy)} onClick={async () => { const result = await run('checkShared'); if (result) { const current = await run('status'); if (current) setData(current); } }}>Check shared access</Button>}<Button variant="outline" asChild><Link to="/account-settings">Account connections</Link></Button><Button variant="outline" asChild><Link to="/dataverse">User write-back workspace</Link></Button></div>
      <p className="text-xs text-muted-foreground">Jake must remain connected for background checks. If Microsoft requires a new sign-in, reconnect his account and confirm it again here. Write-back still uses each person’s own account. Match reviews, decisions and automatic sync status are restricted to administrators.</p>
      {data?.configured && <FlowAutomaticSyncStatus state={data.pollState} />}
      {busy && <p role="status" className="text-sm text-muted-foreground">Working…</p>}{error && <><p role="alert" className="text-sm text-destructive">{error}</p><Button variant="outline" onClick={reload}>Reload status</Button></>}{notice && <p role="status" className="text-sm text-success">{notice}</p>}
    </section>
    {data?.configured && Object.entries(data.specs).map(([table, spec]) => <FlowTableMapping key={`${table}-${data.config.tables?.[table]?.logicalName || ''}`} table={table} spec={spec} settings={data.config.tables?.[table]} onUpdated={reload} />)}
  </div>;
}