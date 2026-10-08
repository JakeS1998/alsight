import React, { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import useDataverseConnection from '@/components/admin/useDataverseConnection';

export default function DataverseConnectionSettings() {
  const { connection, loading, loadError, reload, busy, error, notice, run } = useDataverseConnection();
  const [environment, setEnvironment] = useState('');
  useEffect(() => { setEnvironment(connection?.environment_url || ''); }, [connection?.environment_url]);
  if (loading) return <div className="flex items-center gap-2 py-6 text-muted-foreground" role="status"><Loader2 className="h-4 w-4 animate-spin" />Loading Dataverse settings…</div>;
  if (loadError) return <div role="alert" className="space-y-3"><p className="text-destructive">{loadError}</p><Button variant="outline" onClick={() => reload()}>Try again</Button></div>;
  const dirty = environment.trim() !== (connection?.environment_url || '');
  const status = 'Individual user authentication';
  return <section className="max-w-3xl space-y-5 rounded-panel border border-border bg-card p-5">
    <header><h2 className="text-xl font-semibold font-heading">Dataverse connection</h2><p className="mt-1 text-sm text-muted-foreground">Each internal user connects their own Microsoft account in Account Settings. Dataverse applies that user's permissions; shared application authentication is no longer used.</p></header>
    <form className="space-y-3" onSubmit={event => { event.preventDefault(); run('save', environment); }}>
      <label htmlFor="dataverse-environment" className="block text-sm font-medium">Dataverse environment address</label>
      <Input id="dataverse-environment" type="url" required maxLength={250} value={environment} disabled={Boolean(busy)} onChange={event => setEnvironment(event.target.value)} placeholder="https://yourorganisation.crm11.dynamics.com" aria-describedby="dataverse-environment-help" />
      <p id="dataverse-environment-help" className="text-xs text-muted-foreground">Ask IT for the environment URL, not a table link or Power Apps page address.</p>
      <div className="flex flex-wrap gap-2">
        <Button type="submit" disabled={Boolean(busy) || !environment.trim() || (!dirty && Boolean(connection))}>{busy === 'save' && <Loader2 className="animate-spin" />}Save environment</Button>
        <Button type="button" variant="outline" asChild><Link to="/account-settings">Connect your account</Link></Button>
      </div>
      {dirty && connection && <p className="text-xs text-muted-foreground">Save your changed address before connecting your account.</p>}
    </form>
    <div className="space-y-1 rounded-lg border border-border bg-muted p-4 text-sm">
      <p className="font-medium">{status}</p>
      <p className="text-muted-foreground">Connection status is now shown separately for each user in Account Settings.</p>
    </div>
    {error && <p className="text-sm text-destructive" role="alert">{error}</p>}
    {notice && <p className="text-sm text-muted-foreground" role="status">{notice}</p>}
    <div className="space-y-2 border-t border-border pt-4 text-sm text-muted-foreground">
      <p>IT must add the Dynamics CRM delegated <strong>user_impersonation</strong> permission to the existing Microsoft app registration and grant the necessary consent. Each user needs access to this environment, the appropriate licence and security roles.</p>
      <p>Under Authentication, add a <strong>Web</strong> redirect URI: <code className="break-all text-foreground">https://alsight.base44.app/dataverse-callback</code>. The existing tenant ID, client ID and client secret are still used securely. Rotating the client secret requires users to reconnect.</p>
      <p>This checks authentication and environment access only. Approval routing, row-change events, email notifications, and write-back are not yet enabled; IT must first confirm the tables, approval fields, and event-delivery method.</p>
    </div>
  </section>;
}