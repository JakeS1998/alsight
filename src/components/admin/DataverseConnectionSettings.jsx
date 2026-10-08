import React, { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import useDataverseConnection from '@/components/admin/useDataverseConnection';

export default function DataverseConnectionSettings() {
  const { connection, loading, loadError, reload, busy, error, notice, run } = useDataverseConnection();
  const [environment, setEnvironment] = useState('');
  useEffect(() => { setEnvironment(connection?.environment_url || ''); }, [connection?.environment_url]);
  if (loading) return <div className="flex items-center gap-2 py-6 text-muted-foreground" role="status"><Loader2 className="h-4 w-4 animate-spin" />Loading Dataverse settings…</div>;
  if (loadError) return <div role="alert" className="space-y-3"><p className="text-destructive">{loadError}</p><Button variant="outline" onClick={() => reload()}>Try again</Button></div>;
  const dirty = environment.trim() !== (connection?.environment_url || '');
  const status = connection?.status === 'connected' ? 'Application identity confirmed' : connection?.status === 'failed' ? 'Connection check failed' : 'Not checked';
  return <section className="max-w-3xl space-y-5 rounded-panel border border-border bg-card p-5">
    <header><h2 className="text-xl font-semibold font-heading">Dataverse connection</h2><p className="mt-1 text-sm text-muted-foreground">Shared application access using the credentials stored securely for ALSight. Credentials are never displayed here.</p></header>
    <form className="space-y-3" onSubmit={event => { event.preventDefault(); run('save', environment); }}>
      <label htmlFor="dataverse-environment" className="block text-sm font-medium">Dataverse environment address</label>
      <Input id="dataverse-environment" type="url" required maxLength={250} value={environment} disabled={Boolean(busy)} onChange={event => setEnvironment(event.target.value)} placeholder="https://yourorganisation.crm11.dynamics.com" aria-describedby="dataverse-environment-help" />
      <p id="dataverse-environment-help" className="text-xs text-muted-foreground">Ask IT for the environment URL, not a table link or Power Apps page address.</p>
      <div className="flex flex-wrap gap-2">
        <Button type="submit" disabled={Boolean(busy) || !environment.trim() || (!dirty && Boolean(connection))}>{busy === 'save' && <Loader2 className="animate-spin" />}Save environment</Button>
        <Button type="button" variant="outline" disabled={Boolean(busy) || !connection || dirty} onClick={() => run('check')}>{busy === 'check' && <Loader2 className="animate-spin" />}Check connection</Button>
      </div>
      {dirty && connection && <p className="text-xs text-muted-foreground">Save your changed address before checking the connection.</p>}
    </form>
    <div className="space-y-1 rounded-lg border border-border bg-muted p-4 text-sm">
      <p className="font-medium">{status}</p>
      {connection?.last_checked_at && <p className="text-muted-foreground">Last checked: {new Date(connection.last_checked_at).toLocaleString()}</p>}
      {connection?.organisation_id && <p className="break-all text-xs text-muted-foreground">Organisation: {connection.organisation_id}</p>}
      {connection?.last_error && !error && <p className="text-destructive" role="alert">{connection.last_error}</p>}
    </div>
    {error && <p className="text-sm text-destructive" role="alert">{error}</p>}
    {notice && <p className="text-sm text-muted-foreground" role="status">{notice}</p>}
    <div className="space-y-2 border-t border-border pt-4 text-sm text-muted-foreground">
      <p>IT must create a Dataverse application user linked to your client ID and assign the required security role. Shared application access does not require an OAuth redirect URI.</p>
      <p>This checks authentication and environment access only. Approval routing, row-change events, email notifications, and write-back are not yet enabled; IT must first confirm the tables, approval fields, and event-delivery method.</p>
    </div>
  </section>;
}